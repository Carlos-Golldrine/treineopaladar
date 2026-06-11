-- 0002_app.sql — Treine seu Paladar
-- Tabelas do app conforme DECISOES-PRODUTO-V2.md (secoes 2, 3, 6, 8).
-- Convencao: "user_id" referencia auth.users(id). RLS basico comentado no fim.

-- ---------------------------------------------------------------- perfil

-- Perfil do jogador: objetivo declarado no onboarding reordena a trilha (secao 2).
create table profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  objetivo         text check (objetivo in ('mercado', 'restaurante', 'receber_em_casa', 'hobby')),
  nivel_declarado  text check (nivel_declarado in ('iniciante', 'intermediario', 'avancado')),
  created_at       timestamptz not null default now()
);
comment on table profiles is 'Perfil do jogador: objetivo e nivel declarados no onboarding (personalizam a trilha).';

-- ---------------------------------------------------------------- trilha e progresso

-- Licoes autorais da trilha: 6 unidades x 5 licoes, conteudo versionado em jsonb (secao 2).
create table licoes (
  id          text primary key,                  -- ex. 'u1-l3' (unidade 1, licao 3)
  unidade     smallint not null,                 -- 1..6
  ordem       smallint not null,                 -- ordem dentro da unidade (1..5) ou 0 p/ checkpoint
  titulo      text not null,
  habilidade  text,                              -- dimensao principal treinada (acidez, rotulo_compra...)
  conteudo    jsonb not null,                    -- ficha canonica + sequencia de exercicios autorais
  versao      integer not null default 1,
  created_at  timestamptz not null default now(),
  unique (unidade, ordem)
);
comment on table licoes is 'Conteudo autoral da trilha (30 licoes + checkpoints), com ficha canonica de fatos por licao.';

-- Progresso por licao: coroas 0-3 (mastery) + agenda de revisao espacada D+1/3/7/21 (secao 2).
create table progresso_licao (
  user_id          uuid not null references auth.users (id) on delete cascade,
  licao_id         text not null references licoes (id),
  coroas           smallint not null default 0 check (coroas between 0 and 3),
  ultima_vez       timestamptz,
  proxima_revisao  timestamptz,
  primary key (user_id, licao_id)
);
comment on table progresso_licao is 'Mastery por licao (0-3 coroas) e proxima revisao espacada do jogador.';

-- Score de Paladar por dimensao, estilo EPQ 0-1000; decai com inatividade (secao 2).
create table score_paladar (
  user_id        uuid not null references auth.users (id) on delete cascade,
  dimensao       text not null check (dimensao in
    ('acidez', 'tanino', 'corpo', 'frutado', 'docura', 'rotulo_compra', 'harmonizacao')),
  valor          integer not null default 0 check (valor between 0 and 1000),
  atualizado_em  timestamptz not null default now(),
  primary key (user_id, dimensao)
);
comment on table score_paladar is 'Score de Paladar 0-1000 por dimensao sensorial + Rotulo & Compra + Harmonizacao.';

-- ---------------------------------------------------------------- economia (secoes 3 e 6)

-- Carteira do jogador: XP (placar), cristais (moeda), vidas com regen e streak.
create table wallet (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  xp_total     integer not null default 0,
  cristais     integer not null default 0,       -- saldo atual (60 de boas-vindas no 1o acesso)
  vidas        smallint not null default 5 check (vidas between 0 and 5),
  vidas_ts     timestamptz,                      -- carimbo da ultima regen (1 vida / 4h)
  streak       integer not null default 0,
  best_streak  integer not null default 0,
  freezes      smallint not null default 0,      -- streak freezes em estoque (60 cristais cada)
  last_done    date                              -- ultimo dia com meta concluida (calculo de streak)
);
comment on table wallet is 'Carteira do jogador: XP, cristais, vidas (regen 1/4h), streak e freezes.';

-- Ledger de cristais: cada ganho/gasto vira uma linha imutavel (auditoria da economia).
create table transacoes_cristais (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  delta       integer not null,                  -- positivo = ganho, negativo = gasto
  motivo      text not null,                     -- ex. 'licao', 'meta_diaria', 'quest', 'streak_7d', 'compra_freeze'
  referencia  text,                              -- id do objeto relacionado (licao, item da loja...)
  created_at  timestamptz not null default now()
);
comment on table transacoes_cristais is 'Ledger imutavel de cristais; o saldo da wallet e a soma dos deltas.';

create index idx_transacoes_user on transacoes_cristais (user_id, created_at);

-- ---------------------------------------------------------------- A Mesa (secao 8)

-- Mesa semanal: ~20 pessoas do mesmo ritmo (coorte da liga) por semana ISO.
create table mesas (
  id          uuid primary key default gen_random_uuid(),
  semana_iso  text not null,                     -- ex. '2026-W24'
  divisao     text not null,                     -- liga/divisao da coorte (ex. 'bronze-3')
  created_at  timestamptz not null default now()
);
comment on table mesas is 'Mesa de degustacao semanal: a cara social da liga, ~20 jogadores por coorte.';

create index idx_mesas_semana on mesas (semana_iso);

-- Quem senta em cada mesa na semana.
create table mesa_membros (
  mesa_id    uuid not null references mesas (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  entrou_em  timestamptz not null default now(),
  primary key (mesa_id, user_id)
);
comment on table mesa_membros is 'Membros de cada mesa semanal (pareamento por coorte da liga).';

-- Feed estruturado da mesa: 4 tipos de post, payload jsonb, sem texto livre obrigatorio.
create table mesa_posts (
  id          uuid primary key default gen_random_uuid(),
  mesa_id     uuid not null references mesas (id) on delete cascade,
  user_id     uuid references auth.users (id) on delete set null,  -- null = post editorial do app (Degustacao da Semana)
  tipo        text not null check (tipo in
    ('conquista', 'degustacao_palpite', 'desafio_resultado', 'provei')),
  payload     jsonb not null,                    -- estrutura por tipo (card de conquista, palpite 5D, grade do desafio, chips do provei)
  created_at  timestamptz not null default now()
);
comment on table mesa_posts is 'Feed da mesa: cards de conquista, palpites da Degustacao da Semana, resultados do desafio e "provei".';

create index idx_mesa_posts_mesa on mesa_posts (mesa_id, created_at);

-- Reacao unica e positiva: o Tchin! (kudos de 1 toque).
create table mesa_tchins (
  post_id     uuid not null references mesa_posts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
comment on table mesa_tchins is 'Reacoes Tchin! (kudos positivos, 1 por jogador por post).';

-- ---------------------------------------------------------------- fabrica de questoes (secao 9) e Desafio do Dia (secao 3)

-- Exercicios: autorais ou gerados pela factory com IA enjaulada + auditoria em 4 camadas.
create table exercicios (
  id                bigint generated always as identity primary key,
  formato           text not null,               -- ex. 'slider_estimativa', 'connections', 'cenario', 'swipe_harmonizacao',
                                                 -- 'hotspot_rotulo', 'ordenar', 'intruso', 'rotulo_do_dia',
                                                 -- 'multipla_escolha', 'associacao', 'montar_frase', 'duas_verdades'
  payload           jsonb not null,              -- contrato JSON Schema por formato (enunciado, opcoes, resposta, reveal)
  dificuldade       numeric(3,2),                -- P(acerto) alvo por nivel (0-1)
  habilidade        text,                        -- dimensao treinada (liga ao score_paladar)
  origem            text not null check (origem in ('autoral', 'factory')),
  status_auditoria  text not null default 'pendente'
    check (status_auditoria in ('pendente', 'validado_programatico', 'verificado_ia', 'amostra_humana', 'aprovado', 'reprovado', 'em_revisao')),
  vinho_id          text references vinhos (id), -- vinho-fonte quando o exercicio nasce do banco
  licao_id          text references licoes (id), -- licao a que pertence (null p/ estoque da factory)
  created_at        timestamptz not null default now()
);
comment on table exercicios is 'Banco de exercicios (12 formatos): autorais ou da factory, com status da auditoria em 4 camadas.';

create index idx_exercicios_formato on exercicios (formato);
create index idx_exercicios_estoque on exercicios (habilidade, dificuldade) where status_auditoria = 'aprovado';

-- Desafio do Dia: 1 exercicio igual para todos, reset a meia-noite de Brasilia.
create table desafio_dia (
  data          date primary key,                -- dia (America/Sao_Paulo)
  exercicio_id  bigint not null references exercicios (id)
);
comment on table desafio_dia is 'O exercicio unico do dia (north star de habito, resultado compartilhavel sem spoiler).';

-- ---------------------------------------------------------------- RLS basico (ativar quando o projeto Supabase existir)

-- Padrao: cada jogador le/escreve apenas as proprias linhas (policies de owner);
-- conteudo (licoes, exercicios aprovados, desafio_dia) e leitura para autenticados;
-- escrita de conteudo e da economia critica fica no service_role (functions).
--
-- alter table profiles enable row level security;
-- create policy "profiles_owner" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
--
-- alter table progresso_licao enable row level security;
-- create policy "progresso_owner" on progresso_licao for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
--
-- alter table score_paladar enable row level security;
-- create policy "score_owner_select" on score_paladar for select using (auth.uid() = user_id);
--
-- alter table wallet enable row level security;
-- create policy "wallet_owner_select" on wallet for select using (auth.uid() = user_id);
--
-- alter table transacoes_cristais enable row level security;
-- create policy "transacoes_owner_select" on transacoes_cristais for select using (auth.uid() = user_id);
--
-- alter table mesas enable row level security;
-- create policy "mesas_membro_select" on mesas for select using (exists (select 1 from mesa_membros m where m.mesa_id = id and m.user_id = auth.uid()));
--
-- alter table mesa_membros enable row level security;
-- create policy "mesa_membros_select" on mesa_membros for select using (exists (select 1 from mesa_membros m where m.mesa_id = mesa_membros.mesa_id and m.user_id = auth.uid()));
--
-- alter table mesa_posts enable row level security;
-- create policy "mesa_posts_select_membro" on mesa_posts for select using (exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid()));
-- create policy "mesa_posts_insert_membro" on mesa_posts for insert with check (auth.uid() = user_id and exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid()));
--
-- alter table mesa_tchins enable row level security;
-- create policy "tchins_select_membro" on mesa_tchins for select using (exists (select 1 from mesa_posts p join mesa_membros m on m.mesa_id = p.mesa_id where p.id = post_id and m.user_id = auth.uid()));
-- create policy "tchins_insert_proprio" on mesa_tchins for insert with check (auth.uid() = user_id);
--
-- alter table licoes enable row level security;
-- create policy "licoes_leitura" on licoes for select using (auth.role() = 'authenticated');
--
-- alter table exercicios enable row level security;
-- create policy "exercicios_leitura_aprovados" on exercicios for select using (status_auditoria = 'aprovado');
--
-- alter table desafio_dia enable row level security;
-- create policy "desafio_leitura" on desafio_dia for select using (auth.role() = 'authenticated');
