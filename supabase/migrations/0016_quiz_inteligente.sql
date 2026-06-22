-- 0016_quiz_inteligente.sql — Quiz Inteligente da Lente (scan-aprenda) com zero-delay.
-- Sessao isolada por quiz_id; o n8n (service_role) faz OCR -> identifica o vinho ->
-- GERA perguntas+gabarito e grava aqui; o app le SEM o gabarito e valida no servidor.
-- Aditivo e idempotente.

-- ============ Tabelas ============

create table if not exists public.quiz_sessoes (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users (id) on delete cascade,
  vinho_id     uuid,                              -- preenchido pelo n8n apos identificar
  imagem       text,                              -- path/url do rotulo escaneado (opcional)
  status       text not null default 'processando'
               check (status in ('processando', 'pronto', 'erro')),
  erro         text,                              -- mensagem quando status = 'erro'
  created_at   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists quiz_sessoes_usuario_idx on public.quiz_sessoes (usuario_id, created_at desc);

-- Perguntas geradas pra sessao. `correta` e o GABARITO — NUNCA exposto ao client
-- (RLS sem policy de select; o app le via RPC que omite a correta).
create table if not exists public.quiz_perguntas (
  id          bigint generated always as identity primary key,
  quiz_id     uuid not null references public.quiz_sessoes (id) on delete cascade,
  ordem       int not null,
  pergunta    text not null,
  opcoes      jsonb not null,                     -- array de strings: ["Tinto","Branco",...]
  correta     int not null,                       -- indice da opcao correta (gabarito)
  habilidade  text,                               -- rotulo|acidez|tanino|corpo|frutado|docura
  explicacao  text,                               -- o "porque", mostrado no reveal
  unique (quiz_id, ordem)
);
create index if not exists quiz_perguntas_quiz_idx on public.quiz_perguntas (quiz_id, ordem);

-- Respostas do usuario (validadas no servidor).
create table if not exists public.quiz_respostas (
  id              bigint generated always as identity primary key,
  quiz_id         uuid not null references public.quiz_sessoes (id) on delete cascade,
  pergunta_id     bigint not null references public.quiz_perguntas (id) on delete cascade,
  resposta_usuario int not null,
  acertou         boolean not null,
  created_at      timestamptz not null default now(),
  unique (quiz_id, pergunta_id)                   -- 1 resposta por pergunta
);
create index if not exists quiz_respostas_quiz_idx on public.quiz_respostas (quiz_id);

-- ============ RLS ============
-- O dono ve a propria sessao (pra fazer polling de status/vinho_id) e as proprias
-- respostas. quiz_perguntas NAO tem policy de select -> o client nao le direto
-- (gabarito protegido). O n8n escreve via service_role (ignora RLS).

alter table public.quiz_sessoes enable row level security;
drop policy if exists "quiz_sessoes_dono" on public.quiz_sessoes;
create policy "quiz_sessoes_dono" on public.quiz_sessoes
  for select using (auth.uid() = usuario_id);

alter table public.quiz_perguntas enable row level security;
-- (sem policy: select direto bloqueado; acesso so via RPC SECURITY DEFINER)

alter table public.quiz_respostas enable row level security;
drop policy if exists "quiz_respostas_dono" on public.quiz_respostas;
create policy "quiz_respostas_dono" on public.quiz_respostas
  for select using (
    exists (
      select 1 from public.quiz_sessoes s
      where s.id = quiz_respostas.quiz_id and s.usuario_id = auth.uid()
    )
  );

-- ============ RPCs ============

-- Cria a sessao (status 'processando') e devolve o quiz_id. O app chama isto na
-- hora do scan e ja mostra a Q1 generica; o disparo do n8n (com a imagem) e feito
-- por uma Edge Function/endpoint a parte.
create or replace function public.criar_sessao_quiz(p_imagem text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;
  insert into public.quiz_sessoes (usuario_id, imagem)
  values (v_uid, p_imagem)
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.criar_sessao_quiz(text) from public, anon;
grant execute on function public.criar_sessao_quiz(text) to authenticated;

-- Perguntas da sessao SEM o gabarito (pro app renderizar). So o dono.
create or replace function public.perguntas_da_sessao(p_quiz uuid)
returns table (id bigint, ordem int, pergunta text, opcoes jsonb, habilidade text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.quiz_sessoes s where s.id = p_quiz and s.usuario_id = auth.uid()) then
    raise exception 'sessao nao e sua';
  end if;
  return query
    select q.id, q.ordem, q.pergunta, q.opcoes, q.habilidade
    from public.quiz_perguntas q
    where q.quiz_id = p_quiz
    order by q.ordem;
end;
$$;
revoke execute on function public.perguntas_da_sessao(uuid) from public, anon;
grant execute on function public.perguntas_da_sessao(uuid) to authenticated;

-- Valida a resposta no servidor (compara com o gabarito), registra e devolve o
-- resultado + a correta/explicacao pro reveal (revelar DEPOIS de responder e ok).
create or replace function public.responder_quiz(p_quiz uuid, p_pergunta bigint, p_resposta int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correta int;
  v_explic  text;
  v_acertou boolean;
begin
  if not exists (select 1 from public.quiz_sessoes s where s.id = p_quiz and s.usuario_id = auth.uid()) then
    raise exception 'sessao nao e sua';
  end if;
  select q.correta, q.explicacao into v_correta, v_explic
    from public.quiz_perguntas q
    where q.id = p_pergunta and q.quiz_id = p_quiz;
  if v_correta is null then
    raise exception 'pergunta inexistente nesta sessao';
  end if;
  v_acertou := (p_resposta = v_correta);
  insert into public.quiz_respostas (quiz_id, pergunta_id, resposta_usuario, acertou)
  values (p_quiz, p_pergunta, p_resposta, v_acertou)
  on conflict (quiz_id, pergunta_id) do nothing; -- nao deixa responder 2x
  return jsonb_build_object('acertou', v_acertou, 'correta', v_correta, 'explicacao', v_explic);
end;
$$;
revoke execute on function public.responder_quiz(uuid, bigint, int) from public, anon;
grant execute on function public.responder_quiz(uuid, bigint, int) to authenticated;
