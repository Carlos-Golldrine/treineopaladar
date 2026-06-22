// Edge Function: enviar-push — disparador das notificacoes agendadas (push).
//
// run 'noite' (20h BRT): streak-saver (ofensiva em risco).
// run 'manha' (9h  BRT): Desafio do Dia + Win-back (D3/D7/D14).
// Regras em docs/NOTIFICACOES.md. Os ALVOS vem dos RPCs alvos_* (data/fuso e teto
// de frequencia ficam em SQL). Teto: engajamento (desafio/winback/meta) divide 1/dia;
// o streak-saver da noite tem teto proprio e segue independente.
//
// Gate: exige JWT com role 'service_role' (deixar "Verify JWT" LIGADO no deploy).
// Body opcional (JSON): { run?: 'manha'|'noite', soUsuario?: '<uuid>' }
//   - run: qual lote rodar (default: deduz pelo horario de Brasilia).
//   - soUsuario: filtra o envio a UM usuario (so pra teste; o cron nao envia).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT_RAW = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:mkt@lapm.com.br';
const VAPID_SUBJECT = /^(mailto:|https?:)/i.test(VAPID_SUBJECT_RAW)
  ? VAPID_SUBJECT_RAW
  : `mailto:${VAPID_SUBJECT_RAW}`;

interface Variante {
  titulo: string;
  corpo: string;
  url: string;
}

/* Espelha app/src/notificacoes/copy.ts. {N} = dias de streak (so na ofensiva). */
const COPY: Record<string, Variante[]> = {
  ofensiva_risco: [
    { titulo: 'Sua ofensiva vence à meia-noite', corpo: 'Falta uma lição pra manter os {N} dias. São 2 minutos.', url: '/' },
    { titulo: 'Tchin aqui, rapidinho', corpo: 'Seu paladar treinou {N} dias seguidos. Não deixa zerar hoje.', url: '/' },
    { titulo: 'O relógio tá correndo', corpo: 'Uma lição agora e a ofensiva de {N} dias continua viva.', url: '/' },
  ],
  desafio_dia: [
    { titulo: 'Rótulo do dia chegou', corpo: 'Quatro perguntas, um rótulo. Será que você acerta hoje?', url: '/desafio' },
    { titulo: 'A mesa já encarou o desafio', corpo: 'Seu desafio de hoje ainda tá aberto. Topa?', url: '/desafio' },
  ],
  winback_d3: [
    { titulo: 'Cadê você?', corpo: 'Faz três dias. A gente recomeça leve, do ponto onde parou.', url: '/' },
    { titulo: 'Três dias sem treino', corpo: 'Seu progresso tá guardado. Volta no seu ritmo, sem corre.', url: '/' },
  ],
  winback_d7: [
    { titulo: 'Seu paladar sente falta de treino', corpo: 'Uma semana parado. Volta quando quiser, sem pressa.', url: '/' },
    { titulo: 'Faz uma semana', corpo: 'O treino fica do jeito que você deixou. Só tocar pra seguir.', url: '/' },
  ],
  winback_d14: [
    { titulo: 'Ainda dá pra retomar', corpo: 'Seu progresso tá guardado. Sem cobrança, no seu tempo.', url: '/' },
    { titulo: 'Duas semanas, e tudo bem', corpo: 'Seu paladar não esquece o que aprendeu. Quando der, a gente continua.', url: '/' },
  ],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Le o claim `role` do JWT (assinatura ja verificada pelo gateway). */
function roleDoToken(req: Request): string | null {
  const tok = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const partes = tok.split('.');
  if (partes.length < 2) return null;
  try {
    let b = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return (JSON.parse(atob(b)) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

interface Alvo {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  streak?: number;
  janela?: string;
}
type SB = ReturnType<typeof createClient>;

/** Agrupa por usuario, escolhe variante, envia, grava o teto e limpa inscricao morta. */
async function enviarLote(
  sb: SB,
  rows: Alvo[],
  categoriaDe: (r: Alvo) => string,
  soUsuario?: string,
): Promise<{ usuarios: number; enviados: number; mortos: number }> {
  const alvos = soUsuario ? rows.filter((r) => r.user_id === soUsuario) : rows;
  const porUsuario = new Map<string, Alvo[]>();
  for (const r of alvos) {
    const a = porUsuario.get(r.user_id) ?? [];
    a.push(r);
    porUsuario.set(r.user_id, a);
  }

  let usuarios = 0;
  let enviados = 0;
  let mortos = 0;
  for (const [uid, subs] of porUsuario) {
    const cat = categoriaDe(subs[0]);
    const variantes = COPY[cat] ?? [];
    if (variantes.length === 0) continue;
    const v = variantes[Math.floor(Math.random() * variantes.length)];
    const payload = JSON.stringify({
      title: v.titulo,
      body: v.corpo.replace(/\{N\}/g, String(subs[0].streak ?? '')),
      url: v.url,
    });

    let algumOk = false;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { urgency: 'high', TTL: 4 * 3600 },
        );
        enviados++;
        algumOk = true;
      } catch (e) {
        const code = (e as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          mortos++;
        }
      }
    }
    if (algumOk) {
      await sb.from('notif_log').insert({ user_id: uid, categoria: cat });
      usuarios++;
    }
  }
  return { usuarios, enviados, mortos };
}

Deno.serve(async (req) => {
  if (roleDoToken(req) !== 'service_role') return json({ erro: 'nao autorizado' }, 401);
  if (!SERVICE_ROLE) return json({ erro: 'service key ausente no ambiente' }, 500);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ erro: 'VAPID nao configurada' }, 500);

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const body = (await req.json().catch(() => ({}))) as { run?: string; soUsuario?: string };
  const horaBR = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).format(new Date()),
  );
  const run = body.run ?? (horaBR >= 18 ? 'noite' : 'manha');
  const so = body.soUsuario;

  const out: Record<string, unknown> = { run };
  try {
    if (run === 'noite') {
      const { data, error } = await sb.rpc('alvos_ofensiva_risco');
      if (error) return json({ erro: error.message }, 500);
      out.ofensiva_risco = await enviarLote(sb, (data ?? []) as Alvo[], () => 'ofensiva_risco', so);
    } else {
      const des = await sb.rpc('alvos_desafio_dia');
      if (des.error) return json({ erro: des.error.message }, 500);
      out.desafio_dia = await enviarLote(sb, (des.data ?? []) as Alvo[], () => 'desafio_dia', so);

      const win = await sb.rpc('alvos_winback');
      if (win.error) return json({ erro: win.error.message }, 500);
      out.winback = await enviarLote(sb, (win.data ?? []) as Alvo[], (r) => `winback_${r.janela}`, so);
    }
  } catch (e) {
    return json({ erro: String((e as Error)?.message ?? e) }, 500);
  }

  return json({ ok: true, ...out });
});
