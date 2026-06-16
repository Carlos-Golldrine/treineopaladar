/**
 * Aplica SOMENTE a migration 0008_mesa_convite.sql (idempotente).
 *   cd supabase && node --env-file=.env apply_0008.mjs
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL (supabase/.env).');
  process.exit(1);
}

const sql = await readFile(join(here, 'migrations', '0008_mesa_convite.sql'), 'utf8');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  const cols = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='mesas' and column_name in ('privada','codigo_convite') order by column_name",
  );
  const fns = await client.query(
    "select proname from pg_proc where proname in ('entrar_por_convite','definir_privacidade_mesa','garantir_mesa_semana') order by proname",
  );
  console.log('OK 0008 aplicada.');
  console.log('colunas mesas:', cols.rows.map((r) => r.column_name).join(', '));
  console.log('funcoes:', fns.rows.map((r) => r.proname).join(', '));
} catch (e) {
  console.error('FALHOU:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
