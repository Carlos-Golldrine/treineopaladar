// Edge Function: enviar-push — disparador do streak-saver ("ofensiva em risco").
//
// Regra de negocio (docs/NOTIFICACOES.md secao 3): as 20h de Brasilia, quem tem
// ofensiva viva (streak >= 1) e treinou ONTEM mas ainda nao HOJE recebe 1 push
// pra salvar a sequencia antes da meia-noite. Teto de 1/dia por usuario (notif_log).
//
// Os ALVOS sao calculados no banco pelo RPC `alvos_ofensiva_risco()` (data/fuso e
// anti-join de teto ficam em SQL, testavel). Aqui so escolhemos a copy, resolvemos
// {N}=streak, mandamos o Web Push (VAPID) e gravamos no notif_log. Inscricao morta
// (404/410) e removida.
//
// Acionada por pg_cron (via pg_net http_post) 1x/dia as 23:00 UTC = 20:00 Brasilia.
// Deploy: `supabase functions deploy enviar-push --no-verify-jwt`
//         `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:... CRON_SECRET=...`
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contato@treineseupaladar.app';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

/* Espelha COPY_NOTIF.ofensiva_risco de app/src/notificacoes/copy.ts (variantes
   estaveis; mantenha em sincronia se a copy mudar). {N} = dias de streak. */
const OFENSIVA = [
  { titulo: 'Sua ofensiva vence à meia-noite', corpo: 'Falta uma lição pra manter os {N} dias. São 2 minutos.' },
  { titulo: 'Tchin aqui, rapidinho', corpo: 'Seu paladar treinou {N} dias seguidos. Não deixa zerar hoje.' },
  { titulo: 'O relógio tá correndo', corpo: 'Uma lição agora e a ofensiva de {N} dias continua viva.' },
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

interface Alvo {
  user_id: string;
  streak: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req) => {
  // Gate: so o cron (que conhece o CRON_SECRET) dispara. Sem verify_jwt no deploy.
  const bearer = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!CRON_SECRET || bearer !== CRON_SECRET) {
    return json({ erro: 'nao autorizado' }, 401);
  }
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return json({ erro: 'VAPID nao configurada' }, 500);
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data, error } = await sb.rpc('alvos_ofensiva_risco');
  if (error) return json({ erro: error.message }, 500);
  const alvos = (data ?? []) as Alvo[];

  /* Agrupa as inscricoes por usuario: 1 pessoa pode ter varios aparelhos, mas
     conta como 1 notificacao (1 log, teto de 1/dia). */
  const porUsuario = new Map<string, { streak: number; subs: Alvo[] }>();
  for (const a of alvos) {
    const u = porUsuario.get(a.user_id) ?? { streak: a.streak, subs: [] };
    u.subs.push(a);
    porUsuario.set(a.user_id, u);
  }

  let usuarios = 0;
  let enviados = 0;
  let mortos = 0;

  for (const [uid, u] of porUsuario) {
    const v = OFENSIVA[Math.floor(Math.random() * OFENSIVA.length)];
    const payload = JSON.stringify({
      title: v.titulo,
      body: v.corpo.replace('{N}', String(u.streak)),
      url: '/',
    });

    let algumOk = false;
    for (const s of u.subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { urgency: 'high', TTL: 4 * 3600 }, // util ate ~meia-noite; depois nao adianta
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

    /* So registra o teto quando ao menos 1 aparelho recebeu (senao tenta de novo). */
    if (algumOk) {
      await sb.from('notif_log').insert({ user_id: uid, categoria: 'ofensiva_risco' });
      usuarios++;
    }
  }

  return json({ ok: true, categoria: 'ofensiva_risco', usuarios, enviados, mortos });
});
