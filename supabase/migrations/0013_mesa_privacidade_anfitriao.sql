-- 0013_mesa_privacidade_anfitriao.sql — So o anfitriao decide a privacidade.
-- Aditivo e idempotente. Antes, definir_privacidade_mesa exigia apenas
-- is_mesa_member, entao QUALQUER membro da mesa podia torna-la publica/privada.
-- Agora exige ser o anfitriao (mesmo criterio de expulsar_membro / passar_lideranca)
-- e o execute fica so para 'authenticated' (a funcao e SECURITY DEFINER; por
-- padrao o Postgres concede execute a PUBLIC/anon — aqui isso e revogado).

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
  if not exists (select 1 from public.mesas where id = p_mesa and anfitriao = v_uid) then
    raise exception 'so o anfitriao pode mudar a privacidade da mesa';
  end if;
  update public.mesas set privada = p_privada where id = p_mesa;
  return p_privada;
end;
$$;

revoke execute on function public.definir_privacidade_mesa(uuid, boolean) from public, anon;
grant execute on function public.definir_privacidade_mesa(uuid, boolean) to authenticated;
