-- 0025_sala_avatar.sql — mostra o avatar do perfil na Sala Ao Vivo.
-- ranking_sala passa a trazer profiles.avatar (left join, nulo = cai na inicial do nome).
-- Alimenta tanto o lobby ("Na sala") quanto o ranking ao vivo/final.

drop function if exists public.ranking_sala(uuid);
create function public.ranking_sala(p_sala uuid)
returns table(user_id uuid, nome text, avatar text, pontos int, acertos int, respondidas int, posicao int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_participante(p_sala, auth.uid()) then raise exception 'voce nao esta na sala'; end if;
  return query
    select sp.user_id, sp.nome, p.avatar, sp.pontos, sp.acertos, sp.respondidas,
           (row_number() over (order by sp.pontos desc, sp.acertos desc, sp.entrou_em asc))::int as posicao
    from public.sala_participantes sp
    left join public.profiles p on p.id = sp.user_id
    where sp.sala_id = p_sala
    order by posicao;
end $$;
revoke execute on function public.ranking_sala(uuid) from public, anon;
grant execute on function public.ranking_sala(uuid) to authenticated;
