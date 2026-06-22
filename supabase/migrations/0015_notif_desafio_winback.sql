-- 0015_notif_desafio_winback.sql — Alvos do Desafio do Dia e do Win-back.
-- Aditivo e idempotente. A Edge Function chama estes RPCs (service_role) no run
-- da MANHA (docs/NOTIFICACOES.md secao 3). Datas/fuso e teto ficam em SQL.
--
-- Teto compartilhado de ENGAJAMENTO: desafio_dia / winback_* / meta_diaria dividem
-- 1 push/dia (anti-join no notif_log dessas categorias). O streak-saver da noite
-- (ofensiva_risco) tem teto proprio e segue independente.

-- Desafio do Dia (manha): quem foi ativo nos ultimos 2 dias mas NAO hoje, ainda
-- nao fez o desafio de hoje, tem inscricao e nao recebeu push de engajamento hoje.
create or replace function public.alvos_desafio_dia()
returns table (user_id uuid, endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
  select e.user_id, s.endpoint, s.p256dh, s.auth
  from (
    select w.user_id
    from public.wallet w
    join public.profiles p on p.id = w.user_id
    cross join hoje
    where coalesce(p.onboarding_completo, false)
      and w.last_done >= hoje.d - 2
      and w.last_done <  hoje.d
      and not exists (
        select 1 from public.desafio_premio dp, hoje h
        where dp.user_id = w.user_id and dp.data = h.d)
      and not exists (
        select 1 from public.notif_log nl, hoje h
        where nl.user_id = w.user_id
          and nl.categoria in ('desafio_dia','winback_d3','winback_d7','winback_d14','meta_diaria')
          and (nl.enviado_em at time zone 'America/Sao_Paulo')::date = h.d)
  ) e
  join public.push_subscriptions s on s.user_id = e.user_id;
$$;
revoke execute on function public.alvos_desafio_dia() from public, anon, authenticated;
grant execute on function public.alvos_desafio_dia() to service_role;

-- Win-back (manha): quem sumiu ha exatamente 3 / 7 / 14 dias (last_done = hoje - N).
-- Retorna a janela (d3/d7/d14) pra escolher a copy. Mesmo teto de engajamento.
create or replace function public.alvos_winback()
returns table (user_id uuid, janela text, endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
  select e.user_id, e.janela, s.endpoint, s.p256dh, s.auth
  from (
    select w.user_id,
      case (hoje.d - w.last_done)
        when 3 then 'd3' when 7 then 'd7' when 14 then 'd14'
      end as janela
    from public.wallet w
    cross join hoje
    where w.last_done in (hoje.d - 3, hoje.d - 7, hoje.d - 14)
      and not exists (
        select 1 from public.notif_log nl, hoje h
        where nl.user_id = w.user_id
          and nl.categoria in ('desafio_dia','winback_d3','winback_d7','winback_d14','meta_diaria')
          and (nl.enviado_em at time zone 'America/Sao_Paulo')::date = h.d)
  ) e
  join public.push_subscriptions s on s.user_id = e.user_id;
$$;
revoke execute on function public.alvos_winback() from public, anon, authenticated;
grant execute on function public.alvos_winback() to service_role;
