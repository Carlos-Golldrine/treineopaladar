-- 0017_quiz_n8n_rpc.sql — Ponte do n8n para o Quiz Inteligente.
-- O fluxo n8n (OCR -> identifica -> gera Q&A) grava TUDO numa chamada via service_role:
--   n8n_gravar_quiz(quiz, perguntas, vinho) -> insere perguntas + marca a sessao pronta.
--   n8n_marcar_erro(quiz, msg)             -> marca a sessao com erro.
-- Tambem guarda a ficha do vinho na sessao (coluna vinho jsonb) pra "A Lente" exibir.
-- Aditivo e idempotente.

-- Ficha do vinho identificado (o que o Agente Sommelier devolve), pra tela da Lente.
alter table public.quiz_sessoes add column if not exists vinho jsonb;

-- Grava as perguntas geradas pelo n8n e marca a sessao pronta. Transacional e
-- idempotente (re-execucao do fluxo limpa e regrava as perguntas da sessao).
create or replace function public.n8n_gravar_quiz(p_quiz uuid, p_perguntas jsonb, p_vinho jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  if not exists (select 1 from public.quiz_sessoes where id = p_quiz) then
    raise exception 'sessao % inexistente', p_quiz;
  end if;
  -- re-execucao: substitui as perguntas anteriores desta sessao
  delete from public.quiz_perguntas where quiz_id = p_quiz;
  insert into public.quiz_perguntas (quiz_id, ordem, pergunta, opcoes, correta, habilidade, explicacao)
  select p_quiz,
         coalesce((e.value->>'ordem')::int, e.ord::int),
         e.value->>'pergunta',
         coalesce(e.value->'opcoes', '[]'::jsonb),
         greatest(0, least(2, coalesce((e.value->>'correta')::int, 0))),
         nullif(e.value->>'habilidade', ''),
         nullif(e.value->>'explicacao', '')
  from jsonb_array_elements(p_perguntas) with ordinality as e(value, ord);
  get diagnostics v_n = row_count;
  update public.quiz_sessoes
     set status = 'pronto',
         vinho = coalesce(p_vinho, vinho),
         atualizado_em = now()
   where id = p_quiz;
  return jsonb_build_object('ok', true, 'inseridas', v_n);
end;
$$;
revoke execute on function public.n8n_gravar_quiz(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.n8n_gravar_quiz(uuid, jsonb, jsonb) to service_role;

-- Marca a sessao com erro (vinho nao identificado, OCR falhou, etc.).
create or replace function public.n8n_marcar_erro(p_quiz uuid, p_msg text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.quiz_sessoes
     set status = 'erro',
         erro = coalesce(p_msg, 'falha ao processar'),
         atualizado_em = now()
   where id = p_quiz;
  return jsonb_build_object('ok', true);
end;
$$;
revoke execute on function public.n8n_marcar_erro(uuid, text) from public, anon, authenticated;
grant execute on function public.n8n_marcar_erro(uuid, text) to service_role;
