/**
 * Backfill PONTUAL e AUTORIZADO: re-aponta inscrições Web Push órfãs para a conta
 * REAL correta. Conserta o histórico do bug "sub presa na conta anônima" (a partir
 * da 0018 o app cura sozinho no login; isto resolve quem já estava órfão).
 *
 * Regra SEGURA de pareamento (conservadora de propósito): para cada membro REAL da
 * mesa que está SEM nenhuma subscription, procura UMA conta ANÔNIMA com o MESMO nome,
 * fora da mesa, que TENHA subscription. Só move quando o pareamento é único (1 origem
 * anônima para 1 destino real). Qualquer ambiguidade -> pula e avisa.
 *
 * Uso: node --env-file=.env backfill-push.mjs <codigo_convite> [--apply]
 */
import pg from 'pg';

const CODIGO = (process.argv[2] || '').trim().toLowerCase();
const APPLY = process.argv.includes('--apply');
if (!CODIGO || CODIGO.startsWith('--')) {
  console.error('uso: node --env-file=.env backfill-push.mjs <codigo_convite> [--apply]');
  process.exit(1);
}

const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
try {
  // Recarrega o schema do PostgREST (pra o app enxergar o RPC reassociar_push da 0018).
  await c.query("notify pgrst, 'reload schema'");
  const temRpc = await c.query("select 1 from pg_proc where proname='reassociar_push'");
  console.log('RPC reassociar_push presente:', temRpc.rowCount > 0, '| schema PostgREST recarregado\n');

  const mesa = (await c.query('select id from mesas where codigo_convite=$1', [CODIGO])).rows[0];
  if (!mesa) {
    console.error('mesa não encontrada:', CODIGO);
    process.exit(1);
  }

  // Membros reais SEM subscription + candidata anônima de mesmo nome, com sub, fora da mesa.
  const cand = await c.query(
    `with membros as (
       select mm.user_id, p.nome
       from mesa_membros mm
       left join profiles p on p.id = mm.user_id
       where mm.mesa_id = $1
     ),
     sem_sub as (
       select me.user_id, me.nome from membros me
       where me.nome is not null
         and not exists (select 1 from push_subscriptions ps where ps.user_id = me.user_id)
     )
     select ss.nome,
            ss.user_id  as destino_uid,
            o.id        as origem_uid,
            u.is_anonymous,
            (select count(*) from push_subscriptions ps where ps.user_id = o.id)::int subs
       from sem_sub ss
       join profiles o   on lower(o.nome) = lower(ss.nome) and o.id <> ss.user_id
       join auth.users u on u.id = o.id
      where u.is_anonymous = true
        and exists (select 1 from push_subscriptions ps where ps.user_id = o.id)
        and not exists (select 1 from mesa_membros mm where mm.mesa_id = $1 and mm.user_id = o.id)`,
    [mesa.id],
  );

  // Agrupa por destino pra detectar ambiguidade (>1 origem candidata = não mexe).
  const porDestino = new Map();
  for (const r of cand.rows) {
    const a = porDestino.get(r.destino_uid) ?? { nome: r.nome, origens: [] };
    a.origens.push({ origem_uid: r.origem_uid, subs: r.subs });
    porDestino.set(r.destino_uid, a);
  }

  const mover = [];
  console.log('Pareamentos encontrados:');
  if (porDestino.size === 0) console.log('  (nenhum órfão recuperável por nome para esta mesa)');
  for (const [destino, info] of porDestino) {
    if (info.origens.length === 1) {
      const o = info.origens[0];
      console.log(`  ${info.nome}: anônima ${o.origem_uid.slice(0, 8)} (${o.subs} sub) -> real ${destino.slice(0, 8)}  [OK, único]`);
      mover.push({ nome: info.nome, origem: o.origem_uid, destino });
    } else {
      console.log(`  ${info.nome}: ${info.origens.length} origens candidatas -> PULADO (ambíguo)`);
    }
  }

  if (mover.length === 0) {
    console.log('\nNada a mover.');
    process.exit(0);
  }

  if (!APPLY) {
    console.log('\n[DRY-RUN] nada gravado. Rode com --apply para re-apontar.');
    process.exit(0);
  }

  await c.query('begin');
  try {
    let total = 0;
    for (const m of mover) {
      const r = await c.query('update push_subscriptions set user_id=$1, visto_em=now() where user_id=$2', [m.destino, m.origem]);
      console.log(`  ${m.nome}: ${r.rowCount} sub(s) re-apontada(s) para ${m.destino.slice(0, 8)}`);
      total += r.rowCount;
    }
    await c.query('commit');
    console.log(`\nOK — ${total} subscription(s) re-apontada(s).`);
  } catch (e) {
    await c.query('rollback');
    console.error('\nERRO — rollback, nada mudou:', e.message);
    process.exitCode = 1;
  }
} finally {
  await c.end();
}
