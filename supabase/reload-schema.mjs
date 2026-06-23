/* Recarrega o schema do PostgREST (pra novos RPCs aparecerem na API REST) e
   confere funções pedidas. Uso: node --env-file=.env reload-schema.mjs [fn1 fn2 ...] */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  await c.query("notify pgrst, 'reload schema'");
  console.log('schema do PostgREST recarregado.');
  const fns = process.argv.slice(2);
  for (const fn of fns) {
    const r = await c.query('select count(*)::int n from pg_proc where proname=$1', [fn]);
    console.log(`  ${fn}: ${r.rows[0].n > 0 ? 'presente' : 'AUSENTE'}`);
  }
} finally {
  await c.end();
}
