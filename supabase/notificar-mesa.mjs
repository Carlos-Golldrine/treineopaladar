/**
 * Envio PONTUAL e AUTORIZADO pelo dono: um Web Push custom para os membros de UMA
 * mesa (identificada pelo codigo de convite). Pensado para o empurraozinho social
 * da liga ("fulano assumiu a ponta, vai deixar assim?").
 *
 * Regras de cuidado:
 *   - dry-run por padrao: so MOSTRA ranking, destinatarios e a copy. Nao envia.
 *   - --apply: envia de verdade (web-push), limpa inscricao morta (404/410) e
 *     registra em notif_log (categoria 'mesa_lider').
 *   - NAO manda pro proprio lider (posicao 1).
 *   - So alcanca quem tem push_subscription (ou seja, ligou as notificacoes).
 *   - O nome do lider vem do banco (ranking_da_mesa) -> a copy nunca mente.
 *
 * Uso: node --env-file=.env notificar-mesa.mjs <codigo_convite> [--apply]
 * Ex.: node --env-file=.env notificar-mesa.mjs 1c424225
 */
import pg from 'pg';
import webpush from 'web-push';

const CODIGO = (process.argv[2] || '').trim().toLowerCase();
const APPLY = process.argv.includes('--apply');
/* Por padrão NÃO reenvia para quem já recebeu 'mesa_lider' (idempotência: evita
   re-spam ao rodar de novo só para os que faltaram). --reenviar ignora a trava. */
const REENVIAR = process.argv.includes('--reenviar');
if (!CODIGO || CODIGO.startsWith('--')) {
  console.error('uso: node --env-file=.env notificar-mesa.mjs <codigo_convite> [--apply]');
  process.exit(1);
}

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, DATABASE_URL } = process.env;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:mkt@lapm.com.br';
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('VAPID ausente no .env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/* Monta a copy (titulo/corpo) a partir do nome real do lider. Voz da marca:
   provocacao leve da Mesa, sem emoji e sem travessao. */
function copyDoLider(nomeLider) {
  return {
    title: `${nomeLider} está liderando a mesa`,
    body: `Está na frente da pontuação esta semana. Vai deixar assim?`,
    url: '/mesa',
  };
}

const c = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

try {
  // 1) Acha a mesa pelo codigo de convite
  const mesaRes = await c.query(
    'select id, semana_iso, divisao, privada, codigo_convite from mesas where codigo_convite = $1 limit 1',
    [CODIGO],
  );
  if (mesaRes.rowCount === 0) {
    console.error(`Mesa com codigo "${CODIGO}" nao encontrada.`);
    process.exit(1);
  }
  const mesa = mesaRes.rows[0];
  console.log(`Mesa ${mesa.codigo_convite} | ${mesa.semana_iso} | ${mesa.divisao} | ${mesa.privada ? 'privada' : 'publica'}`);
  console.log('mesa_id:', mesa.id, '\n');

  // 2) Ranking ao vivo (mesma logica do ranking_da_mesa, calculada direto: o RPC
  //    de producao exige is_mesa_member(auth.uid()), que é nulo fora do app).
  const rank = await c.query(
    `select mm.user_id, p.nome,
            greatest(0, coalesce(w.xp_total, 0) - mm.xp_base)::int as pontos,
            (row_number() over (order by greatest(0, coalesce(w.xp_total, 0) - mm.xp_base) desc))::int as posicao
       from mesa_membros mm
       left join profiles p on p.id = mm.user_id
       left join wallet w on w.user_id = mm.user_id
      where mm.mesa_id = $1
      order by pontos desc`,
    [mesa.id],
  );
  if (rank.rowCount === 0) {
    console.error('Mesa sem membros.');
    process.exit(1);
  }
  console.log('Ranking:');
  for (const r of rank.rows) {
    console.log(`  ${r.posicao}. ${r.nome ?? '(sem nome)'} — ${r.pontos} pts  [${r.user_id.slice(0, 8)}]`);
  }
  const lider = rank.rows.find((r) => r.posicao === 1);
  const nomeLider = lider?.nome?.trim() || 'Alguém';
  console.log(`\nLíder: ${nomeLider} (${lider.pontos} pts)`);
  if (lider.pontos === 0) console.log('AVISO: o líder está com 0 pts (ninguém pontuou ainda nesta semana).');

  const copy = copyDoLider(nomeLider);
  console.log('\nCopy que será enviada:');
  console.log('  título:', copy.title);
  console.log('  corpo :', copy.body);
  console.log('  url   :', copy.url);

  // 3) Destinatarios = membros com push_subscription, EXCETO o lider
  const subs = await c.query(
    `select ps.user_id, ps.endpoint, ps.p256dh, ps.auth, p.nome
       from push_subscriptions ps
       join mesa_membros mm on mm.user_id = ps.user_id and mm.mesa_id = $1
       left join profiles p on p.id = ps.user_id
      where ps.user_id <> $2`,
    [mesa.id, lider.user_id],
  );

  // Idempotência: quem já recebeu 'mesa_lider' (pulado, a menos que --reenviar).
  const jaEnviado = new Set(
    (await c.query("select distinct user_id from notif_log where categoria = 'mesa_lider'")).rows.map((r) => r.user_id),
  );

  const porUsuario = new Map();
  const pulados = [];
  for (const s of subs.rows) {
    if (!REENVIAR && jaEnviado.has(s.user_id)) {
      if (!pulados.includes(s.nome)) pulados.push(s.nome);
      continue;
    }
    const a = porUsuario.get(s.user_id) ?? { nome: s.nome, subs: [] };
    a.subs.push(s);
    porUsuario.set(s.user_id, a);
  }
  const totalAparelhos = [...porUsuario.values()].reduce((n, i) => n + i.subs.length, 0);
  if (pulados.length) console.log(`\nJá receberam antes (pulando): ${pulados.map((n) => n ?? '(sem nome)').join(', ')}`);
  console.log(`\nDestinatários (com notificações ligadas, fora o líder): ${porUsuario.size} pessoa(s), ${totalAparelhos} aparelho(s)`);
  for (const [, info] of porUsuario) {
    console.log(`  - ${info.nome ?? '(sem nome)'}: ${info.subs.length} aparelho(s)`);
  }

  if (porUsuario.size === 0) {
    console.log('\nNinguém novo pra notificar. Nada a enviar.');
    process.exit(0);
  }

  if (!APPLY) {
    console.log('\n[DRY-RUN] nada foi enviado. Rode de novo com --apply para disparar.');
    process.exit(0);
  }

  // 4) Envio real
  const payload = JSON.stringify({ title: copy.title, body: copy.body, url: copy.url });
  let enviados = 0;
  let pessoas = 0;
  let mortos = 0;
  for (const [uid, info] of porUsuario) {
    let algumOk = false;
    for (const s of info.subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { urgency: 'high', TTL: 4 * 3600 },
        );
        enviados++;
        algumOk = true;
      } catch (e) {
        const code = e?.statusCode;
        if (code === 404 || code === 410) {
          await c.query('delete from push_subscriptions where endpoint = $1', [s.endpoint]);
          mortos++;
        } else {
          console.error(`  falha (${info.nome ?? uid.slice(0, 8)}):`, e?.statusCode ?? e?.message ?? e);
        }
      }
    }
    if (algumOk) {
      await c.query('insert into notif_log (user_id, categoria) values ($1, $2)', [uid, 'mesa_lider']);
      pessoas++;
    }
  }
  console.log(`\nOK — enviado: ${pessoas} pessoa(s), ${enviados} aparelho(s). Inscrições mortas removidas: ${mortos}.`);
} finally {
  await c.end();
}
