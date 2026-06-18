-- 0011_mesa_exige_conta.sql — Mesa so para contas reais (nao-anonimas).
-- Aditivo e idempotente. Fecha a duplicacao de identidade: ao deslogar, o app
-- vira um anonimo novo que clonava nome+XP do estado local e auto-entrava na
-- mesa publica (aparecendo 2x). Agora SO usuario com conta (email/Google,
-- is_anonymous=false) entra/aparece em mesa. O app tambem mostra um gate de
-- "crie uma conta" antes (camada de UX); aqui e a defesa de verdade.

-- Helper: levanta excecao se o caller for anonimo. auth.jwt() le os claims da
-- requisicao (vale dentro de SECURITY DEFINER tambem).
create or replace function public.tp_exige_conta()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'crie uma conta para entrar na mesa' using errcode = '42501';
  end if;
end;
$$;
grant execute on function public.tp_exige_conta() to authenticated;

-- garantir_mesa_semana: idem 0010 + gate de conta (auto-join so p/ conta real).
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
  v_xp      int;
  v_mesa    uuid;
  v_vinho   record;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;
  perform public.tp_exige_conta();

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

  select id into v_mesa
    from mesas
   where semana_iso = v_semana and divisao = v_divisao and not privada
   limit 1;

  if v_mesa is null then
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

-- entrar_na_mesa: idem 0010 + gate de conta.
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
  perform public.tp_exige_conta();

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

-- entrar_por_convite: idem 0010 + gate de conta (nem por link um anonimo entra).
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
  perform public.tp_exige_conta();

  select id, semana_iso into v_mesa, v_semana
    from public.mesas
   where codigo_convite = lower(trim(p_codigo))
   limit 1;

  if v_mesa is null then
    raise exception 'convite invalido';
  end if;

  perform public.tp_sair_demais_mesas(v_semana, v_mesa);

  select coalesce(xp_total, 0) into v_xp from public.wallet where user_id = v_uid;
  insert into public.mesa_membros (mesa_id, user_id, xp_base)
  values (v_mesa, v_uid, coalesce(v_xp, 0))
  on conflict do nothing;

  return v_mesa;
end;
$$;
grant execute on function public.entrar_por_convite(text) to authenticated;
