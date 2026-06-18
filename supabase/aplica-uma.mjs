/**
 * Aplica UMA migration especifica (sem re-rodar as outras, que tem CREATE POLICY
 * nao-idempotente). Uso: node --env-file=.env aplica-uma.mjs 0009_perfil.sql
 * Le DATABASE_URL do supabase/.env (Session pooler, porta 5432).
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const arquivo = process.argv[2];
if (!arquivo) {
  console.error('Uso: node --env-file=.env aplica-uma.mjs <migration.sql>');
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL em supabase/.env');
  process.exit(1);
}

const sql = await readFile(join(here, 'migrations', arquivo), 'utf8');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  process.stdout.write(`Aplicando ${arquivo} ... `);
  await client.query(sql);
  console.log('ok');

  const cols = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='profiles' and column_name in ('nome','avatar','perfil_ts') order by column_name",
  );
  console.log('profiles agora tem:', cols.rows.map((r) => r.column_name).join(', ') || '(nenhuma das novas)');

  const fn = await client.query(
    "select pg_get_function_result(oid) as ret from pg_proc where proname = 'ranking_da_mesa'",
  );
  console.log('ranking_da_mesa retorna:', fn.rows[0]?.ret ?? '(nao encontrada)');
} catch (e) {
  console.error(`\nFALHOU: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
