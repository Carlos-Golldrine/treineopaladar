-- 0026_mesa_xp_semana.sql — placar semanal da Mesa por XP-DA-SEMANA (em vez de
-- total - xp_base), imune ao race de sincronizacao da wallet que vazava XP de
-- semanas anteriores. O cliente passa a reportar xp_semana/semana_xp (espelho do
-- contador diario xp_hoje/data_hoje). Aditivo e idempotente.
--
-- NOTA (rollout): quem ja jogou no inicio da semana no cliente ANTIGO e atualizar
-- no MEIO da mesma semana recomeca o placar dessa semana do 0 (subcontagem
-- transitoria de 1 semana). Aceito de proposito: nao ha como reconstruir o residuo
-- com precisao, o xp_total NUNCA e afetado, nada de semana antiga vaza, e auto-cura
-- na virada da semana seguinte.

alter table public.wallet
  add column if not exists xp_semana int not null default 0,
  add column if not exists semana_xp text;

-- Pontos da semana:
--   * cliente novo, jogou nesta semana (semana_xp == semana da mesa) -> xp_semana
--   * cliente novo, NAO jogou nesta semana (semana_xp de outra semana) -> 0 (sem vazamento)
--   * cliente antigo (semana_xp null, ainda nao atualizou) -> metodo antigo total - xp_base
create or replace function public.ranking_da_mesa(p_mesa uuid)
returns table(user_id uuid, pontos integer, posicao integer, nome text, avatar text)
language sql stable security definer set search_path to 'public'
as $function$
  with base as (
    select mm.user_id,
           case
             when w.semana_xp = m.semana_iso then greatest(0, coalesce(w.xp_semana, 0))
             when w.semana_xp is not null     then 0
             else greatest(0, coalesce(w.xp_total, 0) - mm.xp_base)
           end as pontos,
           p.nome, p.avatar
    from mesa_membros mm
    join mesas m on m.id = mm.mesa_id
    left join wallet w on w.user_id = mm.user_id
    left join profiles p on p.id = mm.user_id
    where mm.mesa_id = p_mesa
      and public.is_mesa_member(p_mesa, auth.uid())
  )
  select user_id,
         pontos::int,
         (row_number() over (order by pontos desc))::int as posicao,
         nome,
         avatar
  from base
  order by pontos desc;
$function$;
revoke execute on function public.ranking_da_mesa(uuid) from public, anon;
grant execute on function public.ranking_da_mesa(uuid) to authenticated;
