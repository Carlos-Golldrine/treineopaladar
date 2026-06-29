/* Faz os participantes COM PERFIL (host + p2) responderem a pergunta atual de uma sala,
   deixando o usuario anonimo (o preview) responder pela UI. Serve pra testar o lockstep
   no preview: depois que o preview responde, rode isto pra fechar "todos responderam".
   Uso: node --env-file=.env responde-sala-teste.mjs CODIGO [erra] */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const como = (uid) => c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, false)", [uid]);
try {
  const codigo = (process.argv[2] || '').toUpperCase();
  const errar = process.argv[3] === 'erra';
  const sala = (await c.query('select id, quiz_id, pergunta_idx from salas where codigo=$1', [codigo])).rows[0];
  if (!sala) throw new Error('sala nao encontrada: ' + codigo);
  const perg = (await c.query('select id, correta, opcoes from quiz_perguntas where quiz_id=$1 order by ordem offset $2 limit 1', [sala.quiz_id, sala.pergunta_idx])).rows[0];
  const nOpc = Array.isArray(perg.opcoes) ? perg.opcoes.length : 3;
  const resposta = errar ? (perg.correta + 1) % nOpc : perg.correta;
  // participantes que tem perfil (nome) = nao-anonimos
  const alvos = (await c.query(
    `select sp.user_id from sala_participantes sp join profiles p on p.id = sp.user_id
     where sp.sala_id=$1 and p.nome is not null`, [sala.id])).rows;
  for (const a of alvos) {
    await como(a.user_id);
    try { await c.query('select responder_sala($1,$2,$3)', [sala.id, perg.id, resposta]); }
    catch (e) { console.log('  (pulou', a.user_id.slice(0, 8), '-', e.message, ')'); }
  }
  console.log(`${alvos.length} participante(s) com perfil responderam a pergunta idx=${sala.pergunta_idx} (${errar ? 'errando' : 'acertando'})`);
} finally {
  await c.end();
}
