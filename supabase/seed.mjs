/**
 * Importa data/vinhos_clean.csv para a tabela `vinhos`.
 * Le DATABASE_URL de supabase/.env. Rode:  cd supabase && npm run seed
 * Recarregar do zero:  npm run seed -- --truncate
 *
 * Estrategia: o CSV vem do pandas com booleanos/inteiros serializados como float
 * ("0.0", "2024.0"). Por isso NAO se faz COPY direto em `vinhos`. Em vez disso:
 *   1. cria staging `_vinhos_import` com TODAS as colunas em text (aceita qualquer valor);
 *   2. COPY do CSV para o staging;
 *   3. INSERT em `vinhos` com cast por coluna, lendo os tipos reais do information_schema
 *      (boolean tolera 0.0/1.0/true/false; int faz ::numeric::int; etc.);
 *   4. derruba o staging.
 */
import fs, { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import { from as copyFrom } from 'pg-copy-streams';

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = join(here, '..', 'data', 'vinhos_clean.csv');
const STAGING = '_vinhos_import';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Preencha a senha em supabase/.env.');
  process.exit(1);
}

/* Le o cabecalho do CSV (sem BOM, sem CR) para saber a ordem das colunas. */
function lerCabecalho(path) {
  const fd = fs.openSync(path, 'r');
  const buf = Buffer.alloc(65536);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  fs.closeSync(fd);
  const linha = buf.toString('utf8', 0, n).split(/\r?\n/)[0].replace(/^﻿/, '');
  return linha.split(',').map((s) => s.replace(/\r$/, '').trim());
}

/* Expressao de cast do texto do staging para o tipo real da coluna em `vinhos`. */
function castExpr(col, dataType, udtName) {
  const s = `nullif("${col}", '')`;
  if (dataType === 'boolean') {
    return `case when lower(${s}) in ('true','t') then true `
      + `when lower(${s}) in ('false','f') then false `
      + `when ${s} is not null then (${s}::numeric <> 0) else null end`;
  }
  if (dataType === 'smallint' || dataType === 'integer' || dataType === 'bigint') {
    return `(${s}::numeric)::${dataType}`;
  }
  if (dataType === 'numeric') return `${s}::numeric`;
  if (dataType === 'date') return `${s}::date`;
  if (dataType.startsWith('timestamp')) return `${s}::timestamptz`;
  if (dataType === 'USER-DEFINED') return `${s}::${udtName}`; // enum tipo_vinho
  return s; // text e afins
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  const { rows: [{ n }] } = await client.query('select count(*)::int n from vinhos');
  const truncate = process.argv.includes('--truncate');
  if (n > 0 && !truncate) {
    console.log(`vinhos ja tem ${n} linhas. Para recarregar do zero: npm run seed -- --truncate`);
    process.exit(0);
  }
  if (truncate && n > 0) {
    console.log(`Limpando ${n} linhas existentes...`);
    await client.query('truncate table vinhos cascade');
  }

  const cols = lerCabecalho(csvPath);

  // Tipos reais da tabela vinhos.
  const { rows: meta } = await client.query(
    `select column_name, data_type, udt_name from information_schema.columns
     where table_schema = 'public' and table_name = 'vinhos'`,
  );
  const tipo = Object.fromEntries(meta.map((r) => [r.column_name, r]));

  // Staging: uma coluna text por coluna do CSV, na mesma ordem.
  console.log(`Criando staging ${STAGING} (${cols.length} colunas text)...`);
  await client.query(`drop table if exists ${STAGING}`);
  await client.query(`create table ${STAGING} (${cols.map((c) => `"${c}" text`).join(', ')})`);

  console.log('COPY do CSV para o staging...');
  const stream = client.query(copyFrom(`COPY ${STAGING} FROM STDIN WITH (FORMAT csv, HEADER true)`));
  await pipeline(createReadStream(csvPath), stream);

  // Insere em vinhos so as colunas que existem na tabela, com cast por tipo.
  const usar = cols.filter((c) => tipo[c]);
  const ignoradas = cols.filter((c) => !tipo[c]);
  if (ignoradas.length) console.log(`Colunas do CSV ignoradas (nao existem em vinhos): ${ignoradas.join(', ')}`);

  const selects = usar.map((c) => `${castExpr(c, tipo[c].data_type, tipo[c].udt_name)} as "${c}"`);
  console.log('INSERT em vinhos com cast...');
  await client.query(
    `insert into vinhos (${usar.map((c) => `"${c}"`).join(', ')}) select ${selects.join(', ')} from ${STAGING}`,
  );

  const { rows: [r] } = await client.query(
    "select count(*)::int total, count(*) filter (where view_estrita)::int view_estrita, count(distinct tipo)::int tipos from vinhos",
  );
  console.log(`\nPronto. total=${r.total}  view_estrita=${r.view_estrita}  tipos=${r.tipos}`);
} catch (e) {
  console.error('\nFALHOU:', e.message);
  process.exitCode = 1;
} finally {
  try { await client.query(`drop table if exists ${STAGING}`); } catch { /* ignore */ }
  try { await client.end(); } catch { /* ignore */ }
}
