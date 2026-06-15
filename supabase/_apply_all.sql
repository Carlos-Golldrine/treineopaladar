-- _apply_all.sql (GERADO) — concatenacao de migrations/0001..0005 para colar no SQL Editor.
-- Fonte da verdade: os arquivos em migrations/. Rode UMA vez num projeto novo.

-- 0001_vinhos.sql — Treine seu Paladar
-- Catalogo de vinhos (espelha data/vinhos_clean.csv, gerado pelo pipeline F0)
-- + quarentena para o fluxo on-demand "vinho nao encontrado".

-- Enum do tipo de vinho (valores normalizados pelo pipeline F0).
create type tipo_vinho as enum (
  'tinto', 'branco', 'rose', 'espumante', 'fortificado', 'sobremesa', 'laranja'
);

-- Catalogo principal de vinhos: 1 linha = 1 vinho individual do seed v10.5 limpo.
create table vinhos (
  id                                text primary key,           -- mistura uuid + 'v10-ml-*'; por isso text, nao uuid
  nome                              text not null,
  produtor                          text,
  safra                             integer,
  safra_inferida                    boolean,                    -- flag: safra foi inferida (nao e um ano)
  is_nv                             boolean,                    -- sem safra por natureza (espumantes etc.)
  tipo                              tipo_vinho,                 -- null = requer_revisao_tipo
  subtipo_docura                    text,
  uva_principal                     text,
  uvas_secundarias                  text,
  pais                              text,
  regiao                            text,
  preco_referencia                  numeric(10,2),
  faixa_preco_tier                  text,
  preco_observado_fontes            text,
  tamanho_garrafa_ml                integer,
  teor_alcoolico                    numeric(4,1),
  imagem_rotulo_url_externa         text,                       -- hotlink externo (fragil)
  thumbnail_url                     text,                       -- imagem hospedada propria (preencher pos-download)
  url_origem                        text,
  vivino_rating                     numeric(3,1),
  vivino_num_ratings                integer,
  -- Perfil sensorial 5D (0-5)
  acidez                            smallint,
  tanino                            smallint,
  corpo                             smallint,
  frutado                           smallint,
  docura                            smallint,
  confianca_sensorial               numeric(5,1),               -- escala unica 0-100 (pipeline F0)
  confianca_tipo                    text,
  confianca_uva                     text,                       -- alto | medio | baixo | nao_resgatado
  confianca_recuperacao             text,                       -- alto | baixo | sem_recuperacao
  fonte_sensorial                   text,
  fonte_dado_principal              text,
  origem_cadastro                   text,
  categoria_produto                 text,
  is_vinho                          boolean,
  is_active                         boolean,
  motivo_inativo                    text,
  requer_revisao_editorial          boolean,
  requer_enriquecimento             boolean,
  preco_invalido_origem             boolean,
  preco_recuperado_pendente_review  numeric(10,2),              -- preco resgatado (Vivino) aguardando decisao humana
  dedup_revisao_flag                boolean,
  dedup_motivos                     text,
  harmonizacao_categorias           text,
  harmonizacao_texto                text,
  curiosidade_educacional           text,
  codigo_barras                     text,                       -- 0% preenchido no seed; reservado p/ scanner futuro
  status_moderacao                  text,                       -- aprovado_auto | aprovado | pendente
  data_ultima_observacao            timestamptz,
  created_at                        timestamptz,
  updated_at                        timestamptz,
  fonte_curiosidade                 text,
  requer_revisao_factual            boolean,
  superlativo_detectado             text,                       -- trecho superlativo detectado na curiosidade (guardrail editorial)
  erro_factual                      boolean,
  -- Flags novas do pipeline F0
  requer_revisao_tipo               boolean not null default false,  -- tipo NaN, frisante->espumante ou suspeito
  preco_valido                      boolean not null default false,  -- false = sem preco ou fora de (R$15, R$10.000) sem whitelist
  view_estrita                      boolean not null default false   -- elegivel para gerar questoes
);

comment on table vinhos is 'Catalogo de vinhos do seed v10.5 limpo pelo pipeline F0; view_estrita marca os elegiveis para a fabrica de questoes.';

-- Indexes para os filtros mais comuns da fabrica de questoes e do app.
create index idx_vinhos_uva_principal on vinhos (uva_principal);
create index idx_vinhos_pais          on vinhos (pais);
create index idx_vinhos_tipo          on vinhos (tipo);
create index idx_vinhos_view_estrita  on vinhos (view_estrita) where view_estrita;

-- Quarentena: fluxo on-demand "vinho nao encontrado" (DECISOES-PRODUTO-V2 secao 9).
-- Busca via Firecrawl/Apify gera ficha provisoria -> entra aqui com as mesmas
-- flags da v10.5 -> so vira questao depois da auditoria.
create table vinhos_quarentena (
  id                  uuid primary key default gen_random_uuid(),
  nome                text not null,
  produtor            text,
  safra               integer,
  tipo_texto          text,                       -- ainda nao normalizado para o enum
  uva_principal       text,
  pais                text,
  regiao              text,
  preco_referencia    numeric(10,2),
  imagem_url_externa  text,
  url_origem          text,
  dados_brutos        jsonb,                      -- payload completo da busca (Firecrawl/Apify)
  fonte_busca         text,                       -- firecrawl | apify | manual
  solicitado_por      uuid,                       -- auth.users.id de quem buscou o vinho
  status              text not null default 'pendente_auditoria',  -- pendente_auditoria | aprovado | rejeitado
  motivo_rejeicao     text,
  created_at          timestamptz not null default now(),
  revisado_em         timestamptz
);

comment on table vinhos_quarentena is 'Vinhos buscados on-demand pelo usuario; ficam em quarentena ate auditoria e promocao para a tabela vinhos.';

create index idx_quarentena_status on vinhos_quarentena (status);

-- RLS basico (ativar quando o projeto Supabase existir):
-- alter table vinhos enable row level security;
-- create policy "vinhos_leitura_publica" on vinhos for select using (true);  -- catalogo e leitura publica; escrita so via service_role
-- alter table vinhos_quarentena enable row level security;
-- create policy "quarentena_insert_proprio" on vinhos_quarentena for insert with check (auth.uid() = solicitado_por);
-- create policy "quarentena_select_proprio" on vinhos_quarentena for select using (auth.uid() = solicitado_por);
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
-- 0003_rls.sql — Row Level Security do Treine seu Paladar
-- Postura:
--   * Dados do jogador: o dono le e escreve apenas as proprias linhas.
--   * Conteudo (licoes, exercicios aprovados, desafio do dia, catalogo de vinhos): leitura ampla.
--   * Economia critica (ledger de cristais) e escrita de conteudo: SEM policy de escrita,
--     logo so o service_role (Edge Functions) consegue gravar. service_role ignora RLS.
--   * A Mesa: leitura/escrita restritas aos membros da mesa.
-- Fase 1 do teste: o client escreve a propria wallet (cristais inclusos) sob policy de dono.
-- O ledger e o resgate de recompensa real ja ficam fechados ao service_role; mover a
-- economia inteira para Edge Functions e a fase 2 (ver docs/F3-ARQUITETURA.md).

-- ------------------------------------------------ catalogo de vinhos (tabelas da 0001)

alter table vinhos enable row level security;
create policy "vinhos_leitura_publica" on vinhos
  for select using (true);

alter table vinhos_quarentena enable row level security;
create policy "quarentena_insert_proprio" on vinhos_quarentena
  for insert with check (auth.uid() = solicitado_por);
create policy "quarentena_select_proprio" on vinhos_quarentena
  for select using (auth.uid() = solicitado_por);

-- ------------------------------------------------ dados do jogador (dono le/escreve)

alter table profiles enable row level security;
create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table progresso_licao enable row level security;
create policy "progresso_owner" on progresso_licao
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table score_paladar enable row level security;
create policy "score_owner" on score_paladar
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table wallet enable row level security;
create policy "wallet_owner" on wallet
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table eventos_progresso enable row level security;
create policy "eventos_owner" on eventos_progresso
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table desafio_premio enable row level security;
create policy "desafio_premio_owner" on desafio_premio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ledger: o dono LE seu extrato; ninguem insere/edita pelo client (so service_role).
alter table transacoes_cristais enable row level security;
create policy "transacoes_owner_select" on transacoes_cristais
  for select using (auth.uid() = user_id);

-- ------------------------------------------------ conteudo (leitura para autenticados)

alter table licoes enable row level security;
create policy "licoes_leitura" on licoes
  for select using (auth.role() = 'authenticated');

alter table exercicios enable row level security;
create policy "exercicios_leitura_aprovados" on exercicios
  for select using (status_auditoria = 'aprovado');

alter table desafio_dia enable row level security;
create policy "desafio_leitura" on desafio_dia
  for select using (auth.role() = 'authenticated');

-- ------------------------------------------------ A Mesa (restrita aos membros)

alter table mesas enable row level security;
create policy "mesas_membro_select" on mesas
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesas.id and m.user_id = auth.uid())
  );

alter table mesa_membros enable row level security;
create policy "mesa_membros_select" on mesa_membros
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesa_membros.mesa_id and m.user_id = auth.uid())
  );

alter table mesa_posts enable row level security;
create policy "mesa_posts_select_membro" on mesa_posts
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid())
  );
create policy "mesa_posts_insert_membro" on mesa_posts
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid())
  );

alter table mesa_tchins enable row level security;
create policy "tchins_select_membro" on mesa_tchins
  for select using (
    exists (
      select 1 from mesa_posts p
      join mesa_membros m on m.mesa_id = p.mesa_id
      where p.id = mesa_tchins.post_id and m.user_id = auth.uid()
    )
  );
create policy "tchins_insert_proprio" on mesa_tchins
  for insert with check (auth.uid() = user_id);
-- 0004_app_init.sql — Bootstrap de novo jogador
-- Quando um usuario nasce em auth.users (inclusive ANONIMO, no soft wall da FTUE),
-- cria perfil + carteira (com as boas-vindas) + as 7 linhas de Score de Paladar zeradas.
-- Substitui o estadoInicial() do engine: a nuvem ja nasce com o estado-base.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict do nothing;

  insert into public.wallet (user_id)
  values (new.id)
  on conflict do nothing;

  insert into public.score_paladar (user_id, dimensao)
  select new.id, d
  from unnest(array['acidez','tanino','corpo','frutado','docura','rotulo','harmonizacao']) as d
  on conflict do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user is 'Bootstrap do estado-base na nuvem ao criar usuario (anonimo ou nao): profiles, wallet (boas-vindas) e score_paladar zerado.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- 0005_fix_mesa_rls.sql — Corrige recursao infinita (42P17) nas policies da Mesa.
-- Sintoma: querys em mesas/mesa_membros/mesa_posts/mesa_tchins retornavam
-- "infinite recursion detected in policy for relation mesa_membros".
-- Causa: as policies consultavam mesa_membros por dentro da policy de mesa_membros.
-- Solucao: funcoes SECURITY DEFINER que checam a participacao SEM reentrar no RLS.

create or replace function public.is_mesa_member(p_mesa_id uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mesa_membros m
    where m.mesa_id = p_mesa_id and m.user_id = p_user
  );
$$;
comment on function public.is_mesa_member is 'True se p_user e membro de p_mesa_id. SECURITY DEFINER para nao recair no RLS de mesa_membros (evita recursao).';

create or replace function public.can_tchin_post(p_post_id uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from mesa_posts p
    join mesa_membros m on m.mesa_id = p.mesa_id
    where p.id = p_post_id and m.user_id = p_user
  );
$$;
comment on function public.can_tchin_post is 'True se p_user pode ver/reagir ao post (e membro da mesa do post). SECURITY DEFINER.';

-- Recria as policies da Mesa usando as funcoes (sem subconsulta direta a mesa_membros).
drop policy if exists "mesas_membro_select" on mesas;
create policy "mesas_membro_select" on mesas
  for select using (public.is_mesa_member(id, auth.uid()));

drop policy if exists "mesa_membros_select" on mesa_membros;
create policy "mesa_membros_select" on mesa_membros
  for select using (public.is_mesa_member(mesa_id, auth.uid()));

drop policy if exists "mesa_posts_select_membro" on mesa_posts;
create policy "mesa_posts_select_membro" on mesa_posts
  for select using (public.is_mesa_member(mesa_id, auth.uid()));

drop policy if exists "mesa_posts_insert_membro" on mesa_posts;
create policy "mesa_posts_insert_membro" on mesa_posts
  for insert with check (
    auth.uid() = user_id and public.is_mesa_member(mesa_id, auth.uid())
  );

drop policy if exists "tchins_select_membro" on mesa_tchins;
create policy "tchins_select_membro" on mesa_tchins
  for select using (public.can_tchin_post(post_id, auth.uid()));
