/* Remove salas de teste (e os quizzes que elas usaram). Uso: node --env-file=.env limpa-salas-teste.mjs COD1 COD2 ... */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const codes = process.argv.slice(2).map((s) => s.toUpperCase());
if (codes.length === 0) { console.log('passe os codigos'); await c.end(); process.exit(0); }
const q = (await c.query('select id, quiz_id, codigo from salas where codigo = any($1)', [codes])).rows;
for (const s of q) {
  await c.query('delete from salas where id=$1', [s.id]);
  await c.query('delete from quiz_sessoes where id=$1', [s.quiz_id]);
}
console.log('removidas:', q.map((s) => s.codigo).join(', ') || '(nenhuma encontrada)');
await c.end();
