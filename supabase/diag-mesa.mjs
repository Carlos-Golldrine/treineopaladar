/* Diagnostico do ranking semanal da Mesa. Uso: node --env-file=.env diag-mesa.mjs [MESA_ID_PREFIXO] */
import pg from 'pg';
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const def = async (nome) => {
  const r = (await c.query(
    `select pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=$1 limit 1`, [nome])).rows[0];
  return r ? r.d : '(nao encontrada)';
};
try {
  const pref = (process.argv[2] || '11b7ab6b') + '%';

  for (const fn of ['garantir_mesa_semana', 'minha_mesa_semana', 'tp_sair_demais_mesas']) {
    console.log(`\n=== def: ${fn} ===`);
    console.log(await def(fn));
  }

  console.log('\n=== colunas de mesas e mesa_membros ===');
  const cols = (await c.query(
    `select table_name, string_agg(column_name, ', ' order by ordinal_position) cols
       from information_schema.columns where table_schema='public' and table_name in ('mesas','mesa_membros')
      group by table_name`)).rows;
  for (const t of cols) console.log(`  ${t.table_name}: ${t.cols}`);

  console.log('\n=== a mesa ===');
  const mesa = (await c.query('select * from mesas where id::text like $1 limit 1', [pref])).rows[0];
  console.log(mesa ? JSON.stringify(mesa) : '(nao encontrada com prefixo ' + pref + ')');

  if (mesa) {
    console.log('\n=== membros: xp_base x wallet.xp_total x pontos ===');
    const mem = (await c.query(
      `select pr.nome, mm.user_id, mm.xp_base, w.xp_total,
              greatest(0, coalesce(w.xp_total,0) - mm.xp_base) as pontos,
              mm.*
         from mesa_membros mm
         left join wallet w on w.user_id = mm.user_id
         left join profiles pr on pr.id = mm.user_id
        where mm.mesa_id = $1
        order by pontos desc`, [mesa.id])).rows;
    for (const m of mem) {
      console.log(`  ${(m.nome ?? '(s/ nome)').padEnd(22)} base=${String(m.xp_base).padStart(6)} total=${String(m.xp_total ?? 'null').padStart(6)} -> pontos=${m.pontos}  ${m.user_id.slice(0,8)}`);
    }
  }
} finally {
  await c.end();
}
