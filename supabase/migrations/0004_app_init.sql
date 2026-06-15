-- 0004_app_init.sql — Bootstrap de novo jogador
-- Quando um usuario nasce em auth.users (inclusive ANONIMO, no soft wall da FTUE),
-- cria perfil + carteira (com as boas-vindas) + as 7 linhas de Score de Paladar zeradas.
-- Substitui o estadoInicial() do engine: a nuvem ja nasce com o estado-base.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;

  insert into public.wallet (user_id)
  values (new.id)
  on conflict do nothing;

  insert into public.score_paladar (user_id, dimensao)
  select new.id, d
  from unnest(array['acidez','tanino','corpo','frutado','docura','rotulo','harmonizacao']) as d
  on conflict do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user is 'Bootstrap do estado-base na nuvem ao criar usuario (anonimo ou nao): profiles, wallet (boas-vindas) e score_paladar zerado.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
