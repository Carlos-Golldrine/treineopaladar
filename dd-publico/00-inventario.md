# DD Público — Inventário e Qualificação dos Estudos de Público (Tchin Tchin / Treine seu Paladar)

> Auditoria de dados de pesquisa · 12/06/2026 · Todos os arquivos foram abertos e inspecionados de verdade (PDF via extração de texto pypdf; xlsx/csv via pandas, com diff celular entre versões).
> Convenção central da DD: **PRIMÁRIO** = microdado real (respostas reais, scraping real, analytics). **SÍNTESE** = artefato gerado por IA/consultoria sem microdado rastreável por trás. Os dois NÃO têm o mesmo peso probatório.

---

## Sumário executivo

| # | Arquivo | Tipo | n real | Tchin? | Classe |
|---|---------|------|--------|--------|--------|
| 1 | "# Tchin Tchin — Relatório Completo..." (PDF) | Relatório consolidado | agregados (sem microdado) | SIM | SÍNTESE com referências a primário |
| 2 | TCHIN_TCHIN_Customer_Personas_2026.xlsx (×4) | Personas P1–P4 | 0 (sem microdado) | SIM | SÍNTESE pura |
| 3a | Extração - Vinhos(Reddit).csv | Scraping comentários | 536 únicos / 66 posts | SIM (insumo) | PRIMÁRIO (baixa relevância pt-BR) |
| 3b | Extração - Vinhos(Comentarios).csv | Scraping YouTube BR | 264 únicos / 213 autores | SIM (insumo) | PRIMÁRIO |
| 3c | Extração - Vinhos(Canais).csv | Registro de canais | 5 | SIM (insumo) | PRIMÁRIO (metadado) |
| 3d | Extração - Vinhos(Urls Extraidas).csv | Catálogo de vídeos | 250 vídeos | SIM (insumo) | PRIMÁRIO (metadado) |
| 4a | s3_instagram_personas.csv | Scraping perfis IG | 73 perfis | SIM | PRIMÁRIO |
| 4b | s5_personas_visual.csv | s3 + visão IA | 73 perfis | SIM | HÍBRIDO (primário + atributos inferidos por IA) |
| 5a | Pré-cadastro - v2 (respostas).xlsx + (1)(2) | Survey Google Forms | 112 + 65 | **NÃO** | descartado |
| 5b | Pré-cadastro ... Análises campanhas.pdf | Relatório Meta Ads | — | **NÃO** | descartado |
| 5c | pesquisa de product fit.pdf | Relatório analytics | — | **NÃO** | descartado |

**Veredicto de DD**: o Tchin tem hoje exatamente **três bases primárias de público** utilizáveis: comentários YouTube BR (n=264), comentários Reddit (n=536, mas em inglês), e perfis de audiência no Instagram (n=73). Todos os documentos de personas (P1–P4 do xlsx, HP1–HP6 do PDF) são síntese sem microdado anexado. Nenhuma base suporta regressão com variável-resposta de negócio. O dado quantitativo mais forte citado (analytics Firebase/GA, n≈250 usuários orgânicos) existe apenas como agregado dentro do PDF — o microdado não está em nenhum dos arquivos auditados.

**Red flag de consistência**: existem **três taxonomias de persona concorrentes** nos materiais — S1–S5 (classificação Opus no PDF, Parte A), HP1–HP6 (hyper-personas do PDF, Parte C) e P1–P4 (xlsx). Não há mapeamento documentado entre elas. Qualquer afirmação do tipo "a persona X é 35% do mercado" deve ser tratada como hipótese, não como medição.

---

## 1. "C:\Users\camargo\Downloads\# Tchin Tchin — Relatório Completo de Inteligência, Pesquisa de Mercado e Diagnóstico de Produto.pdf"

- **O que é**: relatório consolidado de 22 páginas, datado de **15/04/2026**, que reúne 8 partes: pipeline de inteligência de conteúdo (Stages 1–6 via Apify/Firecrawl/Claude Opus), pesquisa de mercado digital, hyper-personas + JTBD, análise competitiva (7 players), análise de PR, blueprint de feeds, plano de tração de confrarias e diagnóstico Firebase/GA do app.
- **n**: não contém microdado. Reporta agregados de fontes distintas:
  - Analytics do app (Firebase + GA4): 315 usuários ativos brutos / **~250 orgânicos** (após excluir ~65 do time interno), 283 novos, funil completo (98% logam → 0,5% criam evento), retenção por cohort semanal, DAU/MAU 5,3%, geografia (BSB 53%), 82% Android.
  - Scraping próprio: 37 criadores aprovados, 1.216 posts deep-scraped, 170 posts BR por hashtag, 130 itens classificados via Opus.
  - Fonte secundária: pesquisa Consevitis **n=1.709** (perfil do consumidor BR — não é dado do Tchin).
- **Variáveis**: apenas tabelas-resumo (markdown impresso em PDF). Sem colunas tipadas.
- **Período**: dados de produto cobrem do lançamento (06/03/2026) até ~14/04/2026 (dia 89); pipeline de conteúdo executada em abril/2026.
- **Método aparente**: síntese de IA (sessão de trabalho com Claude) consolidando scraping real + analytics real + desk research. O próprio documento se descreve como "reúne TUDO que foi produzido nesta sessão".
- **Pertence ao Tchin**: SIM, inequívoco (cita Mira Artis, R$2,1M de investimento, lançamento 06/03/2026 em Brasília).
- **Qualidade**:
  - Ponto forte: é o único documento que declara e ajusta a **contaminação por time interno** (~65 de 315 usuários), apresentando métricas brutas E ajustadas.
  - Ponto fraco: nenhum número é verificável a partir do arquivo — o microdado referenciado (s3_posts_flat.csv, s5_classified_flat.csv, creators_ranked.json, GA4) está fora dele. Mistura no mesmo texto dado medido (funil Firebase), dado de terceiros (Consevitis) e dado inventado (percentuais das HP1–HP6, ex.: "HP4 35-40%", sem base amostral).
  - As hyper-personas HP1–HP6 (Parte C) são SÍNTESE: percentuais de segmento sem n, demografia ficcional.
- **Análises que suporta**: leitura direcional de produto (funil, retenção, geografia) e priorização. NÃO suporta estratificação, correlação ou regressão — não há microdado. Para a DD, vale como **mapa de onde está o dado primário** (pipeline outputs + GA4) e como registro dos agregados de abril/2026.

---

## 2. TCHIN_TCHIN_Customer_Personas_2026.xlsx — 4 versões

Arquivos:
- "C:\Users\camargo\Downloads\TCHIN_TCHIN_Customer_Personas_2026.xlsx" (26/02/2026, 35 KB, md5 f17e817b...)
- "C:\Users\camargo\Downloads\TCHIN_TCHIN_Customer_Personas_2026 (1).xlsx" (04/03/2026, 52 KB, md5 6997d1c6...)
- "C:\Users\camargo\Downloads\TCHIN_TCHIN_Customer_Personas_2026 (2).xlsx" (04/03/2026) — **byte-idêntico a (1)**
- "C:\Users\camargo\Downloads\TCHIN_TCHIN_Customer_Personas_2026 (3).xlsx" (01/04/2026) — **byte-idêntico a (1)**

### Diff real (célula a célula, 6 abas × 4 arquivos)
- (1) ≡ (2) ≡ (3): mesmo md5 — são re-downloads do mesmo arquivo.
- base vs (1): **2 células diferentes em ~600**, ambas apenas a remoção do emoji inicial nos títulos das abas "Visão Geral" e "Matriz de Priorização". Todo o conteúdo de dados é 100% idêntico. A diferença de tamanho (35→52 KB) é formatação/empacotamento, não conteúdo.

### Eleição da canônica
**"C:\Users\camargo\Downloads\TCHIN_TCHIN_Customer_Personas_2026.xlsx" (base, 26/02/2026)** — é o artefato original, com conteúdo integral (inclusive emojis dos títulos), e as variantes não acrescentam nada. As cópias (1)(2)(3) podem ser arquivadas/apagadas sem perda.

- **O que é**: documento de personas "Research Estratégico | Fev 2026 | Grupo LAPM". 6 abas: Visão Geral, P1 Organizador da Confraria (~15%), P2 Entusiasta Social (~35%), P3 Curioso Aprendiz (~30%), P4 Profissional do Vinho (~10%), Matriz de Priorização (TAM 70.000 users, LTV R$360–3.600/ano, CAC R$10–150).
- **n**: **zero**. Não há respondentes, não há fonte amostral citada.
- **Variáveis**: fichas texto (demografia ficcional — "Ricardo Mendes, 38 anos", renda, MBTI, dores, JTBD, ticket tolerado) + matriz com percentuais e unit economics sem memória de cálculo.
- **Método aparente**: SÍNTESE de IA/consultoria. Evidência adicional: o mesmo template de "Customer Personas" existe na máquina para outros projetos (LIVI_Deep_Customer_Personas.xlsx, MyTravelBox_Personas.xlsx, Prima_CustomerPersonas_Terreno84.xlsx) — é uma fábrica de artefatos, não pesquisa de campo.
- **Pertence ao Tchin**: SIM (conteúdo todo sobre confrarias/vinho/Tchin).
- **Qualidade**: internamente coerente, mas **nenhum número é auditável**. Os ~15/35/30/10% de segmento, o TAM de 70k e os LTV/CAC são estimativas declaradas sem fonte. Conflita com a taxonomia S1–S5 e HP1–HP6 do PDF (#1).
- **Análises que suporta**: nenhuma estatística. Uso legítimo: artefato de alinhamento narrativo e hipóteses a testar. Na DD deve ser rotulado **SÍNTESE — não citar como evidência de mercado**.

---

## 3. Social listening — "Extração - Vinhos" (4 CSVs, 14/10/2025)

Formato comum: **cp1252 + separador ";"** (atenção ao reprocessar), com centenas de linhas vazias de "padding" e duplicatas exatas — exigem limpeza antes de qualquer uso.

### 3a. "C:\Users\camargo\Downloads\Extração - Vinhos(Reddit).csv"
- **O que é**: comentários de posts do Reddit sobre vinho. 3 colunas: TÍTULO PUBLICAÇÃO (texto), SUBREDDIT (texto), COMENTÁRIOS (texto).
- **n**: 745 linhas brutas → **209 duplicatas exatas** → 536 comentários únicos, de apenas **66 posts únicos**, em 2 subreddits: r/wine (510) e r/winemaking (26).
- **Período**: sem timestamps nos dados (arquivo de out/2025).
- **Método**: scraping real (PRIMÁRIO).
- **Pertence ao Tchin**: SIM como insumo de social listening do projeto (mesmo lote dos outros 3 CSVs), mas **o conteúdo é ~100% em inglês** (heurística: 376/536 com palavras inglesas, 1/536 com palavras portuguesas) — é a audiência internacional do r/wine, não o público pt-BR do Tchin.
- **Qualidade**: 28% de duplicação; sem data, autor, score ou link do comentário; inclui mensagens automáticas de moderação. Viés forte: entusiasta anglófono ≠ iniciante brasileiro 35–54.
- **Análises que suporta**: codificação temática qualitativa (dores/jargões do entusiasta global), no máximo contagem por post/subreddit. Sem demografia → sem estratificação; sem métrica → sem correlação/regressão. **Peso baixo para decisões de público pt-BR.**

### 3b. "C:\Users\camargo\Downloads\Extração - Vinhos(Comentarios).csv"
- **O que é**: comentários de vídeos de 5 canais YouTube BR de vinho. Colunas: canalId, videoid, autor, comentárioTexto (todas texto).
- **n**: 890 linhas brutas → 624 vazias (padding) → 266 reais → **264 únicas**, de **213 autores únicos**, em 18 vídeos de 5 canais.
- **Período**: comentários sem timestamp; vídeos-fonte publicados out/2024–out/2025.
- **Método**: scraping real via API/extração YouTube (PRIMÁRIO).
- **Pertence ao Tchin**: SIM — canais BR de vinho (Vinho Brasileiro, VinhosdeBicicleta, Vinhos de Corte, Assunto Vinho, Paixão por vinhos), conteúdo em português.
- **Qualidade**: n pequeno (264) e raso (média 148 caracteres/comentário); só 18 vídeos cobertos dos 250 catalogados em 3d (7%); sem likes/data/replies. Viés de coleta: quem comenta em canal de vinho já é engajado — superestima entusiasmo do público-alvo iniciante.
- **Análises que suporta**: análise temática qualitativa em pt-BR (a melhor fonte de "voz do público" BR deste lote); frequência de temas por canal. Sem variáveis demográficas ou numéricas → sem estratificação/correlação/regressão.

### 3c. "C:\Users\camargo\Downloads\Extração - Vinhos(Canais).csv"
- **O que é**: registro do escopo da coleta. Colunas: ID, Nome do Canal, URL/ID do Canal, Status, Número de Vídeos.
- **n**: 999 linhas brutas → **apenas 5 reais** (994 vazias). 5 canais, 50 vídeos/canal planejados, todos Status OK.
- **Classe**: PRIMÁRIO (metadado de coleta). Serve só para documentar a amostragem do 3b/3d.

### 3d. "C:\Users\camargo\Downloads\Extração - Vinhos(Urls Extraidas).csv"
- **O que é**: catálogo dos vídeos extraídos. Colunas: canal_id, titulo, video_id, duracao.
- **n**: 846 brutas → **250 vídeos únicos** reais (595 vazias + 1 dup), dos mesmos 5 canais.
- **Bug de schema**: a coluna `duracao` NÃO contém duração — contém **timestamp de publicação** (ISO, 09/10/2024 → 12/10/2025, 0 inválidos). Renomear antes de usar.
- **Classe**: PRIMÁRIO (metadado). Suporta análise de cadência/temas de pauta dos canais BR; nada sobre público diretamente.

---

## 4. Pipeline tchin-pipeline-v2 (scraping de 13/05/2026)

Caminho: "C:\Users\camargo\OneDrive\Área de Trabalho\Tchin Tchin\duolingo do vinho\tchin-pipeline-v2\data\output\" (em Python, usar raw string ou glob "C:\Users\camargo\OneDrive\\*rea de Trabalho\..." — o acento resolve).

### 4a. s3_instagram_personas.csv
- **O que é**: perfis reais de **audiência** (não criadores) do Instagram BR de vinho — pessoas descobertas comentando/interagindo em 14 posts de criadores (`discovered_via_creator`).
- **n**: **73 perfis únicos** (0 duplicatas), anonimizados por `profile_hash`.
- **Variáveis (12)**: profile_hash (str), bio_text (str, 12% nulo), bio_keywords (str, **85% nulo**), follower_count / following_count / posts_count (int), follower_following_ratio (float), post_frequency_30d (int — atenção: 0 para quase todos, provável campo não populado), has_profile_pic (bool), profile_pic_local_path (str, 59% nulo — 30 fotos baixadas), discovered_via_creator (URL do post-fonte, 14 únicos), timestamp_scraped (ISO).
- **Período**: coleta em **13/05/2026** (02:22–14:17 UTC).
- **Método**: scraping real (PRIMÁRIO). Followers: mediana 1.300 (min 69, max 8.716) — são pessoas comuns, não influenciadores: amostra correta para estudo de público.
- **Pertence ao Tchin**: SIM (pasta do projeto "duolingo do vinho", pipeline citada no PDF #1).
- **Qualidade**: limpo e bem estruturado; limitações: n=73, bio_keywords quase vazio, post_frequency_30d suspeito, e **viés de seleção forte** — só captura quem interage publicamente com criadores de vinho (engajados; o iniciante silencioso 35–54 está sub-representado).

### 4b. s5_personas_visual.csv
- **O que é**: os mesmos 73 perfis de 4a (conjuntos de profile_hash idênticos — verificado) + **12 colunas `vision_*` geradas por IA de visão** sobre a foto de perfil.
- **Variáveis adicionais**: vision_has_person (bool), vision_gender (F=38, M=15, ambíguo=4, nulo=16), vision_age_range (25-34: 18 · 35-44: 16 · 45-54: 12 · 18-24: 6 · 55+: 5 · nulo=16), vision_setting (indefinido=33, casa=9, bar_restaurante=8...), vision_wine_present (True só em 12/73), vision_alcohol_present, vision_food_present, vision_social_context, vision_aesthetic, vision_profession_hint (52% nulo), vision_confidence (média 0,81; 4 abaixo de 0,6), vision_flag_review (3 flagados).
- **Classe**: **HÍBRIDO** — base primária (scraping) + atributos demográficos **inferidos por modelo**, não declarados. Para a DD: gênero/idade aqui são estimativas de IA sobre uma foto, com 22% de nulos; tratar como proxy com erro de medida, nunca como demografia medida.
- **Qualidade**: confiança média alta e flags explícitas (boa prática); mas n=73 com 16 nulos deixa células de estrato minúsculas (ex.: 45-54 = 12 perfis).
- **Análises que suportam (4a+4b)**:
  - Estratificação descritiva: distribuição por gênero/idade inferidos, setting, presença de vinho — com a ressalva "demografia inferida por IA, n=73".
  - Correlação exploratória: métricas de perfil (followers, ratio, posts_count) × atributos vision — possível, mas sem poder estatístico (n=73; qualquer corte gera células <20).
  - Regressão: **não recomendada** — não existe variável-resposta de comportamento (conversão, retenção, gasto). A única candidata seria vision_wine_present (12 positivos — insuficiente).
  - Uso correto na DD: triangular as personas sintéticas (P1–P4/HP1–HP6) contra esta amostra real. Nota: a distribuição etária inferida (pico 25–44) **tensiona** a tese de público 35–54 — vale investigação, lembrando o viés (quem comenta no IG tende a ser mais jovem que quem só assiste).

---

## 5. POSSÍVEIS — validados e DESCARTADOS (não são do Tchin)

### 5a. "C:\Users\camargo\Downloads\Pré-cadastro - v2 (respostas).xlsx" + variantes (1) e (2)
- **Conteúdo lido**: Google Forms de **pré-cadastro de motoristas de aplicativo**. Form 1 (n=112, 07/11/2024→09/01/2025): "Quais aplicativos utiliza" (respostas: Uber, 99, InDriver), "Região onde reside" (Manaus 19, João Pessoa 12, Porto Velho 11...), fotos de placa dianteira/traseira do veículo, CPF, modelo (Gol, Argo...). Form 2 (n=65, 05/2024→21/01/2025): CNH, comprovante de residência, "Qual sua categoria no aplicativo/taxi?".
- **Veredicto**: **NÃO é Tchin** — é recrutamento de motoristas para um projeto de mobilidade/mídia veicular (campanhas "[PITCH MOTORISTA]"). Zero menção a vinho. As 3 variantes diferem só em abas de análise adicionadas; irrelevante para esta DD. (A variante PDF "Pré-cadastro - v2 (respostas) - Respostas ao formulário 1.pdf" é export do mesmo form — mesmo descarte.)

### 5b. "C:\Users\camargo\Downloads\Pré-cadastro - v2 (respostas) - Análises campanhas de aquisição.pdf"
- **Conteúdo lido**: 1 página de métricas Meta Ads das campanhas "[PITCH MOTORISTA] LEAD" (set/2024–jan/2025): 1.168 leads, R$1.818 gastos, CTR por região.
- **Veredicto**: **NÃO é Tchin** — mesmo projeto de motoristas do 5a. Descartado.

### 5c. "C:\Users\camargo\Downloads\pesquisa de product fit.pdf"
- **Conteúdo lido**: 15 páginas. "O app **Ei Colibri** atualmente conta com exatos 729 cadastros e 1336 downloads... média de uso diário de 30 **corretores**".
- **Veredicto**: **NÃO é Tchin** — é diagnóstico de product fit do app Ei Colibri (corretores imobiliários; coerente com os arquivos "SIM ... pré cadastro trader imobiliário" da mesma pasta). Descartado.

---

## Implicações para a due diligence do Treine seu Paladar

1. **Base de evidência primária sobre o público é pequena e enviesada para engajados**: 264 comentários YT pt-BR + 73 perfis IG (demografia inferida por IA) + agregados de analytics de ~250 usuários (microdado não disponível nos arquivos). Suficiente para hipóteses qualitativas; insuficiente para qualquer afirmação estatística sobre o mercado.
2. **Nenhuma base auditada suporta regressão** com variável-resposta de negócio. O próximo dado que destravaria isso é o export de microdado do GA4/Firebase do app (eventos por usuário) — citado no PDF #1 mas ausente do inventário.
3. **Todos os percentuais de persona em circulação (15/35/30/10%, "HP4 35-40%") são sintéticos.** Antes de usá-los em material de investidor, rebaixar para "hipótese de segmentação".
4. **Higiene de dados pendente**: deduplicar Reddit (-28%), remover padding dos 4 CSVs de social listening, renomear coluna `duracao`→`published_at`, e apagar as cópias redundantes do Customer_Personas ((1),(2),(3)).
5. **Tensão a investigar**: público-alvo declarado 35–54 vs. pico 25–44 na amostra IG real (com viés de quem comenta). O dado de GA do PDF ("25-34 dominante") aponta na mesma direção da amostra IG.
