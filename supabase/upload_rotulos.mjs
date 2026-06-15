/**
 * Sobe as imagens de data/imagens/ para o bucket 'rotulos' do Supabase Storage
 * e popula vinhos.thumbnail_url. Le supabase/.env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (secreto), DATABASE_URL
 * Rode:  cd supabase && npm run upload-rotulos
 * Idempotente: x-upsert sobrescreve; rode de novo para retomar/atualizar.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const imgDir = join(here, '..', 'data', 'imagens');

const URL_BASE = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB = process.env.DATABASE_URL;
if (!URL_BASE || !SERVICE || !DB) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL no supabase/.env');
  process.exit(1);
}

const CT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

const arquivos = (await readdir(imgDir)).filter((f) => CT[extname(f).toLowerCase()]);
console.log(`${arquivos.length} imagens em data/imagens/. Subindo para o bucket 'rotulos'...`);

let ok = 0;
let falha = 0;
const mapeados = []; // { id, url }
const CONC = 12;

async function subir(nome) {
  const ext = extname(nome).toLowerCase();
  const id = basename(nome, ext);
  const corpo = await readFile(join(imgDir, nome));
  try {
    const r = await fetch(`${URL_BASE}/storage/v1/object/rotulos/${encodeURIComponent(nome)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE}`,
        apikey: SERVICE,
        'Content-Type': CT[ext],
        'x-upsert': 'true',
      },
      body: corpo,
    });
    if (r.ok) {
      ok++;
      mapeados.push({ id, url: `${URL_BASE}/storage/v1/object/public/rotulos/${nome}` });
    } else {
      falha++;
      if (falha <= 5) console.log('\n  falha', nome, r.status, (await r.text()).slice(0, 120));
    }
  } catch (e) {
    falha++;
    if (falha <= 5) console.log('\n  erro', nome, e.message);
  }
}

for (let i = 0; i < arquivos.length; i += CONC) {
  await Promise.all(arquivos.slice(i, i + CONC).map(subir));
  process.stdout.write(`\r  ${ok + falha}/${arquivos.length} (ok=${ok} falha=${falha})`);
}
console.log(`\nUpload concluido: ok=${ok} falha=${falha}`);

if (mapeados.length) {
  const c = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const res = await c.query(
    `update vinhos v set thumbnail_url = u.url
     from (select unnest($1::text[]) as id, unnest($2::text[]) as url) u
     where v.id = u.id`,
    [mapeados.map((m) => m.id), mapeados.map((m) => m.url)],
  );
  console.log(`thumbnail_url atualizado em ${res.rowCount} de ${mapeados.length} vinhos enviados.`);
  await c.end();
}
