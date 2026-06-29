/* E2E do lockstep da Sala Ao Vivo (0023): 3 participantes, prova que certo/errado e pontos
   so aparecem depois que TODOS respondem, e que o gabarito nao vaza antes. Cria tudo, valida
   com asserts e limpa no fim. Uso: node --env-file=.env simula-lockstep.mjs */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

let ok = 0, falhou = 0;
const assert = (cond, msg) => {
  if (cond) { ok++; console.log('  PASS', msg); }
  else { falhou++; console.log('  FAIL', msg); }
};
const como = (uid) => c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, false)", [uid]);
const rpc = async (fn, ...args) => (await c.query(`select ${fn}(${args.map((_, i) => '$' + (i + 1)).join(',')}) o`, args)).rows[0].o;
const estado = (sala) => rpc('estado_jogo', sala);
const pontosDe = async (sala, uid) => (await c.query('select pontos, acertos, respondidas from sala_participantes where sala_id=$1 and user_id=$2', [sala, uid])).rows[0];
const tentar = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

let quizId, salaId;
try {
  const us = (await c.query("select id, nome from profiles where nome is not null limit 3")).rows;
  if (us.length < 3) throw new Error('preciso de 3 profiles com nome');
  const [host, p2, p3] = us;
  console.log('host:', host.nome, '| p2:', p2.nome, '| p3:', p3.nome);

  quizId = (await c.query("insert into quiz_sessoes (usuario_id, status, vinho) values ($1,'pronto','{\"nome\":\"Vinho de Teste Lockstep\"}') returning id", [host.id])).rows[0].id;
  const perg = [
    { o: 1, p: 'Tipo?', op: ['Tinto', 'Branco', 'Rosé'], cor: 0 },
    { o: 2, p: 'Uva?', op: ['Carménère', 'Chardonnay', 'Malbec'], cor: 0 },
    { o: 3, p: 'País?', op: ['Itália', 'Chile', 'França'], cor: 1 },
  ];
  for (const x of perg) await c.query('insert into quiz_perguntas (quiz_id, ordem, pergunta, opcoes, correta, explicacao) values ($1,$2,$3,$4,$5,$6)', [quizId, x.o, x.p, JSON.stringify(x.op), x.cor, 'pq sim']);

  await como(host.id);
  const cs = await rpc('criar_sala', quizId);
  salaId = cs.sala_id;
  await como(p2.id); await rpc('entrar_sala', cs.codigo);
  await como(p3.id); await rpc('entrar_sala', cs.codigo);
  console.log('sala', cs.codigo, '— 3 na sala\n');

  // --- Lobby: nao iniciada ---
  await como(p2.id);
  let e = await estado(salaId);
  assert(e.iniciada === false, 'lobby: iniciada=false antes de comecar');
  assert(e.total === 3, 'total de perguntas = 3');

  // --- Host inicia ---
  await como(host.id); await rpc('iniciar_sala', salaId);
  await como(p2.id); e = await estado(salaId);
  assert(e.iniciada === true && e.pergunta_idx === 0 && e.revelado === false, 'inicio: iniciada, idx=0, nao revelado');

  // --- Q1: p2 responde certo (Tinto=0). NAO pode revelar nada ---
  await como(p2.id);
  const perg1 = (await c.query('select q.id from quiz_perguntas q where q.quiz_id=$1 order by q.ordem offset 0 limit 1', [quizId])).rows[0].id;
  let rr = await rpc('responder_sala', salaId, perg1, 0);
  assert(rr.registrado === true && !('correta' in rr) && !('acertou' in rr), 'responder_sala NAO retorna gabarito');
  e = await estado(salaId);
  assert(e.revelado === false, 'Q1 p2: revelado=false (faltam responder)');
  assert(e.ja_respondi === true && e.responderam === 1, 'Q1 p2: ja_respondi, responderam=1');
  assert(e.correta === null && e.explicacao === null && e.acertou === null, 'Q1 p2: SEM gabarito antes da revelacao');
  let pp = await pontosDe(salaId, p2.id);
  assert(pp.pontos === 0, 'Q1 p2: pontos AINDA 0 (sem vazar acerto pelo placar)');
  assert(pp.respondidas === 1, 'Q1 p2: respondidas=1');

  // host responde certo
  await como(host.id); await rpc('responder_sala', salaId, perg1, 0);
  e = await estado(salaId);
  assert(e.revelado === false && e.responderam === 2, 'Q1 host: ainda nao revelado (2/3)');
  pp = await pontosDe(salaId, host.id);
  assert(pp.pontos === 0, 'Q1 host: pontos ainda 0 (2/3 respondidos)');

  // p3 responde errado -> 3/3 -> REVELA
  await como(p3.id); await rpc('responder_sala', salaId, perg1, 1);
  e = await estado(salaId);
  assert(e.revelado === true, 'Q1: revelado=true depois de TODOS responderem');
  assert(e.correta === 0, 'Q1: correta=0 liberada na revelacao');
  assert(e.ja_respondi === true && e.acertou === false, 'Q1 p3: errou (acertou=false)');
  await como(p2.id); e = await estado(salaId);
  assert(e.acertou === true && e.correta === 0, 'Q1 p2: acertou=true apos revelacao');

  // pontos aplicados SO na revelacao
  assert((await pontosDe(salaId, host.id)).pontos === 10, 'Q1: host +10 na revelacao');
  assert((await pontosDe(salaId, p2.id)).pontos === 10, 'Q1: p2 +10 na revelacao');
  assert((await pontosDe(salaId, p3.id)).pontos === 0, 'Q1: p3 0 (errou)');

  // re-responder pergunta ja revelada -> erro
  const err = await tentar(() => rpc('responder_sala', salaId, perg1, 0));
  assert(err && /revelada/.test(err), 'responder pergunta ja revelada = erro');

  // participante nao pode avancar
  await como(p2.id);
  const errAv = await tentar(() => rpc('avancar_pergunta', salaId));
  assert(errAv && /anfitriao/.test(errAv), 'participante NAO avanca (so o host)');

  // --- Host avanca pra Q2 ---
  await como(host.id); await rpc('avancar_pergunta', salaId);
  await como(p2.id); e = await estado(salaId);
  assert(e.pergunta_idx === 1 && e.revelado === false && e.ja_respondi === false && e.responderam === 0, 'Q2: idx=1 zerado pra todos');

  // --- Q2: avancar sem revelar deve FALHAR ---
  await como(host.id);
  const errSemRevelar = await tentar(() => rpc('avancar_pergunta', salaId));
  assert(errSemRevelar && /revele/.test(errSemRevelar), 'avancar sem revelar Q2 = erro');
  e = await estado(salaId);
  assert(e.pergunta_idx === 1, 'continua em idx=1 (nao avancou sem revelar)');

  // revela Q2 na marra (host) mesmo com 0/3 -> destrava
  await rpc('revelar_pergunta', salaId);
  e = await estado(salaId);
  assert(e.revelado === true, 'host force-reveal: revela mesmo sem todos responderem');
  // ninguem respondeu Q2 -> ninguem pontua
  assert((await pontosDe(salaId, host.id)).pontos === 10, 'Q2 force-reveal: host segue com 10 (nao respondeu Q2)');

  await rpc('avancar_pergunta', salaId); // Q3
  e = await estado(salaId);
  assert(e.pergunta_idx === 2, 'avanca pra Q3 (idx=2)');

  // todos respondem Q3 (correta=1=Chile)
  const perg3 = (await c.query('select q.id from quiz_perguntas q where q.quiz_id=$1 order by q.ordem offset 2 limit 1', [quizId])).rows[0].id;
  await como(host.id); await rpc('responder_sala', salaId, perg3, 1);
  await como(p2.id); await rpc('responder_sala', salaId, perg3, 1);
  await como(p3.id); await rpc('responder_sala', salaId, perg3, 0);
  e = await estado(salaId);
  assert(e.revelado === true && e.correta === 1, 'Q3: revela com todos respondidos');

  // host avanca alem da ultima -> FIM
  await como(host.id); await rpc('avancar_pergunta', salaId);
  await como(p2.id); e = await estado(salaId);
  assert(e.fim === true, 'FIM: pergunta_idx >= total fecha o jogo');

  // --- VETORES DE VAZAMENTO via leitura direta (RLS) ---
  // Assume o papel 'authenticated' (cliente real); o usuario do pooler ignora RLS.
  await como(p2.id);
  await c.query('set role authenticated');
  const vazou = async (sql, params) => {
    try {
      const n = (await c.query(sql, params)).rows[0].n;
      return n > 0; // retornou linhas = vazou
    } catch {
      return false; // permission denied = nao vazou
    }
  };
  const gabVazou = await vazou('select count(*)::int n from quiz_perguntas where quiz_id=$1', [quizId]);
  const respVazou = await vazou('select count(*)::int n from sala_respostas where sala_id=$1', [salaId]);
  await c.query('reset role');
  assert(gabVazou === false, 'RLS: participante NAO le quiz_perguntas direto (gabarito)');
  assert(respVazou === false, 'RLS: participante NAO le sala_respostas direto');

  console.log(`\nRESULTADO: ${ok} pass, ${falhou} fail`);
} catch (e) {
  console.error('ERRO FATAL:', e.message);
  falhou++;
} finally {
  // limpeza (cascata: salas/sala_participantes/sala_respostas/quiz_perguntas via FKs)
  try { await c.query('reset role'); } catch {}
  try { await c.query("select set_config('request.jwt.claims', null, false)"); } catch {}
  if (salaId) await c.query('delete from salas where id=$1', [salaId]).catch(() => {});
  if (quizId) await c.query('delete from quiz_sessoes where id=$1', [quizId]).catch(() => {});
  await c.end();
  if (falhou > 0) process.exitCode = 1;
}
