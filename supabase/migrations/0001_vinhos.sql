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
