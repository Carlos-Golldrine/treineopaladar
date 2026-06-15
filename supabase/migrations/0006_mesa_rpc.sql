-- 0006_mesa_rpc.sql — Entrada na Mesa da semana (versao de teste, antes do cron de liga).
-- garantir_mesa_semana(): acha-ou-cria a mesa da semana ISO corrente (divisao padrao),
-- garante o caller como membro e, ao CRIAR a mesa, semeia a "Degustacao da Semana"
-- (post editorial, user_id null) com um vinho eligivel deterministico da semana.
-- SECURITY DEFINER: opera acima do RLS com seguranca (so faz o que esta aqui).
-- Quando o cron de liga real existir (Edge Function), ele assume o pareamento por coorte.

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

  select id into v_mesa from mesas where semana_iso = v_semana and divisao = v_divisao limit 1;

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

comment on function public.garantir_mesa_semana is 'Acha-ou-cria a mesa da semana ISO, garante o caller como membro e semeia a Degustacao da Semana. Versao de teste ate o cron de liga.';

grant execute on function public.garantir_mesa_semana() to anon, authenticated;
