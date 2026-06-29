/* Dispara o inicio de uma sala de teste como o ANFITRIAO (pra testar a sincronizacao
   ao vivo no preview). Uso: node --env-file=.env inicia-sala-teste.mjs [CODIGO] */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  const codigo = (process.argv[2] || '3XZ762').toUpperCase();
  const sala = (await c.query('select id, anfitriao_id from salas where codigo=$1', [codigo])).rows[0];
  if (!sala) throw new Error('sala nao encontrada: ' + codigo);
  await c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, false)", [sala.anfitriao_id]);
  const r = (await c.query('select iniciar_sala($1) o', [sala.id])).rows[0].o;
  console.log('SALA INICIADA pelo host:', codigo, '=>', JSON.stringify(r));
} finally {
  await c.end();
}
