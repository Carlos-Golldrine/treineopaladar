-- 0021_sala_ao_vivo.sql — Sala Ao Vivo de Degustacao (quiz em grupo, ranking em tempo real).
-- Reaproveita o quiz da Lente (quiz_sessoes/quiz_perguntas): o anfitriao escaneia um vinho,
-- gera o quiz e cria uma SALA com codigo; os participantes entram pelo codigo e respondem o
-- MESMO quiz; o ranking sobe AO VIVO (Supabase Realtime em sala_participantes). O gabarito
-- continua protegido (perguntas_da_sala omite a correta; responder_sala valida no servidor).
-- Aditivo e idempotente.

-- ===================== Tabelas =====================
create table if not exists public.salas (
  id           uuid primary key default gen_random_uuid(),
  codigo       text not null unique,                 -- codigo curto pra entrar (ex.: ABC234)
  anfitriao_id uuid not null references auth.users (id) on delete cascade,
  quiz_id      uuid not null references public.quiz_sessoes (id) on delete cascade,
  vinho        jsonb,                                -- ficha do vinho, pra exibir
  status       text not null default 'aberta' check (status in ('aberta', 'encerrada')),
  created_at   timestamptz not null default now()
);
create index if not exists salas_codigo_idx on public.salas (codigo);

create table if not exists public.sala_participantes (
  sala_id     uuid not null references public.salas (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  nome        text,
  pontos      int not null default 0,
  acertos     int not null default 0,
  respondidas int not null default 0,
  entrou_em   timestamptz not null default now(),
  primary key (sala_id, user_id)
);
create index if not exists sala_participantes_sala_idx on public.sala_participantes (sala_id, pontos desc);

create table if not exists public.sala_respostas (
  id               bigint generated always as identity primary key,
  sala_id          uuid not null references public.salas (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  pergunta_id      bigint not null references public.quiz_perguntas (id) on delete cascade,
  resposta_usuario int not null,
  acertou          boolean not null,
  created_at       timestamptz not null default now(),
  unique (sala_id, user_id, pergunta_id)             -- 1 resposta por pergunta por participante
);

-- ===================== RLS =====================
alter table public.salas enable row level security;
alter table public.sala_participantes enable row level security;
alter table public.sala_respostas enable row level security;

-- True se p_user participa de p_sala. SECURITY DEFINER pra nao recair no RLS (evita recursao).
create or replace function public.eh_participante(p_sala uuid, p_user uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.sala_participantes sp where sp.sala_id = p_sala and sp.user_id = p_user
  );
$$;
grant execute on function public.eh_participante(uuid, uuid) to authenticated;

drop policy if exists "salas_participante_sel" on public.salas;
create policy "salas_participante_sel" on public.salas
  for select using (public.eh_participante(id, auth.uid()));

-- Participantes da sala se veem (roster + leaderboard ao vivo via Realtime).
drop policy if exists "sala_part_sel" on public.sala_participantes;
create policy "sala_part_sel" on public.sala_participantes
  for select using (public.eh_participante(sala_id, auth.uid()));

-- Cada um le so as proprias respostas (o placar agregado vive em sala_participantes).
drop policy if exists "sala_resp_own" on public.sala_respostas;
create policy "sala_resp_own" on public.sala_respostas
  for select using (auth.uid() = user_id);

-- Realtime: o leaderboard atualiza ao vivo quando os pontos mudam.
alter table public.sala_participantes replica identity full;
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sala_participantes'
  ) then
    alter publication supabase_realtime add table public.sala_participantes;
  end if;
end $$;

-- ===================== RPCs =====================

-- Codigo curto, legivel e unico (sem 0/O, 1/I pra falar em voz alta sem erro).
create or replace function public.gerar_codigo_sala()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo   text;
  v_i        int;
begin
  loop
    v_codigo := '';
    for v_i in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.salas where codigo = v_codigo);
  end loop;
  return v_codigo;
end $$;
revoke all on function public.gerar_codigo_sala() from public, anon, authenticated;

-- Anfitriao cria a sala a partir do quiz pronto que ele escaneou.
create or replace function public.criar_sala(p_quiz uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_sessao record;
  v_codigo text;
  v_sala   uuid;
  v_nome   text;
begin
  if v_uid is null then raise exception 'sem sessao'; end if;
  select * into v_sessao from public.quiz_sessoes where id = p_quiz;
  if v_sessao.id is null then raise exception 'quiz inexistente'; end if;
  if v_sessao.usuario_id <> v_uid then raise exception 'quiz nao e seu'; end if;
  if v_sessao.status <> 'pronto' then raise exception 'quiz ainda nao esta pronto'; end if;

  v_codigo := public.gerar_codigo_sala();
  insert into public.salas (codigo, anfitriao_id, quiz_id, vinho)
  values (v_codigo, v_uid, p_quiz, v_sessao.vinho)
  returning id into v_sala;

  select nome into v_nome from public.profiles where id = v_uid;
  insert into public.sala_participantes (sala_id, user_id, nome)
  values (v_sala, v_uid, v_nome) on conflict do nothing;

  return jsonb_build_object('sala_id', v_sala, 'codigo', v_codigo);
end $$;
revoke execute on function public.criar_sala(uuid) from public, anon;
grant execute on function public.criar_sala(uuid) to authenticated;

-- Participante entra pelo codigo.
create or replace function public.entrar_sala(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_sala record;
  v_nome text;
begin
  if v_uid is null then raise exception 'sem sessao'; end if;
  select * into v_sala from public.salas where codigo = upper(trim(p_codigo)) and status = 'aberta' limit 1;
  if v_sala.id is null then raise exception 'sala nao encontrada'; end if;
  select nome into v_nome from public.profiles where id = v_uid;
  insert into public.sala_participantes (sala_id, user_id, nome)
  values (v_sala.id, v_uid, v_nome) on conflict do nothing;
  return jsonb_build_object('sala_id', v_sala.id, 'codigo', v_sala.codigo, 'vinho', v_sala.vinho);
end $$;
revoke execute on function public.entrar_sala(text) from public, anon;
grant execute on function public.entrar_sala(text) to authenticated;

-- Perguntas da sala SEM o gabarito (so participante).
create or replace function public.perguntas_da_sala(p_sala uuid)
returns table(id bigint, ordem int, pergunta text, opcoes jsonb, habilidade text)
language plpgsql security definer set search_path = public as $$
declare v_quiz uuid;
begin
  if not public.eh_participante(p_sala, auth.uid()) then raise exception 'voce nao esta na sala'; end if;
  select quiz_id into v_quiz from public.salas where salas.id = p_sala;
  return query
    select q.id, q.ordem, q.pergunta, q.opcoes, q.habilidade
    from public.quiz_perguntas q where q.quiz_id = v_quiz order by q.ordem;
end $$;
revoke execute on function public.perguntas_da_sala(uuid) from public, anon;
grant execute on function public.perguntas_da_sala(uuid) to authenticated;

-- Responde na sala: valida no servidor, pontua (+10 por acerto) e atualiza o participante.
create or replace function public.responder_sala(p_sala uuid, p_pergunta bigint, p_resposta int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_quiz    uuid;
  v_correta int;
  v_explic  text;
  v_acertou boolean;
  v_n       int;
begin
  if not public.eh_participante(p_sala, v_uid) then raise exception 'voce nao esta na sala'; end if;
  select quiz_id into v_quiz from public.salas where salas.id = p_sala;
  select q.correta, q.explicacao into v_correta, v_explic
    from public.quiz_perguntas q where q.id = p_pergunta and q.quiz_id = v_quiz;
  if v_correta is null then raise exception 'pergunta nao e da sala'; end if;
  v_acertou := (p_resposta = v_correta);

  insert into public.sala_respostas (sala_id, user_id, pergunta_id, resposta_usuario, acertou)
  values (p_sala, v_uid, p_pergunta, p_resposta, v_acertou)
  on conflict (sala_id, user_id, pergunta_id) do nothing;
  get diagnostics v_n = row_count;

  if v_n > 0 then
    update public.sala_participantes
       set respondidas = respondidas + 1,
           acertos = acertos + (case when v_acertou then 1 else 0 end),
           pontos = pontos + (case when v_acertou then 10 else 0 end)
     where sala_id = p_sala and user_id = v_uid;
  end if;

  return jsonb_build_object('acertou', v_acertou, 'correta', v_correta, 'explicacao', v_explic, 'nova', v_n > 0);
end $$;
revoke execute on function public.responder_sala(uuid, bigint, int) from public, anon;
grant execute on function public.responder_sala(uuid, bigint, int) to authenticated;

-- Ranking ao vivo (carga inicial; o Realtime cuida das atualizacoes).
create or replace function public.ranking_sala(p_sala uuid)
returns table(user_id uuid, nome text, pontos int, acertos int, respondidas int, posicao int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.eh_participante(p_sala, auth.uid()) then raise exception 'voce nao esta na sala'; end if;
  return query
    select sp.user_id, sp.nome, sp.pontos, sp.acertos, sp.respondidas,
           (row_number() over (order by sp.pontos desc, sp.acertos desc, sp.entrou_em asc))::int as posicao
    from public.sala_participantes sp where sp.sala_id = p_sala
    order by posicao;
end $$;
revoke execute on function public.ranking_sala(uuid) from public, anon;
grant execute on function public.ranking_sala(uuid) to authenticated;
