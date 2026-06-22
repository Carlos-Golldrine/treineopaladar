-- cron-ofensiva.sql — Agenda o streak-saver para rodar 1x/dia as 20h de Brasilia.
-- RODAR DEPOIS de fazer o deploy da Edge Function `enviar-push` e setar os secrets
-- VAPID. Rode no SQL Editor do Supabase, trocando o placeholder:
--   <PROJECT_REF> = vgalezyjhnddvemowgdp (projeto de producao)
--
-- A funcao foi deployada com o nome `smart-responder` (nome padrao do template);
-- o codigo-fonte vive em supabase/functions/enviar-push/index.ts.
--
-- A chamada usa a service_role key como Bearer (a funcao so roda com ela). Use a
-- key LEGADA service_role (um JWT que comeca com `eyJ...`, em Project Settings ->
-- API -> Legacy keys / service_role) — e a que a funcao recebe injetada. Em vez de
-- colar a key aqui, guardamos no Vault e o cron a lê de la (nao fica exposta na
-- cron.job). Rode UMA vez:
--   select vault.create_secret('SUA_SERVICE_ROLE_KEY_eyJ...', 'service_role_key');
--
-- Brasil nao tem horario de verao desde 2019: America/Sao_Paulo = UTC-3 fixo,
-- entao 20:00 Brasilia = 23:00 UTC. Se o DST voltar, ajustar a hora do cron.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotente: re-rodar atualiza o agendamento (mesmo nome de job).
select cron.unschedule('streak-saver-ofensiva')
where exists (select 1 from cron.job where jobname = 'streak-saver-ofensiva');

select cron.schedule(
  'streak-saver-ofensiva',
  '0 23 * * *',  -- 23:00 UTC = 20:00 America/Sao_Paulo
  $cron$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/smart-responder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);

-- Conferir o agendamento:
--   select jobname, schedule, active from cron.job where jobname = 'streak-saver-ofensiva';
-- Ver as ultimas execucoes:
--   select status, return_message, start_time from cron.job_run_details
--     where jobid = (select jobid from cron.job where jobname='streak-saver-ofensiva')
--     order by start_time desc limit 5;
-- Disparar manualmente uma vez para testar (mesma chamada do cron):
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/smart-responder',
--     headers := jsonb_build_object('Content-Type','application/json',
--       'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='service_role_key')),
--     body := '{}'::jsonb);
