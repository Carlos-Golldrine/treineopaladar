-- 0022_sala_iniciar.sql — Inicio sincronizado da Sala Ao Vivo: o anfitriao "comeca"
-- e todos saem do lobby pro quiz JUNTOS (via Supabase Realtime na tabela salas).
-- Aditivo e idempotente.

alter table public.salas add column if not exists iniciada_em timestamptz;

-- So o anfitriao inicia. Idempotente (coalesce nao re-inicia).
create or replace function public.iniciar_sala(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_host uuid;
begin
  select anfitriao_id into v_host from public.salas where id = p_sala;
  if v_host is null then raise exception 'sala inexistente'; end if;
  if v_host <> v_uid then raise exception 'so o anfitriao inicia'; end if;
  update public.salas set iniciada_em = coalesce(iniciada_em, now()) where id = p_sala;
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.iniciar_sala(uuid) from public, anon;
grant execute on function public.iniciar_sala(uuid) to authenticated;

-- Le o estado da sala (lobby vs iniciada) — so participante.
create or replace function public.estado_sala(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s record;
begin
  if not public.eh_participante(p_sala, auth.uid()) then raise exception 'voce nao esta na sala'; end if;
  select codigo, vinho, anfitriao_id, iniciada_em into v_s from public.salas where id = p_sala;
  return jsonb_build_object(
    'codigo', v_s.codigo, 'vinho', v_s.vinho,
    'eh_host', v_s.anfitriao_id = auth.uid(),
    'iniciada', v_s.iniciada_em is not null
  );
end $$;
revoke execute on function public.estado_sala(uuid) from public, anon;
grant execute on function public.estado_sala(uuid) to authenticated;

-- Realtime na tabela salas (todos detectam o inicio simultaneo).
alter table public.salas replica identity full;
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'salas'
  ) then
    alter publication supabase_realtime add table public.salas;
  end if;
end $$;
