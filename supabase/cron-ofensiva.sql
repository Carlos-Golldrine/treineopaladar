-- cron-ofensiva.sql — Agenda as notificacoes push (streak-saver + manha).
-- A funcao foi deployada como `smart-responder` (fonte em functions/enviar-push).
-- Roda no SQL Editor (precisa de privilegio pra create extension). Antes, guarde
-- 1x a service_role key (legacy JWT eyJ..., em Project Settings -> API) no Vault:
--   select vault.create_secret('SUA_SERVICE_ROLE_KEY_eyJ...', 'service_role_key');
--
-- Dois lotes (fuso: Brasil = UTC-3 fixo desde 2019):
--   notif-manha           09:00 BRT (12:00 UTC) -> Desafio do Dia + Win-back (D3/D7/D14)
--   streak-saver-ofensiva 20:00 BRT (23:00 UTC) -> ofensiva em risco (streak-saver)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper de chamada: troque <PROJECT_REF> e o body por run.
-- Os agendamentos abaixo ja usam smart-responder + a key do Vault.

select cron.unschedule('streak-saver-ofensiva')
where exists (select 1 from cron.job where jobname = 'streak-saver-ofensiva');
select cron.schedule('streak-saver-ofensiva', '0 23 * * *', $cron$
  select net.http_post(
    url := 'https://vgalezyjhnddvemowgdp.supabase.co/functions/v1/smart-responder',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
    body := '{"run":"noite"}'::jsonb,
    timeout_milliseconds := 30000);
$cron$);

select cron.unschedule('notif-manha')
where exists (select 1 from cron.job where jobname = 'notif-manha');
select cron.schedule('notif-manha', '0 12 * * *', $cron$
  select net.http_post(
    url := 'https://vgalezyjhnddvemowgdp.supabase.co/functions/v1/smart-responder',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
    body := '{"run":"manha"}'::jsonb,
    timeout_milliseconds := 30000);
$cron$);

-- Conferir:  select jobname, schedule, active from cron.job order by jobname;
-- Teste manual de um lote (mesma chamada do cron); use {"run":"manha"} ou {"run":"noite"};
-- soUsuario filtra o envio a 1 usuario (so pra teste):
--   select net.http_post(
--     url := 'https://vgalezyjhnddvemowgdp.supabase.co/functions/v1/smart-responder',
--     headers := jsonb_build_object('Content-Type','application/json',
--       'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
--     body := '{"run":"manha","soUsuario":"<uuid>"}'::jsonb);
