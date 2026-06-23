/* Teste empírico do 0019 (embaralhar opções), em transação com ROLLBACK.
   Verifica: opcoes[correta] == a opção certa em TODAS; conjunto preservado;
   distribuição não fica sempre em 0; responder_quiz valida pelo índice novo;
   perguntas_da_sessao não vaza o gabarito; e os casos de borda da revisão
   (4 opções certa@3, correta fora do range, opcoes não-array). Rollback no fim. */
import pg from 'pg';
import { readFile } from 'node:fs/promises';

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const N = 60; // muitas perguntas de 3 opções pra amostrar a aleatoriedade
const falhas = [];
const dist = { 0: 0, 1: 0, 2: 0 };

// Cada pergunta carrega o que ESPERAR: _exp = valor da opção correta após embaralhar
// (ou null = espera array vazio); _set = multiset original pra checar preservação.
const perguntas = [];
for (let i = 0; i < N; i++) {
  perguntas.push({ ordem: i + 1, pergunta: `P${i + 1}?`, opcoes: [`CERTA_${i}`, `errA_${i}`, `errB_${i}`], correta: 0,
    habilidade: 'rotulo', explicacao: `pq ${i}`, _exp: `CERTA_${i}`, _set: [`CERTA_${i}`, `errA_${i}`, `errB_${i}`] });
}
// borda: 2 opções, certa@0
perguntas.push({ ordem: 101, pergunta: '2op?', opcoes: ['C2', 'E2'], correta: 0, _exp: 'C2', _set: ['C2', 'E2'] });
// borda: 4 opções, certa@3 (o bug do clamp fixo=2 corromperia isto)
perguntas.push({ ordem: 102, pergunta: '4op?', opcoes: ['a', 'b', 'c', 'CERTA4'], correta: 3, _exp: 'CERTA4', _set: ['a', 'b', 'c', 'CERTA4'] });
// borda: correta fora do range (5) em 2 opções -> clamp p/ len-1=1 -> opção do índice 1
perguntas.push({ ordem: 103, pergunta: 'fora?', opcoes: ['x0', 'x1'], correta: 5, _exp: 'x1', _set: ['x0', 'x1'] });
// borda: opcoes NÃO-array (objeto) -> vira [] e NÃO aborta o batch
perguntas.push({ ordem: 104, pergunta: 'bad?', opcoes: { x: 1 }, correta: 0, _exp: null, _set: null });

await c.query('begin');
try {
  const sql = await readFile(new URL('./migrations/0019_quiz_embaralhar.sql', import.meta.url), 'utf8');
  await c.query(sql);

  const uid = (await c.query('select id from auth.users limit 1')).rows[0].id;
  const quiz = (await c.query('insert into quiz_sessoes (usuario_id) values ($1) returning id', [uid])).rows[0].id;

  const r = await c.query('select n8n_gravar_quiz($1::uuid, $2::jsonb, null) as out', [quiz, JSON.stringify(perguntas)]);
  console.log('n8n_gravar_quiz =>', r.rows[0].out);
  if (r.rows[0].out.inseridas !== perguntas.length) falhas.push(`inseridas ${r.rows[0].out.inseridas} != ${perguntas.length} (algum batch abortou?)`);

  const linhas = (await c.query('select ordem, opcoes, correta from quiz_perguntas where quiz_id=$1 order by ordem', [quiz])).rows;

  for (const ln of linhas) {
    const orig = perguntas.find((p) => p.ordem === ln.ordem);
    const op = ln.opcoes;
    if (orig._exp === null) {
      if (!Array.isArray(op) || op.length !== 0) falhas.push(`ordem ${ln.ordem}: esperava [] (opcoes não-array), veio ${JSON.stringify(op)}`);
      continue;
    }
    if (op[ln.correta] !== orig._exp) {
      falhas.push(`ordem ${ln.ordem}: opcoes[${ln.correta}]="${op[ln.correta]}" != esperado "${orig._exp}" (opcoes=${JSON.stringify(op)})`);
    }
    const a = [...op].sort();
    const b = [...orig._set].sort();
    if (JSON.stringify(a) !== JSON.stringify(b)) falhas.push(`ordem ${ln.ordem}: conjunto alterado ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    if (ln.ordem <= N) dist[ln.correta] = (dist[ln.correta] ?? 0) + 1;
  }

  console.log('distribuição de correta (3 opções):', dist);
  if (dist[0] === N) falhas.push('correta SEMPRE em 0 — não embaralhou');
  if ((dist[1] ?? 0) + (dist[2] ?? 0) === 0) falhas.push('correta nunca saiu de 0');

  // gabarito protegido + validação server-side (simula a sessão do dono via JWT claims)
  await c.query("select set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)", [uid]);
  const pds = (await c.query('select * from perguntas_da_sessao($1)', [quiz])).rows[0];
  if ('correta' in pds) falhas.push('perguntas_da_sessao VAZOU a correta');
  console.log('perguntas_da_sessao colunas:', Object.keys(pds).join(', '));

  const q0 = (await c.query('select id, correta from quiz_perguntas where quiz_id=$1 and ordem=1', [quiz])).rows[0];
  const certo = await c.query('select responder_quiz($1::uuid,$2::bigint,$3::int) as o', [quiz, q0.id, q0.correta]);
  if (certo.rows[0].o.acertou !== true) falhas.push(`responder_quiz índice certo (${q0.correta}) deu acertou=${certo.rows[0].o.acertou}`);
  const q1 = (await c.query('select id, correta from quiz_perguntas where quiz_id=$1 and ordem=2', [quiz])).rows[0];
  const errado = await c.query('select responder_quiz($1::uuid,$2::bigint,$3::int) as o', [quiz, q1.id, (q1.correta + 1) % 3]);
  if (errado.rows[0].o.acertou !== false) falhas.push(`responder_quiz índice errado deu acertou=${errado.rows[0].o.acertou}`);
  console.log('responder_quiz certo =>', certo.rows[0].o.acertou, '| errado =>', errado.rows[0].o.acertou);

  // o caso 4-opções certa@3 explicitamente (o que o clamp fixo quebraria)
  const q4 = linhas.find((l) => l.ordem === 102);
  console.log(`4op: opcoes=${JSON.stringify(q4.opcoes)} correta=${q4.correta} -> "${q4.opcoes[q4.correta]}" (esperado CERTA4)`);
} finally {
  await c.query('rollback');
  await c.end();
}

if (falhas.length) {
  console.log('\n=== FALHOU ===');
  for (const f of falhas) console.log('  -', f);
  process.exit(1);
}
console.log('\n=== PASSOU: embaralha, sincroniza array<->correta, cobre bordas (4op@3, fora-do-range, não-array), valida e não vaza gabarito ===');
