/**
 * Dispara VARIAS notificacoes de teste (uma de cada categoria da copy) para
 * encher a barra de notificacoes. Espelha app/src/notificacoes/copy.ts, com as
 * variaveis ja resolvidas. Sem `tag` -> cada uma vira uma notificacao separada
 * (empilham, nao se substituem).
 *
 * Uso:
 *   node --env-file=.env enviar-varias.mjs                 # todos os inscritos
 *   node --env-file=.env enviar-varias.mjs voce@exemplo.com
 *   node --env-file=.env enviar-varias.mjs <uid>
 *
 * Le VAPID_* e DATABASE_URL do supabase/.env.
 */
import webpush from 'web-push';
import pg from 'pg';

const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, DATABASE_URL } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Faltam VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY no supabase/.env');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:teste@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/* Uma de cada categoria (variaveis resolvidas), com o deep-link de cada. */
const NOTIFS = [
  { title: 'Sua ofensiva vence à meia-noite', body: 'Falta uma lição pra manter os 7 dias. São 2 minutos.', url: '/' },
  { title: 'Faltou pouco hoje', body: 'Sua meta do dia tá quase fechando. Uma lição resolve.', url: '/' },
  { title: '7 dias. Olha você.', body: 'Seu paladar tá ficando afiado de verdade. Amanhã tem mais.', url: '/' },
  { title: 'O vinho perguntou de você', body: 'Bora destravar mais um eixo do paladar hoje?', url: '/trilha' },
  { title: 'Cadê você?', body: 'Faz três dias. A gente recomeça leve, do ponto onde parou.', url: '/' },
  { title: 'Rótulo do dia chegou', body: 'Quatro perguntas, um rótulo. Será que você acerta hoje?', url: '/desafio' },
  { title: 'Você subiu pra Reserva', body: 'Boa semana de treino. A divisão nova começa agora.', url: '/mesa' },
  { title: 'Alguém deu um Tchin pra você', body: 'Diva curtiu seu progresso na mesa. Dá uma olhada.', url: '/mesa' },
  { title: 'Coroa nova no bolso', body: 'Você dominou Corpo. Tá lendo vinho que nem gente grande.', url: '/' },
  { title: 'Subiu de nível', body: 'Seu Score de Paladar deu um salto. Olha só onde você chegou.', url: '/perfil' },
];

const INTERVALO_MS = 1500;
const alvo = process.argv[2] || null;

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
  ? await c.query('select endpoint, p256dh, auth from push_subscriptions where user_id = $1', [uid])
  : await c.query('select endpoint, p256dh, auth from push_subscriptions');

if (!q.rowCount) {
  console.log('Nenhuma subscription. Ative as notificacoes no app primeiro (Permitir).');
  await c.end();
  process.exit(0);
}

console.log(`Enviando ${NOTIFS.length} notificacoes para ${q.rowCount} subscription(s)...\n`);
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;
let mortos = 0;

for (const n of NOTIFS) {
  const payload = JSON.stringify({ title: n.title, body: n.body, url: n.url }); // sem tag => empilha
  for (const s of q.rows) {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    try {
      await webpush.sendNotification(sub, payload, { urgency: 'high', TTL: 86400 });
      ok++;
    } catch (e) {
      const code = e.statusCode;
      if (code === 404 || code === 410) {
        await c.query('delete from push_subscriptions where endpoint = $1', [s.endpoint]);
        mortos++;
      } else {
        console.error('  falha', code, String(e.body || e.message || '').slice(0, 100));
      }
    }
  }
  console.log('  enviada:', n.title);
  await dorme(INTERVALO_MS);
}

console.log(`\nTotal enviado: ${ok} | inscricoes expiradas removidas: ${mortos}`);
await c.end();
