-- 0005_fix_mesa_rls.sql — Corrige recursao infinita (42P17) nas policies da Mesa.
-- Sintoma: querys em mesas/mesa_membros/mesa_posts/mesa_tchins retornavam
-- "infinite recursion detected in policy for relation mesa_membros".
-- Causa: as policies consultavam mesa_membros por dentro da policy de mesa_membros.
-- Solucao: funcoes SECURITY DEFINER que checam a participacao SEM reentrar no RLS.

create or replace function public.is_mesa_member(p_mesa_id uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mesa_membros m
    where m.mesa_id = p_mesa_id and m.user_id = p_user
  );
$$;
comment on function public.is_mesa_member is 'True se p_user e membro de p_mesa_id. SECURITY DEFINER para nao recair no RLS de mesa_membros (evita recursao).';

create or replace function public.can_tchin_post(p_post_id uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mesa_posts p
    join mesa_membros m on m.mesa_id = p.mesa_id
    where p.id = p_post_id and m.user_id = p_user
  );
$$;
comment on function public.can_tchin_post is 'True se p_user pode ver/reagir ao post (e membro da mesa do post). SECURITY DEFINER.';

-- Recria as policies da Mesa usando as funcoes (sem subconsulta direta a mesa_membros).
drop policy if exists "mesas_membro_select" on mesas;
create policy "mesas_membro_select" on mesas
  for select using (public.is_mesa_member(id, auth.uid()));

drop policy if exists "mesa_membros_select" on mesa_membros;
create policy "mesa_membros_select" on mesa_membros
  for select using (public.is_mesa_member(mesa_id, auth.uid()));

drop policy if exists "mesa_posts_select_membro" on mesa_posts;
create policy "mesa_posts_select_membro" on mesa_posts
  for select using (public.is_mesa_member(mesa_id, auth.uid()));

drop policy if exists "mesa_posts_insert_membro" on mesa_posts;
create policy "mesa_posts_insert_membro" on mesa_posts
  for insert with check (
    auth.uid() = user_id and public.is_mesa_member(mesa_id, auth.uid())
  );

drop policy if exists "tchins_select_membro" on mesa_tchins;
create policy "tchins_select_membro" on mesa_tchins
  for select using (public.can_tchin_post(post_id, auth.uid()));
