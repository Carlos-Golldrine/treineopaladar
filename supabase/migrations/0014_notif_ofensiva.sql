-- 0014_notif_ofensiva.sql — Alvos do streak-saver ("ofensiva em risco").
-- Aditivo e idempotente. A Edge Function `enviar-push` chama este RPC (service_role)
-- para saber QUEM notificar as 20h de Brasilia, segundo a regra de negocio
-- (docs/NOTIFICACOES.md secao 3): ofensiva viva (streak >= 1) + treinou ONTEM e
-- ainda nao HOJE (vence a meia-noite) + ainda nao recebeu este push hoje (teto 1/dia).
-- A data/fuso e o anti-join de frequencia ficam aqui em SQL (testavel).

create or replace function public.alvos_ofensiva_risco()
returns table (user_id uuid, streak integer, endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
as $$
  with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
  select e.user_id, e.streak, s.endpoint, s.p256dh, s.auth
  from (
    select w.user_id, w.streak
    from public.wallet w, hoje
    where w.streak >= 1
      and w.last_done = hoje.d - 1                 -- treinou ontem, ainda nao hoje
      and not exists (
        select 1
        from public.notif_log nl, hoje
        where nl.user_id = w.user_id
          and nl.categoria = 'ofensiva_risco'
          and (nl.enviado_em at time zone 'America/Sao_Paulo')::date = hoje.d
      )
  ) e
  join public.push_subscriptions s on s.user_id = e.user_id;
$$;

-- So o disparador (service_role) calcula alvos; ninguem mais ve inscricoes alheias.
revoke execute on function public.alvos_ofensiva_risco() from public, anon, authenticated;
grant execute on function public.alvos_ofensiva_risco() to service_role;
