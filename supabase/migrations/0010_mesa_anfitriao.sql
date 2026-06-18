-- 0010_mesa_anfitriao.sql — Anfitriao (lider), sair da mesa e descobrir mesas.
-- Aditivo e idempotente (if not exists / create or replace), seguro p/ reaplicar.
--
-- Modelo: cada mesa tem um anfitriao (o primeiro a entrar). Ele pode expulsar
-- membros e passar a coroa. Tudo via RPC SECURITY DEFINER com checagem de
-- autorizacao por dentro (auth.uid()), porque mesa_membros NAO tem policy de
-- DELETE/UPDATE pelo client — so estes RPCs mexem em quem senta na mesa.
--
-- Esta migration tambem FECHA um vazamento herdado: ranking_da_mesa (0009) nao
-- checava participacao e era exposto a 'anon'; como aqui passamos a expor ids de
-- mesas (listar_mesas_publicas), qualquer um poderia ler o roster de mesas
-- alheias. Agora ranking_da_mesa exige ser membro. E corrige o xp_base, que a
-- 0008 havia zerado nos caminhos de entrada (inflava os pontos da semana).

-- 1) Coluna anfitriao + backfill -------------------------------------------
alter table public.mesas
  add column if not exists anfitriao uuid references auth.users (id) on delete set null;

-- Mesas ja existentes sem anfitriao: o membro mais antigo vira o anfitriao.
update public.mesas m
   set anfitriao = sub.user_id
  from (
    select distinct on (mesa_id) mesa_id, user_id
      from public.mesa_membros
     order by mesa_id, entrou_em asc
  ) sub
 where sub.mesa_id = m.id
   and m.anfitriao is null;

-- 2) ranking_da_mesa: SO membros leem o ranking (fecha o vazamento) ---------
-- Mesma assinatura da 0009 (user_id, pontos, posicao, nome, avatar), agora com
-- gate de participacao. Nao-membro recebe zero linhas. Tira o grant de anon.
create or replace function public.ranking_da_mesa(p_mesa uuid)
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
    and public.is_mesa_member(p_mesa, auth.uid())   -- so membros veem o roster
  order by pontos desc;
$$;
-- Postgres concede EXECUTE a PUBLIC por padrao; revogar de PUBLIC (e anon)
-- garante de forma estrutural que so 'authenticated' chama (alem do gate interno).
revoke execute on function public.ranking_da_mesa(uuid) from public;
revoke execute on function public.ranking_da_mesa(uuid) from anon;
grant execute on function public.ranking_da_mesa(uuid) to authenticated;

-- 3) Helper: sair das OUTRAS mesas da semana cedendo a coroa ----------------
-- Usado por quem troca de mesa (entrar_na_mesa / entrar_por_convite). Sempre
-- opera sobre auth.uid() (nunca um uid arbitrario), entao e seguro mesmo se
-- chamado direto. Ao sair de uma mesa onde eu era anfitriao, a coroa passa
-- para o membro mais antigo restante (ou null se esvazia).
create or replace function public.tp_sair_demais_mesas(p_semana text, p_manter uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r record;
begin
  if v_uid is null then
    return;
  end if;
  for r in
    select mm.mesa_id
      from mesa_membros mm
      join mesas m on m.id = mm.mesa_id
     where mm.user_id = v_uid
       and m.semana_iso = p_semana
       and mm.mesa_id <> p_manter
  loop
    delete from mesa_membros where mesa_id = r.mesa_id and user_id = v_uid;
    perform 1 from mesas where id = r.mesa_id for update;
    update mesas
       set anfitriao = (
         select user_id from mesa_membros
          where mesa_id = r.mesa_id
          order by entrou_em asc
          limit 1
       )
     where id = r.mesa_id and anfitriao = v_uid;
  end loop;
end;
$$;
grant execute on function public.tp_sair_demais_mesas(text, uuid) to authenticated;

-- 4) garantir_mesa_semana: criador vira anfitriao + restaura xp_base --------
create or replace function public.garantir_mesa_semana()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semana  text := to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-"W"IW');
  v_divisao text := 'bronze-1';
  v_uid     uuid := auth.uid();
  v_mesa    uuid;
  v_xp      int;
  v_vinho   record;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;

  -- Ja esta numa mesa desta semana? Usa essa (privada tem prioridade).
  select m.id into v_mesa
    from mesa_membros mm
    join mesas m on m.id = mm.mesa_id
   where mm.user_id = v_uid and m.semana_iso = v_semana
   order by m.privada desc, m.created_at asc
   limit 1;
  if v_mesa is not null then
    return v_mesa;
  end if;

  select coalesce(xp_total, 0) into v_xp from wallet where user_id = v_uid;
  v_xp := coalesce(v_xp, 0);

  -- Senao, acha-ou-cria a mesa PUBLICA da semana (nunca entra em privada).
  select id into v_mesa
    from mesas
   where semana_iso = v_semana and divisao = v_divisao and not privada
   limit 1;

  if v_mesa is null then
    -- Cria a mesa: quem cria e o anfitriao (primeiro a entrar).
    insert into mesas (semana_iso, divisao, anfitriao)
    values (v_semana, v_divisao, v_uid)
    returning id into v_mesa;

    select id, nome, produtor, tipo::text as tipo, thumbnail_url, acidez, tanino, corpo, frutado, docura
      into v_vinho
      from vinhos
      where view_estrita and acidez is not null
      order by md5(id || v_semana)
      limit 1;

    if v_vinho.id is not null then
      insert into mesa_posts (mesa_id, user_id, tipo, payload)
      values (v_mesa, null, 'degustacao_palpite', jsonb_build_object(
        'vinho_id', v_vinho.id,
        'nome', v_vinho.nome,
        'produtor', v_vinho.produtor,
        'tipo', v_vinho.tipo,
        'thumbnail_url', v_vinho.thumbnail_url,
        'perfil', jsonb_build_object(
          'acidez', v_vinho.acidez, 'tanino', v_vinho.tanino, 'corpo', v_vinho.corpo,
          'frutado', v_vinho.frutado, 'docura', v_vinho.docura)
      ));
    end if;
  end if;

  insert into mesa_membros (mesa_id, user_id, xp_base)
  values (v_mesa, v_uid, v_xp)
  on conflict do nothing;
  return v_mesa;
end;
$$;
grant execute on function public.garantir_mesa_semana() to anon, authenticated;

-- 5) entrar_por_convite: re-criada com hand-off de coroa + xp_base ----------
create or replace function public.entrar_por_convite(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_mesa   uuid;
  v_semana text;
  v_xp     int;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;

  select id, semana_iso into v_mesa, v_semana
    from public.mesas
   where codigo_convite = lower(trim(p_codigo))
   limit 1;

  if v_mesa is null then
    raise exception 'convite invalido';
  end if;

  -- so se pode estar em uma mesa por semana: sai das outras cedendo a coroa
  perform public.tp_sair_demais_mesas(v_semana, v_mesa);

  select coalesce(xp_total, 0) into v_xp from public.wallet where user_id = v_uid;
  insert into public.mesa_membros (mesa_id, user_id, xp_base)
  values (v_mesa, v_uid, coalesce(v_xp, 0))
  on conflict do nothing;

  return v_mesa;
end;
$$;
grant execute on function public.entrar_por_convite(text) to authenticated;

-- 6) minha_mesa_semana: leitura SEM efeito colateral (nao cria nada) --------
create or replace function public.minha_mesa_semana()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select m.id
    from mesa_membros mm
    join mesas m on m.id = mm.mesa_id
   where mm.user_id = auth.uid()
     and m.semana_iso = to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-"W"IW')
   order by m.privada desc, m.created_at asc
   limit 1;
$$;
grant execute on function public.minha_mesa_semana() to authenticated;

-- 7) listar_mesas_publicas: descobrir mesas abertas da semana ---------------
-- So mesas PUBLICAS da semana corrente. Devolve contagem de membros, nome do
-- anfitriao e se eu ja participo. O id e devolvido para permitir entrar, mas o
-- roster so e legivel por membros (gate em ranking_da_mesa, item 2).
create or replace function public.listar_mesas_publicas()
returns table(id uuid, membros int, anfitriao_nome text, eu boolean)
language sql
security definer
set search_path = public
stable
as $$
  select m.id,
         (select count(*)::int from mesa_membros mm where mm.mesa_id = m.id) as membros,
         p.nome as anfitriao_nome,
         exists(
           select 1 from mesa_membros mm2
            where mm2.mesa_id = m.id and mm2.user_id = auth.uid()
         ) as eu
    from mesas m
    left join profiles p on p.id = m.anfitriao
   where m.semana_iso = to_char(now() at time zone 'America/Sao_Paulo', 'IYYY-"W"IW')
     and not m.privada
   order by membros desc
   limit 30;
$$;
grant execute on function public.listar_mesas_publicas() to authenticated;

-- 8) entrar_na_mesa: entrar numa mesa PUBLICA pelo id ----------------------
-- Sai das outras da semana cedendo a coroa (helper) e grava xp_base.
create or replace function public.entrar_na_mesa(p_mesa uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_priv   boolean;
  v_semana text;
  v_xp     int;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;

  select privada, semana_iso into v_priv, v_semana
    from public.mesas where id = p_mesa;
  if v_semana is null then
    raise exception 'mesa inexistente';
  end if;
  if v_priv then
    raise exception 'mesa privada: entre pelo link de convite';
  end if;

  perform public.tp_sair_demais_mesas(v_semana, p_mesa);

  select coalesce(xp_total, 0) into v_xp from public.wallet where user_id = v_uid;
  insert into public.mesa_membros (mesa_id, user_id, xp_base)
  values (p_mesa, v_uid, coalesce(v_xp, 0))
  on conflict do nothing;

  return p_mesa;
end;
$$;
grant execute on function public.entrar_na_mesa(uuid) to authenticated;

-- 9) sair_da_mesa: so age se eu era mesmo membro; coroa passa --------------
-- GET DIAGNOSTICS amarra a acao a participacao real (p_mesa nao basta) e o
-- FOR UPDATE serializa saidas concorrentes (evita anfitriao-fantasma).
create or replace function public.sair_da_mesa(p_mesa uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_host uuid;
  v_novo uuid;
  v_saiu int;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;

  delete from public.mesa_membros
   where mesa_id = p_mesa and user_id = v_uid;
  get diagnostics v_saiu = row_count;
  if v_saiu = 0 then
    return false;          -- nao era membro desta mesa: nada a fazer
  end if;

  perform 1 from public.mesas where id = p_mesa for update;
  select anfitriao into v_host from public.mesas where id = p_mesa;
  if v_host = v_uid then
    select user_id into v_novo
      from public.mesa_membros
     where mesa_id = p_mesa
     order by entrou_em asc
     limit 1;
    update public.mesas set anfitriao = v_novo where id = p_mesa;
  end if;

  return true;
end;
$$;
grant execute on function public.sair_da_mesa(uuid) to authenticated;

-- 10) expulsar_membro: so o anfitriao, nunca a si mesmo --------------------
create or replace function public.expulsar_membro(p_mesa uuid, p_alvo uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;
  if p_alvo = v_uid then
    raise exception 'o anfitriao nao pode se expulsar (use sair da mesa)';
  end if;
  if not exists (select 1 from public.mesas where id = p_mesa and anfitriao = v_uid) then
    raise exception 'so o anfitriao pode expulsar';
  end if;

  delete from public.mesa_membros
   where mesa_id = p_mesa and user_id = p_alvo;

  return true;
end;
$$;
grant execute on function public.expulsar_membro(uuid, uuid) to authenticated;

-- 11) passar_lideranca: so o anfitriao, para um membro da mesa -------------
create or replace function public.passar_lideranca(p_mesa uuid, p_novo uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;
  if not exists (select 1 from public.mesas where id = p_mesa and anfitriao = v_uid) then
    raise exception 'so o anfitriao pode passar a lideranca';
  end if;
  if not public.is_mesa_member(p_mesa, p_novo) then
    raise exception 'o novo anfitriao precisa ser membro da mesa';
  end if;

  update public.mesas set anfitriao = p_novo where id = p_mesa;
  return true;
end;
$$;
grant execute on function public.passar_lideranca(uuid, uuid) to authenticated;
