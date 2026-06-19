-- 0012_push_subscriptions.sql — Inscricoes de Web Push (F3 notificacoes, backend).
-- Aditivo e idempotente. Guarda a subscription do navegador (endpoint + chaves)
-- por usuario, para a Edge Function / disparador enviar Web Push. notif_log serve
-- a idempotencia e teto de frequencia do cron.
--
-- RLS: o dono insere/le/apaga as proprias subscriptions; o ENVIO le via
-- service_role (ignora RLS). Ninguem ve subscription alheia.

create table if not exists public.push_subscriptions (
  endpoint    text primary key,                 -- identifica 1 subscription do navegador
  user_id     uuid not null references auth.users (id) on delete cascade,
  p256dh      text not null,                     -- chave publica da subscription
  auth        text not null,                     -- segredo de auth da subscription
  plataforma  text,                              -- 'android' | 'ios' | 'desktop' (best-effort)
  criado_em   timestamptz not null default now(),
  visto_em    timestamptz not null default now()
);
comment on table public.push_subscriptions is 'Inscricoes Web Push por usuario (endpoint + chaves p256dh/auth). Upsert por endpoint.';

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists "push_sub_owner" on public.push_subscriptions;
create policy "push_sub_owner" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Log de envios: idempotencia / teto de frequencia (escrita so via service_role).
create table if not exists public.notif_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  categoria   text not null,                     -- ex.: 'ofensiva_risco', 'teste'
  enviado_em  timestamptz not null default now()
);
comment on table public.notif_log is 'Registro de notificacoes enviadas (idempotencia e teto de frequencia do cron). Escrita so via service_role.';

create index if not exists notif_log_user_idx on public.notif_log (user_id, enviado_em);

alter table public.notif_log enable row level security;
drop policy if exists "notif_log_owner_select" on public.notif_log;
create policy "notif_log_owner_select" on public.notif_log
  for select using (auth.uid() = user_id);
