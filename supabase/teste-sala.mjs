/* Teste E2E da Sala Ao Vivo (0021), em transacao com ROLLBACK. Simula host +
   participante via request.jwt.claims. Verifica: criar/entrar, gabarito protegido,
   pontuacao (+10/acerto), nao-duplica resposta, ranking ordenado. Nao toca producao. */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const falhas = [];
const comoUsuario = (uid) => c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, true)", [uid]);

await c.query('begin');
try {
  // dois usuarios reais (com nome no profiles)
  const us = (await c.query("select id, nome from profiles where nome is not null limit 2")).rows;
  if (us.length < 2) throw new Error('precisa de 2 profiles com nome pra testar');
  const host = us[0], part = us[1];
  console.log('host:', host.nome, '| participante:', part.nome);

  // quiz pronto do host + 3 perguntas (correta no indice 0/1/2)
  const quiz = (await c.query("insert into quiz_sessoes (usuario_id, status, vinho) values ($1,'pronto','{\"nome\":\"Malbec Teste\"}') returning id", [host.id])).rows[0].id;
  for (const p of [
    { ordem: 1, perg: 'Tipo?', op: ['Tinto', 'Branco', 'Rose'], cor: 0 },
    { ordem: 2, perg: 'Uva?', op: ['Merlot', 'Malbec', 'Syrah'], cor: 1 },
    { ordem: 3, perg: 'Pais?', op: ['Chile', 'Italia', 'Argentina'], cor: 2 },
  ]) {
    await c.query('insert into quiz_perguntas (quiz_id, ordem, pergunta, opcoes, correta, explicacao) values ($1,$2,$3,$4,$5,$6)',
      [quiz, p.ordem, p.perg, JSON.stringify(p.op), p.cor, 'pq']);
  }

  // host cria a sala
  await comoUsuario(host.id);
  const criada = (await c.query('select criar_sala($1) o', [quiz])).rows[0].o;
  console.log('sala criada:', criada.codigo, '| id', criada.sala_id.slice(0, 8));
  if (!criada.codigo || criada.codigo.length !== 6) falhas.push('codigo invalido: ' + criada.codigo);
  const sala = criada.sala_id;

  // participante entra
  await comoUsuario(part.id);
  const ent = (await c.query('select entrar_sala($1) o', [criada.codigo])).rows[0].o;
  if (ent.sala_id !== sala) falhas.push('entrar_sala devolveu sala errada');
  console.log('participante entrou. vinho na sala:', ent.vinho?.nome);

  // gabarito protegido: perguntas_da_sala NAO traz "correta"
  const perg = (await c.query('select * from perguntas_da_sala($1) order by ordem', [sala])).rows;
  if ('correta' in (perg[0] || {})) falhas.push('perguntas_da_sala VAZOU a correta');
  console.log('perguntas (sem gabarito):', perg.length, '| colunas:', Object.keys(perg[0]).join(','));
  const ids = {}; for (const p of perg) ids[p.ordem] = p.id;

  // participante responde: ordem1 certa(0), ordem2 errada(0, certo e 1), ordem3 certa(2)
  await comoUsuario(part.id);
  let r;
  r = (await c.query('select responder_sala($1,$2,$3) o', [sala, ids[1], 0])).rows[0].o; if (!r.acertou) falhas.push('o1 deveria acertar');
  r = (await c.query('select responder_sala($1,$2,$3) o', [sala, ids[2], 0])).rows[0].o; if (r.acertou) falhas.push('o2 deveria errar');
  r = (await c.query('select responder_sala($1,$2,$3) o', [sala, ids[3], 2])).rows[0].o; if (!r.acertou) falhas.push('o3 deveria acertar');
  // dupla resposta na mesma pergunta nao deve recontar
  const dup = (await c.query('select responder_sala($1,$2,$3) o', [sala, ids[1], 1])).rows[0].o;
  if (dup.nova !== false) falhas.push('resposta repetida foi recontada (nova deveria ser false)');

  // host responde so a ordem1 certa
  await comoUsuario(host.id);
  await c.query('select responder_sala($1,$2,$3) o', [sala, ids[1], 0]);

  // ranking ao vivo
  await comoUsuario(host.id);
  const rank = (await c.query('select * from ranking_sala($1)', [sala])).rows;
  console.log('\nRanking:');
  for (const x of rank) console.log(`  ${x.posicao}. ${x.nome} — ${x.pontos} pts (${x.acertos}/${x.respondidas})`);
  const pPart = rank.find((x) => x.user_id === part.id);
  const pHost = rank.find((x) => x.user_id === host.id);
  if (pPart.pontos !== 20) falhas.push(`participante deveria ter 20 pts, tem ${pPart.pontos}`);
  if (pPart.acertos !== 2 || pPart.respondidas !== 3) falhas.push(`participante stats errados: ${pPart.acertos}/${pPart.respondidas}`);
  if (pHost.pontos !== 10) falhas.push(`host deveria ter 10 pts, tem ${pHost.pontos}`);
  if (rank[0].user_id !== part.id) falhas.push('ranking nao ordenou pelo lider (participante)');

  // nao-participante nao pode ler/responder
  const estranho = (await c.query("select id from auth.users where id not in ($1,$2) limit 1", [host.id, part.id])).rows[0]?.id;
  if (estranho) {
    await comoUsuario(estranho);
    try { await c.query('select * from perguntas_da_sala($1)', [sala]); falhas.push('estranho conseguiu ler perguntas da sala'); }
    catch { /* esperado */ }
  }
} catch (e) {
  falhas.push('EXCECAO: ' + e.message);
} finally {
  await c.query('rollback');
  await c.end();
}

if (falhas.length) { console.log('\n=== FALHOU ==='); falhas.forEach((f) => console.log('  -', f)); process.exit(1); }
console.log('\n=== PASSOU: criar/entrar, gabarito protegido, pontuacao +10/acerto, sem duplicar, ranking ordenado, acesso so de participante ===');
