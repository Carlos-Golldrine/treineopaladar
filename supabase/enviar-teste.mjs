/**
 * Disparador de teste de Web Push (F3). Manda uma notificacao de teste para as
 * subscriptions de push_subscriptions, usando a VAPID do supabase/.env. Substitui
 * a Edge Function de cron SO para validar o pipe ponta-a-ponta (subscribe -> envio
 * -> notificacao no aparelho). A cron real vem depois.
 *
 * Uso:
 *   node --env-file=.env enviar-teste.mjs                      # todos os inscritos
 *   node --env-file=.env enviar-teste.mjs golldrinetech@gmail.com
 *   node --env-file=.env enviar-teste.mjs <user_uid>
 *   node --env-file=.env enviar-teste.mjs <alvo> "Titulo" "Corpo da notificacao"
 *
 * Le VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT e DATABASE_URL do .env.
 */
import webpush from 'web-push';
import pg from 'pg';

const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, DATABASE_URL } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Faltam VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no supabase/.env');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:teste@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const alvo = process.argv[2] || null; // email | uid | null (todos)
const titulo = process.argv[3] || 'Treine seu Paladar';
const corpo = process.argv[4] || 'Notificacao de teste chegou. Ta funcionando!';

const c = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

let uid = null;
if (alvo) {
  if (alvo.includes('@')) {
    const r = await c.query('select id from auth.users where email = $1', [alvo]);
    if (!r.rowCount) {
      console.error('Nenhum usuario com email', alvo);
      await c.end();
      process.exit(1);
    }
    uid = r.rows[0].id;
  } else {
    uid = alvo;
  }
}

const q = uid
  ? await c.query('select endpoint, p256dh, auth, plataforma from push_subscriptions where user_id = $1', [uid])
  : await c.query('select endpoint, p256dh, auth, plataforma from push_subscriptions');

if (!q.rowCount) {
  console.log('Nenhuma subscription' + (uid ? ' para esse usuario.' : '. Ninguem aceitou o primer ainda.'));
  await c.end();
  process.exit(0);
}

console.log(`Enviando para ${q.rowCount} subscription(s)...`);
const payload = JSON.stringify({ title: titulo, body: corpo, url: '/' });
let ok = 0;
let mortos = 0;
for (const s of q.rows) {
  const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
  try {
    await webpush.sendNotification(sub, payload, { urgency: 'high', TTL: 86400 });
    ok++;
    console.log('  ok   ', (s.plataforma || '?').padEnd(8), s.endpoint.slice(0, 48) + '...');
  } catch (e) {
    const code = e.statusCode;
    if (code === 404 || code === 410) {
      await c.query('delete from push_subscriptions where endpoint = $1', [s.endpoint]);
      mortos++;
      console.log('  morta', '(removida)', s.endpoint.slice(0, 40) + '...');
    } else {
      console.error('  falha', code, String(e.body || e.message || '').slice(0, 120));
    }
  }
}
console.log(`\nEnviadas: ${ok} | expiradas removidas: ${mortos}`);
await c.end();
