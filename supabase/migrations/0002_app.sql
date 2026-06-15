-- 0002_app.sql — Treine seu Paladar
-- Tabelas do app conforme DECISOES-PRODUTO-V2.md (secoes 2, 3, 6, 8).
-- Espelham o estado local do engine (EstadoV1 em app/src/engine/types.ts) na nuvem,
-- que passa a ser a fonte da verdade (web app online, sem modo offline).
-- Convencao: "user_id" referencia auth.users(id). RLS em 0003, trigger de bootstrap em 0004.

-- ---------------------------------------------------------------- perfil

-- Perfil do jogador: objetivo reordena a trilha (secao 2). Mapeia
-- EstadoV1.objetivo / nivelDeclarado / onboardingCompleto.
create table profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  objetivo             text check (objetivo in ('mercado', 'restaurante', 'receber', 'presente', 'trabalho', 'outros')),
  nivel_declarado      text check (nivel_declarado in ('iniciante', 'intermediario', 'avancado')),
  onboarding_completo  boolean not null default false,
  created_at           timestamptz not null default now()
);
comment on table profiles is 'Perfil do jogador: objetivo, nivel e flag de onboarding (mapeia EstadoV1.objetivo/nivelDeclarado/onboardingCompleto).';

-- ---------------------------------------------------------------- trilha e progresso

-- Licoes autorais da trilha (6 unidades). O app EMPACOTA as licoes (versionadas em
-- codigo, app/src/content); esta tabela existe para a factory e para uma eventual
-- entrega de conteudo via servidor. Por isso progresso_licao.licao_id NAO referencia aqui.
create table licoes (
  id          text primary key,                  -- ex. 'u1-l3' (unidade 1, licao 3)
  unidade     smallint not null,                 -- 1..6
  ordem       smallint not null,                 -- ordem dentro da unidade (1..5) ou 0 p/ checkpoint
  titulo      text not null,
  habilidade  text,                              -- dimensao principal treinada (acidez, rotulo...)
  conteudo    jsonb not null,                    -- ficha canonica + sequencia de exercicios autorais
  versao      integer not null default 1,
  created_at  timestamptz not null default now(),
  unique (unidade, ordem)
);
comment on table licoes is 'Conteudo autoral da trilha (opcional na nuvem). O app empacota as licoes; tabela serve a factory e a entrega futura via servidor.';

-- Progresso por licao: coroas 0-3 (mastery) + agenda D+1/3/7/21 (secao 2).
-- licao_id e texto livre (sem FK): as licoes autorais sao versionadas no codigo.
create table progresso_licao (
  user_id           uuid not null references auth.users (id) on delete cascade,
  licao_id          text not null,
  coroas            smallint not null default 0 check (coroas between 0 and 3),
  vezes_concluida   smallint not null default 0,                -- alimenta o intervalo de revisao D+1/3/7/21
  ultima_conclusao  timestamptz,
  proxima_revisao   timestamptz,
  erros_pendentes   jsonb not null default '[]'::jsonb,         -- indices de exercicios a reinserir
  primary key (user_id, licao_id)
);
comment on table progresso_licao is 'Mastery por licao (0-3 coroas), agenda de revisao espacada e erros pendentes (mapeia EstadoV1.progresso).';

-- Score de Paladar por dimensao, estilo EPQ 0-1000; decai com inatividade (secao 2).
-- Dimensoes batem com HABILIDADES do engine (rotulo, nao "rotulo_compra").
create table score_paladar (
  user_id        uuid not null references auth.users (id) on delete cascade,
  dimensao       text not null check (dimensao in
    ('acidez', 'tanino', 'corpo', 'frutado', 'docura', 'rotulo', 'harmonizacao')),
  valor          integer not null default 0 check (valor between 0 and 1000),
  atualizado_em  timestamptz not null default now(),            -- ancora do decaimento lazy (scorePaladarTs)
  primary key (user_id, dimensao)
);
comment on table score_paladar is 'Score de Paladar 0-1000 por dimensao; atualizado_em ancora o decaimento lazy (mapeia EstadoV1.scorePaladar/scorePaladarTs).';

-- ---------------------------------------------------------------- economia (secoes 3 e 6)

-- Carteira do jogador: espelha EstadoV1.wallet 1:1, incluindo os contadores do dia
-- (persistidos para o soft cap nao zerar num reload) e criado_em (isencao D0 do soft cap).
create table wallet (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  xp_total       integer  not null default 0,                  -- placar, nunca se gasta
  cristais       integer  not null default 60,                 -- 60 de boas-vindas (paga exatamente 1 freeze)
  vidas          smallint not null default 5 check (vidas between 0 and 5),
  vidas_ts       timestamptz not null default now(),           -- ancora da regen (1 vida / 4h)
  streak         integer  not null default 0,
  best_streak    integer  not null default 0,
  freezes        smallint not null default 0,                  -- streak freezes em estoque (60 cristais cada)
  last_done      date,                                         -- ultimo dia local com meta concluida
  meta_diaria    smallint not null default 50,                 -- META_DIARIA_PADRAO (~10 min)
  -- Contadores do dia (rollover por data local America/Sao_Paulo); persistidos para o
  -- soft cap (licoes 1-3 100%, 4-5 50%, 6+ 25%) nao reiniciar quando a pessoa recarrega.
  xp_hoje        integer  not null default 0,
  data_hoje      date,                                         -- dia a que xp_hoje/licoes_hoje se referem
  licoes_hoje    smallint not null default 0,                  -- licoes NOVAS hoje (soft cap)
  praticas_hoje  smallint not null default 0,                  -- sessoes de pratica hoje (soft cap proprio)
  criado_em      timestamptz not null default now()            -- D0 isento de soft cap (ehD0)
);
comment on table wallet is 'Carteira do jogador (mapeia EstadoV1.wallet 1:1): XP, cristais, vidas, streak, freezes, meta e contadores do dia.';

-- Ledger de cristais: cada ganho/gasto vira uma linha imutavel (auditoria da economia).
-- INSERT so via service_role (Edge Function): protege o saldo contra forja no client.
create table transacoes_cristais (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  delta       integer not null,                  -- positivo = ganho, negativo = gasto
  motivo      text not null,                     -- ex. 'licao', 'meta_diaria', 'quest', 'streak_7d', 'compra_freeze'
  referencia  text,                              -- id do objeto relacionado (licao, item da loja...)
  created_at  timestamptz not null default now()
);
comment on table transacoes_cristais is 'Ledger imutavel de cristais; o saldo da wallet e a soma dos deltas. Escrita so via service_role.';

create index idx_transacoes_user on transacoes_cristais (user_id, created_at);

-- Marcos de XP avulso pagos uma unica vez por unidade (idempotente).
-- Mapeia EstadoV1.checkpoints (checkpoint 50) e EstadoV1.microAulas (micro-aula 5).
create table eventos_progresso (
  user_id     uuid not null references auth.users (id) on delete cascade,
  tipo        text not null check (tipo in ('checkpoint', 'micro_aula')),
  referencia  text not null,                     -- id da unidade
  pago_em     timestamptz not null default now(),
  primary key (user_id, tipo, referencia)
);
comment on table eventos_progresso is 'XP de unidade ja pago (checkpoint 50 / micro-aula 5), idempotente; mapeia EstadoV1.checkpoints e microAulas.';

-- Desafio do Dia premiado: idempotente por dia. Mapeia EstadoV1.ultimoDesafioXp.
create table desafio_premio (
  user_id      uuid not null references auth.users (id) on delete cascade,
  data         date not null,                    -- dia America/Sao_Paulo
  premiado_em  timestamptz not null default now(),
  primary key (user_id, data)
);
comment on table desafio_premio is 'Dias em que o XP do Desafio do Dia ja foi pago ao jogador (mapeia EstadoV1.ultimoDesafioXp).';

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
  user_id     uuid references auth.users (id) on delete set null,  -- null = post editorial do app
  tipo        text not null check (tipo in
    ('conquista', 'degustacao_palpite', 'desafio_resultado', 'provei')),
  payload     jsonb not null,                    -- estrutura por tipo (card, palpite 5D, grade, chips)
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

-- ---------------------------------------------------------------- fabrica (secao 9) e Desafio do Dia (secao 3)

-- Exercicios: autorais ou gerados pela factory com auditoria em 4 camadas.
create table exercicios (
  id                bigint generated always as identity primary key,
  formato           text not null,               -- 'slider_estimativa', 'connections', 'cenario', 'swipe_harmonizacao',
                                                 -- 'hotspot_rotulo', 'ordenar', 'intruso', 'rotulo_do_dia', etc.
  payload           jsonb not null,              -- contrato JSON Schema por formato
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
