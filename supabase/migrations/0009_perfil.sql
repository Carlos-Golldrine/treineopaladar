-- 0009_perfil.sql — Perfil editavel: nome de exibicao + avatar (preset id).
-- nome/avatar vivem em profiles e sao lidos AO VIVO pela Mesa (ranking_da_mesa),
-- entao trocar o nome no perfil reflete para todos os membros, sem copia velha.
-- Idempotente (if not exists / drop if exists), seguro para reaplicar.

alter table profiles add column if not exists nome text;
alter table profiles add column if not exists avatar text;
alter table profiles add column if not exists perfil_ts bigint not null default 0;

-- ranking_da_mesa passa a devolver nome + avatar do membro (LEFT JOIN profiles).
-- Mudar o tipo de retorno de uma function exige DROP antes do CREATE.
drop function if exists public.ranking_da_mesa(uuid);
create function public.ranking_da_mesa(p_mesa uuid)
returns table(user_id uuid, pontos int, posicao int, nome text, avatar text)
language sql
security definer
set search_path = public
stable
as $$
  select mm.user_id,
         greatest(0, coalesce(w.xp_total, 0) - mm.xp_base)::int as pontos,
         (row_number() over (order by greatest(0, coalesce(w.xp_total, 0) - mm.xp_base) desc))::int as posicao,
         p.nome,
         p.avatar
  from mesa_membros mm
  left join wallet w on w.user_id = mm.user_id
  left join profiles p on p.id = mm.user_id
  where mm.mesa_id = p_mesa
  order by pontos desc;
$$;

grant execute on function public.ranking_da_mesa(uuid) to anon, authenticated;
