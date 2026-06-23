-- 0019_quiz_embaralhar.sql — Embaralha as opções do quiz na GRAVAÇÃO.
-- Aditivo e idempotente.
--
-- Problema: o n8n gera as perguntas com a resposta certa sempre na 1ª posição
-- (correta=0). O quiz ficava "decorável" (é sempre a de cima). Conserto: ao gravar,
-- permuta aleatoriamente as opções de cada pergunta e remapeia `correta` para a
-- nova posição. O app não muda (perguntas_da_sessao continua omitindo o gabarito;
-- responder_quiz valida pelo índice guardado, que agora aponta pra posição certa).
--
-- Blindagem da sincronia array<->índice: o sorteio (random()) roda UMA vez via CTE
-- `materialized`, e o array embaralhado e o novo índice saem da MESMA passada.
-- O clamp da `correta` respeita o TAMANHO REAL do array (não assume 3 opções), e
-- `opcoes` não-array vira [] em vez de abortar — assim um formato inesperado do n8n
-- nunca corrompe o gabarito silenciosamente.

-- Embaralha um array jsonb de opções e devolve {opcoes:[...], correta:N} com o novo
-- índice da opção que era a correta. Pura (sem acesso a tabela); volatile (random()).
create or replace function public.embaralhar_opcoes(p_opcoes jsonb, p_correta int)
returns jsonb
language sql
volatile
set search_path = public
as $$
  with param as (
    -- normaliza opcoes para array e clampa a correta pelos limites REAIS do array
    select arr as opcoes,
           greatest(0, least(jsonb_array_length(arr) - 1, coalesce(p_correta, 0))) as correta
    from (select case when jsonb_typeof(p_opcoes) = 'array' then p_opcoes else '[]'::jsonb end as arr) a
  ),
  ordenado as materialized (
    select t.elem,
           (row_number() over (order by random()) - 1) as idx_novo,
           ((t.ord - 1) = p.correta)                   as eh_correta
    from param p
    cross join lateral jsonb_array_elements(p.opcoes) with ordinality as t(elem, ord)
  )
  select jsonb_build_object(
    'opcoes',  coalesce(jsonb_agg(elem order by idx_novo), '[]'::jsonb),
    'correta', coalesce(max(idx_novo) filter (where eh_correta), 0)
  )
  from ordenado;
$$;
comment on function public.embaralhar_opcoes is 'Permuta aleatoriamente um array jsonb de opções e devolve {opcoes, correta} com o índice remapeado da opção correta. Um único sorteio (CTE materialized) garante array e índice sincronizados; clamp pelo tamanho real do array; não-array vira [].';
revoke all on function public.embaralhar_opcoes(jsonb, int) from public, anon, authenticated;

-- Regrava n8n_gravar_quiz embaralhando cada pergunta na inserção.
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
         s.emb->'opcoes',
         (s.emb->>'correta')::int,
         nullif(e.value->>'habilidade', ''),
         nullif(e.value->>'explicacao', '')
  from jsonb_array_elements(p_perguntas) with ordinality as e(value, ord)
  cross join lateral (
    -- embaralha as opções desta pergunta (clamp e normalização ficam na função)
    select public.embaralhar_opcoes(
      e.value->'opcoes',
      coalesce((e.value->>'correta')::int, 0)
    ) as emb
  ) s;
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
