/* E2E das correcoes de robustez (0024): bloqueio de late-join, sair_sala destravando o
   quorum, e reatribuicao do anfitriao quando o host sai. Cria, valida e limpa.
   Uso: node --env-file=.env simula-robustez.mjs */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

let ok = 0, falhou = 0;
const assert = (cond, msg) => { if (cond) { ok++; console.log('  PASS', msg); } else { falhou++; console.log('  FAIL', msg); } };
const como = (uid) => c.query("select set_config('request.jwt.claims', json_build_object('sub',$1::text)::text, false)", [uid]);
const rpc = async (fn, ...a) => (await c.query(`select ${fn}(${a.map((_, i) => '$' + (i + 1)).join(',')}) o`, a)).rows[0].o;
const estado = (s) => rpc('estado_jogo', s);
const tentar = async (f) => { try { await f(); return null; } catch (e) { return e.message; } };
const pergAtual = async (quiz, idx) => (await c.query('select id from quiz_perguntas where quiz_id=$1 order by ordem offset $2 limit 1', [quiz, idx])).rows[0].id;

const criados = [];
const novaSala = async (host) => {
  const quiz = (await c.query("insert into quiz_sessoes (usuario_id, status, vinho) values ($1,'pronto','{\"nome\":\"Vinho Robustez\"}') returning id", [host.id])).rows[0].id;
  for (const x of [{ o: 1, p: 'P1?', op: ['A', 'B', 'C'], cor: 0 }, { o: 2, p: 'P2?', op: ['A', 'B', 'C'], cor: 1 }])
    await c.query('insert into quiz_perguntas (quiz_id, ordem, pergunta, opcoes, correta, explicacao) values ($1,$2,$3,$4,$5,$6)', [quiz, x.o, x.p, JSON.stringify(x.op), x.cor, 'x']);
  await como(host.id);
  const s = await rpc('criar_sala', quiz);
  criados.push({ quiz, sala: s.sala_id });
  return { quiz, ...s };
};

try {
  const us = (await c.query("select id, nome from profiles where nome is not null limit 3")).rows;
  if (us.length < 3) throw new Error('preciso de 3 profiles com nome');
  const [host, p2, p3] = us;

  // ===== 1. LATE JOIN bloqueado =====
  console.log('\n[1] late join bloqueado');
  let S = await novaSala(host);
  await como(p2.id); await rpc('entrar_sala', S.codigo);
  await como(host.id); await rpc('iniciar_sala', S.sala_id);
  await como(p3.id);
  const errLate = await tentar(() => rpc('entrar_sala', S.codigo));
  assert(errLate && /comecou/.test(errLate), 'p3 NAO entra depois de iniciada');
  // host re-"entrar" (reconexao) ainda funciona
  await como(host.id);
  const reentrar = await tentar(() => rpc('entrar_sala', S.codigo));
  assert(reentrar === null, 'quem ja esta na sala consegue re-entrar (reconexao)');

  // ===== 2. sair_sala destrava o quorum (AFK sai) =====
  console.log('\n[2] sair destrava o quorum');
  S = await novaSala(host);
  await como(p2.id); await rpc('entrar_sala', S.codigo);
  await como(p3.id); await rpc('entrar_sala', S.codigo);
  await como(host.id); await rpc('iniciar_sala', S.sala_id);
  const q0 = await pergAtual(S.quiz, 0);
  await como(host.id); await rpc('responder_sala', S.sala_id, q0, 0);
  await como(p2.id); await rpc('responder_sala', S.sala_id, q0, 0);
  let e = await estado(S.sala_id);
  assert(e.revelado === false && e.responderam === 2 && e.total_participantes === 3, 'antes: 2/3, nao revelado');
  // p3 (que nao respondeu) sai -> sobra 2, ambos responderam -> revela
  await como(p3.id); await rpc('sair_sala', S.sala_id);
  await como(host.id); e = await estado(S.sala_id);
  assert(e.revelado === true, 'p3 (AFK) saiu -> quorum batido -> REVELA');
  assert(e.total_participantes === 2, 'denominador encolheu pra 2');

  // ===== 3. host sai -> comando passa pro proximo =====
  console.log('\n[3] host sai -> reatribui anfitriao');
  S = await novaSala(host);
  await como(p2.id); await rpc('entrar_sala', S.codigo);
  await como(host.id); await rpc('iniciar_sala', S.sala_id);
  // p2 antes nao e host
  await como(p2.id); e = await estado(S.sala_id);
  assert(e.eh_host === false, 'p2 nao e host enquanto o host esta');
  // host sai
  await como(host.id); const r3 = await rpc('sair_sala', S.sala_id);
  assert(!r3.encerrada, 'sala NAO encerra (ainda tem p2)');
  const novoHost = (await c.query('select anfitriao_id from salas where id=$1', [S.sala_id])).rows[0].anfitriao_id;
  assert(novoHost === p2.id, 'anfitriao reatribuido pro p2');
  await como(p2.id); e = await estado(S.sala_id);
  assert(e.eh_host === true, 'p2 agora E o host (ve os controles)');

  // ===== 4. esvaziou -> encerrada =====
  console.log('\n[4] esvaziou -> encerrada');
  await como(p2.id); const r4 = await rpc('sair_sala', S.sala_id);
  assert(r4.encerrada === true, 'ultimo saiu -> sala encerrada');
  const st = (await c.query('select status from salas where id=$1', [S.sala_id])).rows[0].status;
  assert(st === 'encerrada', "status='encerrada'");

  console.log(`\nRESULTADO: ${ok} pass, ${falhou} fail`);
} catch (e) {
  console.error('ERRO FATAL:', e.message); falhou++;
} finally {
  try { await c.query("select set_config('request.jwt.claims', null, false)"); } catch {}
  for (const x of criados) {
    await c.query('delete from salas where id=$1', [x.sala]).catch(() => {});
    await c.query('delete from quiz_sessoes where id=$1', [x.quiz]).catch(() => {});
  }
  await c.end();
  if (falhou > 0) process.exitCode = 1;
}
