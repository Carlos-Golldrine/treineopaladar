/**
 * Aplica as migracoes SQL (migrations/*.sql) em ordem no banco do Supabase.
 * Le a conexao de DATABASE_URL (arquivo supabase/.env, fora do git).
 *
 *   cd supabase && npm install && npm run migrate
 *
 * Use a connection string do "Session pooler" (porta 5432) do dashboard:
 * Settings > Database > Connection string. NAO use o "Transaction pooler"
 * (porta 6543) aqui: ele nao suporta o DDL com tipos/transacoes deste script.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, 'migrations');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Copie supabase/.env.example para supabase/.env e preencha a senha do banco.');
  process.exit(1);
}

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.error('Nenhum .sql em migrations/.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log(`Conectado. Aplicando ${files.length} migracoes em ordem:\n`);

try {
  for (const f of files) {
    const sql = await readFile(join(migrationsDir, f), 'utf8');
    process.stdout.write(`  -> ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }
  const { rows } = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public'",
  );
  console.log(`\nPronto. ${rows[0].n} tabelas no schema public.`);
} catch (err) {
  console.error(`\nFALHOU: ${err.message}`);
  console.error('Se a tabela ja existia, o schema pode ter sido aplicado em parte. Veja o erro acima.');
  process.exitCode = 1;
} finally {
  await client.end();
}
