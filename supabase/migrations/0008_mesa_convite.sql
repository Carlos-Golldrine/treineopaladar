-- 0008_mesa_convite.sql — Convite por link + mesa privada.
-- Aditivo (nao quebra o app de producao): adiciona colunas em `mesas`,
-- dois RPCs (definir_privacidade_mesa, entrar_por_convite) e ensina o
-- garantir_mesa_semana a NUNCA auto-encher mesas privadas.

-- 1) Colunas: flag de privacidade + codigo de convite unico ----------------
alter table public.mesas
  add column if not exists privada        boolean not null default false,
  add column if not exists codigo_convite text;

-- backfill de codigo para mesas ja existentes
update public.mesas
   set codigo_convite = lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
 where codigo_convite is null;

-- default para novas mesas + unicidade + not null
alter table public.mesas
  alter column codigo_convite set default lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  alter column codigo_convite set not null;

create unique index if not exists mesas_codigo_convite_idx on public.mesas (codigo_convite);

-- 2) Tornar a mesa privada/publica (so um membro pode) ---------------------
create or replace function public.definir_privacidade_mesa(p_mesa uuid, p_privada boolean)
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
  if not public.is_mesa_member(p_mesa, v_uid) then
    raise exception 'nao e membro da mesa';
  end if;
  update public.mesas set privada = p_privada where id = p_mesa;
  return p_privada;
end;
$$;

comment on function public.definir_privacidade_mesa is 'Liga/desliga a privacidade de uma mesa (so para membros). Mesa privada nao recebe auto-pareamento.';
grant execute on function public.definir_privacidade_mesa(uuid, boolean) to authenticated;

-- 3) Entrar numa mesa por codigo de convite --------------------------------
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

  -- so se pode estar em uma mesa por semana: sai das outras dessa semana
  delete from public.mesa_membros mm
   using public.mesas m
   where mm.user_id = v_uid
     and mm.mesa_id = m.id
     and m.semana_iso = v_semana
     and mm.mesa_id <> v_mesa;

  insert into public.mesa_membros (mesa_id, user_id)
  values (v_mesa, v_uid)
  on conflict do nothing;

  return v_mesa;
end;
$$;

comment on function public.entrar_por_convite is 'Entra na mesa do codigo de convite (inclusive privada), saindo das outras mesas da mesma semana.';
grant execute on function public.entrar_por_convite(text) to anon, authenticated;

-- 4) Auto-pareamento respeita privacidade ----------------------------------
-- Se o caller ja participa de uma mesa da semana (ex.: entrou numa privada
-- por convite), usa essa. Senao, acha-ou-cria a mesa PUBLICA da semana.
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

  -- Senao, acha-ou-cria a mesa PUBLICA da semana (nunca entra em privada).
  select id into v_mesa
    from mesas
   where semana_iso = v_semana and divisao = v_divisao and not privada
   limit 1;

  if v_mesa is null then
    insert into mesas (semana_iso, divisao) values (v_semana, v_divisao) returning id into v_mesa;

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

  insert into mesa_membros (mesa_id, user_id) values (v_mesa, v_uid) on conflict do nothing;
  return v_mesa;
end;
$$;

grant execute on function public.garantir_mesa_semana() to anon, authenticated;
