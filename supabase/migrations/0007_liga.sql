-- 0007_liga.sql — Liga semanal (coortes por divisao + ranking + promocao/rebaixamento).
-- Tudo em Postgres: a liga e logica de dados, nao precisa de Edge Function.
--   * profiles.divisao  : divisao corrente do jogador (bronze..diamante).
--   * mesa_membros.xp_base : xp_total do jogador ao entrar na mesa da semana.
--       pontos da semana = wallet.xp_total - xp_base (derivado, sem campo extra a manter).
--   * garantir_mesa_semana(): coorte por divisao, max 20 por mesa.
--   * ranking_da_mesa(mesa): membros ordenados por pontos da semana.
--   * rodar_liga(): promove o terco de cima, rebaixa o de baixo (agendar via pg_cron).

alter table profiles add column if not exists divisao text not null default 'bronze';
alter table mesa_membros add column if not exists xp_base integer not null default 0;

create or replace function public.divisao_ordem(d text)
returns int language sql immutable as $$
  select coalesce(array_position(array['bronze','prata','ouro','platina','diamante'], d), 1);
$$;

create or replace function public.garantir_mesa_semana()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semana text := to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-"W"IW');
  v_uid    uuid := auth.uid();
  v_div    text;
  v_mesa   uuid;
  v_xp     int;
  v_vinho  record;
begin
  if v_uid is null then raise exception 'sem sessao'; end if;

  -- Ja sentado nesta semana? devolve a mesa.
  select mm.mesa_id into v_mesa
    from mesa_membros mm join mesas m on m.id = mm.mesa_id
    where mm.user_id = v_uid and m.semana_iso = v_semana
    limit 1;
  if v_mesa is not null then return v_mesa; end if;

  select coalesce(divisao, 'bronze') into v_div from profiles where id = v_uid;
  v_div := coalesce(v_div, 'bronze');
  select coalesce(xp_total, 0) into v_xp from wallet where user_id = v_uid;
  v_xp := coalesce(v_xp, 0);

  -- Mesa da semana+divisao com vaga (< 20). A mais cheia primeiro (preenche antes de abrir nova).
  select m.id into v_mesa
    from mesas m
    where m.semana_iso = v_semana and m.divisao = v_div
      and (select count(*) from mesa_membros mm where mm.mesa_id = m.id) < 20
    order by (select count(*) from mesa_membros mm where mm.mesa_id = m.id) desc
    limit 1;

  if v_mesa is null then
    insert into mesas (semana_iso, divisao) values (v_semana, v_div) returning id into v_mesa;
    select id, nome, produtor, tipo::text as tipo, thumbnail_url, acidez, tanino, corpo, frutado, docura
      into v_vinho from vinhos where view_estrita and acidez is not null
      order by md5(id || v_semana) limit 1;
    if v_vinho.id is not null then
      insert into mesa_posts (mesa_id, user_id, tipo, payload)
      values (v_mesa, null, 'degustacao_palpite', jsonb_build_object(
        'vinho_id', v_vinho.id, 'nome', v_vinho.nome, 'produtor', v_vinho.produtor,
        'tipo', v_vinho.tipo, 'thumbnail_url', v_vinho.thumbnail_url,
        'perfil', jsonb_build_object('acidez',v_vinho.acidez,'tanino',v_vinho.tanino,
          'corpo',v_vinho.corpo,'frutado',v_vinho.frutado,'docura',v_vinho.docura)));
    end if;
  end if;

  insert into mesa_membros (mesa_id, user_id, xp_base) values (v_mesa, v_uid, v_xp) on conflict do nothing;
  return v_mesa;
end;
$$;

-- Ranking da mesa: pontos da semana = xp_total - xp_base.
create or replace function public.ranking_da_mesa(p_mesa uuid)
returns table(user_id uuid, pontos int, posicao int)
language sql
security definer
set search_path = public
stable
as $$
  select mm.user_id,
         greatest(0, coalesce(w.xp_total, 0) - mm.xp_base)::int as pontos,
         (row_number() over (order by greatest(0, coalesce(w.xp_total, 0) - mm.xp_base) desc))::int as posicao
  from mesa_membros mm
  left join wallet w on w.user_id = mm.user_id
  where mm.mesa_id = p_mesa
  order by pontos desc;
$$;

-- Promocao/rebaixamento: roda no rollover da semana (agendar via pg_cron).
create or replace function public.rodar_liga()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passada text := to_char((now() at time zone 'America/Sao_Paulo') - interval '7 days', 'IYYY-"W"IW');
  v_tiers text[] := array['bronze','prata','ouro','platina','diamante'];
  r record;
begin
  for r in
    select mm.user_id, m.divisao,
      row_number() over (partition by m.id order by greatest(0, coalesce(w.xp_total,0)-mm.xp_base) desc) as pos,
      count(*) over (partition by m.id) as total
    from mesas m
    join mesa_membros mm on mm.mesa_id = m.id
    left join wallet w on w.user_id = mm.user_id
    where m.semana_iso = v_passada
  loop
    if r.pos <= greatest(1, floor(r.total * 0.3)) then
      update profiles set divisao = v_tiers[least(5, divisao_ordem(divisao) + 1)] where id = r.user_id;
    elsif r.pos > r.total - greatest(1, floor(r.total * 0.3)) then
      update profiles set divisao = v_tiers[greatest(1, divisao_ordem(divisao) - 1)] where id = r.user_id;
    end if;
  end loop;
end;
$$;

grant execute on function public.garantir_mesa_semana() to anon, authenticated;
grant execute on function public.ranking_da_mesa(uuid) to anon, authenticated;
