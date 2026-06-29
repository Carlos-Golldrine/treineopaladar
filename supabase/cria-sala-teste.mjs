/* Cria uma SALA DE TESTE real (commit) pra validar a UI ao vivo no preview.
   Imprime o codigo. Limpe depois com: delete from salas where codigo='XXXXXX'. */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const comoUsuario = (uid) => c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, false)", [uid]);
try {
  const host = (await c.query("select id, nome from profiles where nome is not null limit 1")).rows[0];
  const quiz = (await c.query("insert into quiz_sessoes (usuario_id, status, vinho) values ($1,'pronto','{\"nome\":\"Casillero del Diablo Carménère\"}') returning id", [host.id])).rows[0].id;
  const perg = [
    { o: 1, p: 'Qual o tipo deste vinho?', op: ['Tinto', 'Branco', 'Rosé'], cor: 0, h: 'rotulo' },
    { o: 2, p: 'Qual a uva principal?', op: ['Carménère', 'Chardonnay', 'Malbec'], cor: 0, h: 'rotulo' },
    { o: 3, p: 'De qual país é?', op: ['Itália', 'Chile', 'França'], cor: 1, h: 'rotulo' },
    { o: 4, p: 'Como tende a ser o corpo?', op: ['Médio a encorpado', 'Leve', 'Sem corpo'], cor: 0, h: 'corpo' },
    { o: 5, p: 'Que nota costuma aparecer?', op: ['Pimentão e frutas escuras', 'Maçã verde', 'Banana'], cor: 0, h: 'frutado' },
  ];
  for (const x of perg) await c.query('insert into quiz_perguntas (quiz_id, ordem, pergunta, opcoes, correta, explicacao) values ($1,$2,$3,$4,$5,$6)', [quiz, x.o, x.p, JSON.stringify(x.op), x.cor, 'Conhecimento do vinho.']);
  await comoUsuario(host.id);
  const r = (await c.query('select criar_sala($1) o', [quiz])).rows[0].o;
  // mais um participante fake pra o ranking nao ficar vazio
  const p2 = (await c.query("select id from profiles where nome is not null and id <> $1 limit 1", [host.id])).rows[0];
  if (p2) { await comoUsuario(p2.id); await c.query('select entrar_sala($1)', [r.codigo]); await c.query("update sala_participantes set pontos=30, acertos=3, respondidas=3 where sala_id=$1 and user_id=$2", [r.sala_id, p2.id]); }
  console.log('SALA CRIADA — entre com o codigo:', r.codigo);
  console.log('sala_id:', r.sala_id, '| host:', host.nome);
} finally {
  await c.end();
}
