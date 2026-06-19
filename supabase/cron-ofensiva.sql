-- cron-ofensiva.sql — Agenda o streak-saver para rodar 1x/dia as 20h de Brasilia.
-- RODAR DEPOIS de fazer o deploy da Edge Function `enviar-push` e setar os secrets.
-- NAO faz parte do migrate (tem segredo + URL de funcao). Rode no SQL Editor do
-- Supabase (ou via psql) trocando os dois placeholders:
--   <CRON_SECRET>  = o mesmo valor passado em `supabase secrets set CRON_SECRET=...`
--   <PROJECT_REF>  = vgalezyjhnddvemowgdp (projeto de producao)
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
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/enviar-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
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
--   select net.http_post(url:='https://<PROJECT_REF>.supabase.co/functions/v1/enviar-push',
--     headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer <CRON_SECRET>'),
--     body:='{}'::jsonb);
