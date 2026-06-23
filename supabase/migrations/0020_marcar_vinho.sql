-- 0020_marcar_vinho.sql — Escreve o vinho identificado na sessao ANTES do quiz ficar
-- pronto, pra "A Lente" mostrar "Encontramos seu vinho" durante a espera (a tela de
-- analise vira um momento, nao um spinner morto). Mantem status 'processando'.
-- Aditivo e idempotente. service_role only (o n8n chama no meio do fluxo, ~9s).

create or replace function public.n8n_marcar_vinho(p_quiz uuid, p_vinho jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quiz_sessoes
     set vinho = coalesce(p_vinho, vinho),
         atualizado_em = now()
   where id = p_quiz and status = 'processando';
  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.n8n_marcar_vinho(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.n8n_marcar_vinho(uuid, jsonb) to service_role;
