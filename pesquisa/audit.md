# Auditoria — tchintchin_vinhos_seed_v10_5.xlsx

**Arquivo auditado:** `C:\Users\camargo\OneDrive\Área de Trabalho\Tchin Tchin\ai.vinhos\tchintchin_vinhos_seed_v10_5.xlsx`
**Baseline de comparação:** `C:\Users\camargo\Downloads\tchintchin_vinhos_seed (1) (2).xlsx` (aba `vinhos`, 1.227 linhas × 33 colunas)
**Data da auditoria:** 2026-06-11 | Método: pandas + openpyxl + teste HTTP de imagens (requests)
**Relatório salvo em:** `C:\Users\camargo\Downloads\treino-paladar-app\auditoria-seed-v10_5.md`

---

## A) Abas e schema

### Abas (8 na nova vs 2 na anterior)

| Aba | Linhas | Colunas | Função aparente |
|---|---|---|---|
| `vinhos` | **14.603** | 56 | catálogo principal |
| `nao_vinhos_capturados` | 81 | 56 | produtos não-vinho segregados |
| `quarentena` | 22 | 52 | itens suspeitos |
| `kits_e_packs` | 142 | 52 | kits/caixas separados do catálogo |
| `dedup_revisao` | 466 | 54 | candidatos a duplicata p/ revisão humana |
| `auditoria_dedup` | 50 | 11 | amostra de clusters de dedup |
| `auditoria_fix_n` | 30 | 10 | amostra de correções de safra |
| `vivino_resgate` | 80 | 11 | preços recuperados pendentes de decisão humana |

A versão anterior tinha apenas `vinhos` + `README`. A nova estrutura mostra um pipeline com etapas de segregação, quarentena e dedup — maturidade de processo muito maior.

### Schema da aba `vinhos`: 33 → 56 colunas

**26 colunas novas:** `imagem_rotulo_url_externa`, `url_origem`, `vivino_rating`, `vivino_num_ratings`, `harmonizacao_texto`, `curiosidade_educacional`, `fonte_curiosidade`, `safra_inferida`, `confianca_tipo`, `confianca_uva`, `confianca_recuperacao`, `fonte_dado_principal`, `categoria_produto`, `is_vinho`, `motivo_inativo`, `requer_revisao_editorial`, `requer_enriquecimento`, `requer_revisao_factual`, `preco_invalido_origem`, `preco_observado_fontes`, `preco_recuperado_pendente_review`, `dedup_revisao_flag`, `dedup_motivos`, `data_ultima_observacao`, `superlativo_detectado`, `erro_factual`.

**3 colunas removidas:** `imagem_rotulo_url` (substituída por `imagem_rotulo_url_externa`), `fornecedores_ativos`, `parcerias_afiliado_json`.

**30 colunas mantidas** (nome, produtor, safra, tipo, uva, país, região, preço, 5D sensorial, etc.).

---

## B) Volume

- **14.603 linhas** na aba `vinhos` — **11,9× a versão anterior** (1.227).
- `is_active`: 14.309 ativos / 294 inativos.
- `is_vinho`: 100% True (mas ver ressalva na seção C — 43 não-vinhos escaparam).
- `status_moderacao`: 6.932 `auto_aprovado` + 5.745 `aprovado_automatico` (**dois rótulos para o mesmo conceito — normalizar**) + 1.926 `pendente` (13,2%).
- Fontes principais (`fonte_dado_principal`): Mercado Livre 6.932 (47,5%), World Wine 1.937, seed_v1 1.186, Mistral 617, Vivino 608, Casa Flora 579, v6_stream_1 571, Decanter 504, Wine 462, e outras.

---

## C) Qualidade

### Preenchimento das colunas-chave (% não-nulo/não-vazio)

| Coluna | v10_5 | Anterior | Tendência |
|---|---|---|---|
| nome | 100% | 100% | = |
| produtor | 99,5% | 100% | ≈ |
| uva_principal | 99,2% | 100% | ≈ |
| pais | 99,8% | 100% | ≈ |
| tipo | 97,3% | 100% | ↓ leve (388 NaN) |
| regiao | **46,4%** | 100% | ↓↓ |
| safra | 55,4% (+48,7% `safra_inferida`) | 90,5% | ↓ |
| preco_referencia | 97,6% | 100% | ≈ |
| faixa_preco_tier | 50,2% | 100% | ↓ |
| teor_alcoolico | **40,7%** | 100% | ↓↓ |
| sensorial 5D (acidez/tanino/corpo/frutado/docura) | **98,4%** | 100% | ≈ |
| harmonizacao_texto | 44,6% | — (não existia) | ↑ novo |
| harmonizacao_categorias | 8,1% | 100% | ↓↓ |
| curiosidade_educacional | **91,6%** | — (não existia) | ↑↑ novo |
| imagem_rotulo_url_externa | **39,0%** (5.692 URLs) | 0% | ↑↑ |
| thumbnail_url | **0%** | 0% | = (continua vazio) |
| codigo_barras | **0%** | 0% | = (continua vazio) |
| url_origem | 82,8% | — | novo |
| vivino_rating | 4,4% (636) | — | novo |

**Leitura importante:** a versão anterior era pequena e 100% preenchida; a v10_5 trocou completude por volume. Em valores absolutos tudo cresceu (ex.: região preenchida em ~6.770 vinhos vs 1.227 antes), mas o catálogo agora tem "caudas" vazias — principalmente nos 6.932 itens vindos do Mercado Livre.

### Duplicatas

- **1.534 linhas excedentes** por chave `nome+produtor+safra` (2.705 linhas envolvidas em 1.171 grupos). Considerando só `is_active=True`: **1.342 excedentes**. Por `nome+produtor` (ignorando safra): 1.745.
- A taxa relativa (~10,5% do banco) é **pior** que a anterior (37/1.227 = 3%). Existem as abas `dedup_revisao` (466) e `auditoria_dedup`, mas o dedup **não foi aplicado até o fim** na aba principal — `dedup_revisao_flag` está 100% vazia em `vinhos`.
- IDs: 0 duplicados (chaves primárias íntegras; mistura UUID + `v10-ml-*`).

### Encoding

- **0 células com mojibake** detectado (padrões `Ã©`, `â€™` etc.). Acentuação pt-BR correta. ✔

### Consistências problemáticas encontradas

1. **43 não-vinhos dentro da aba `vinhos`** com `is_vinho=True` e `categoria_produto='vinho'`: gins, cachaças, licores (Bottega/Apogee), brandy, sucos de uva e até "SACOLA KRAFT REVENDA 01 GARRAFA" (R$9,99). A aba `nao_vinhos_capturados` pegou 81, mas o filtro vazou.
2. **`tipo` não normalizado:** `rose` (655) vs `rosé` (3) vs `rosado` (1); `laranjas` (4) vs `laranja` (4); `fortificado_ou_doce` (218) vs `fortificado` (155) vs `licoroso` (1).
3. **`pais` não normalizado:** `Australia` (100) vs `Austrália` (87); `Estados Unidos` (99) vs `EUA` (52); 1.225 como "Outros".
4. **`confianca_sensorial` com escala mista:** categórica (`alto/medio/baixo`) e numérica (70, 75, 65, 72…) na mesma coluna.
5. **Preços lixo:** 122 fora de (0, 5000] — alguns legítimos (Petrus R$94.895, DRC R$29.900, Lafite Vertical Edition R$265.050), mas há erros claros: espumante Miolo a R$0,00, "Carta Prime Free" a R$0,01, sucos a R$9,90 e um Monastrell comum a R$99.999 (placeholder). 16 itens ≤ R$10.
6. **`teor_alcoolico`:** 50 valores fora de 4–25% — quase todos os destilados infiltrados (gin 40%, cachaça 39%).
7. **`fonte_sensorial`:** 232 nulos (mesmas linhas sem 5D).

---

## D) Imagens

- `imagem_rotulo_url_externa`: **5.692 URLs (39%)**. Domínios: worldwine.vtexassets.com (1.947), mistral.com.br (614), casaflora.vtexassets.com (587), decantervinhos.vtexassets.com (506), wine.com.br (463), http2.mlstatic.com (430) e outros.
- **Teste HTTP em 5 URLs de domínios distintos: 5/5 retornaram `200` com `Content-Type: image/*`** (png, jpeg, webp; 7 KB–125 KB). As URLs estão vivas e servem imagem de verdade. ✔
- **Ressalva crítica:** são URLs **externas de e-commerce** (hotlink) — podem quebrar a qualquer momento (CDNs VTEX com parâmetro `v=` versionado) e há risco de bloqueio de hotlinking. Para produção é preciso **baixar e hospedar** (daí `thumbnail_url` em 0%).
- **Buraco principal:** os 6.932 itens do Mercado Livre (47,5% do banco) têm **0 imagens** — exatamente a metade popular/barata do catálogo, a mais relevante para o público iniciante do app.

---

## E) Coerência sensorial e distribuições

### Sensorial 5D (escala 0–5)

- Médias: acidez 3,22 / tanino 2,07 / corpo 3,14 / frutado 3,68 / doçura 1,47 — plausíveis.
- **Brancos/espumantes com tanino ≥ 3: apenas 3 de 4.137 (0,07%)** ✔ — e 2 dos 3 são tintos Monte Paschoal classificados erroneamente como `espumante` (erro de tipo, não de tanino).
- Rosés com tanino ≥ 4: 0 de 660 ✔. Tintos com doçura ≥ 4: 181 — plausível (muitos "tinto suave" brasileiros), mas vale amostragem.
- `fonte_sensorial`: **template caiu de 100% para 7,8%** (1.132 linhas); 90,6% agora vem de enriquecimento LLM (`v10_enrichment_2026_05`: 6.932 + `v7_enrichment_llm_2026_05`: 6.307). Melhora enorme de método, mas perfis LLM ≠ validados por humano — `confianca_sensorial` é "medio" em 68,7% dos casos.

### Distribuições

- **Top uvas:** Cabernet Sauvignon 1.603, Chardonnay 1.510, Malbec 1.265, Blend Tinto 1.200, Merlot 1.028, Pinot Noir 687, Sauvignon Blanc 448, Tempranillo 396, Syrah 291, Tannat 290, Touriga Nacional 279.
- **Top países:** Brasil 3.433, Chile 2.195, Argentina 2.163, França 1.666, "Outros" 1.225, Portugal 1.133, Itália 1.120, Espanha 894 — ótima distribuição para o público brasileiro iniciante (35–54).
- **Tipos:** tinto 8.898 (61%), branco 2.986 (20%), espumante 1.151 (8%), rosé ~660 (4,5%), fortificado/doce ~483, NaN 388.
- **Regiões (quando preenchidas):** Bordeaux 479, Mendoza 457, Bourgogne 319, Piemonte 235, Toscana 233, Douro 198, Serra Gaúcha 143, Rioja 128.
- **Preços:** mediana R$108 (p25 R$50, p75 R$250). Faixas: ≤30: 1.314 | 30–50: 2.383 | 50–80: 2.209 | 80–120: 1.785 | 120–200: 2.484 | 200–500: 2.149 | >500: 1.932. Boa cobertura da faixa de entrada (R$30–120 = 44%).
- **Safra:** 1957–2026, nenhuma fora de faixa ✔; `is_nv` marca 4.245 sem safra por natureza.

### Textos

- **`curiosidade_educacional`: 13.372 textos (91,6%), mediana 358 caracteres, 10.944 distintos** — textos genuínos por vinho, tom educativo correto. Apenas 1 lixo encontrado ("aw2qa"). Guardrails embutidos: `superlativo_detectado` (38), `erro_factual` (1), `requer_revisao_factual` (38).
- **`harmonizacao_texto`: 6.515 (44,6%), mas só 54 textos distintos** — templates por perfil de vinho (ex.: "Carnes vermelhas, queijos curados…" × 1.043). Funciona para gerar questões, mas não é harmonização específica por rótulo.

---

## F) DIFF vs versão anterior

### O que melhorou (muito)

1. **Volume: 1.227 → 14.603 (11,9×)**, com pipeline visível (quarentena, dedup, kits segregados, resgate de preço).
2. **Imagens: 0% → 39% (5.692 URLs válidas e testadas)** — antes o problema nº 1 do banco.
3. **Descrições textuais: de inexistentes → curiosidade educacional em 91,6%** com textos únicos por vinho + harmonização textual em 44,6%.
4. **Sensorial deixou de ser 100% template:** agora 90,6% via LLM com fontes rastreadas e colunas de confiança.
5. **Rastreabilidade:** `url_origem` (82,8%), `fonte_dado_principal`, `data_ultima_observacao`, flags de revisão editorial/factual.
6. **Coerência sensorial excelente** (0,07% de violação de tanino em brancos/espumantes).
7. **Encoding limpo** (0 mojibake).

### O que continua faltando / piorou

1. **`codigo_barras`: continua 0%** — scanner por código de barras segue inviável.
2. **`thumbnail_url`: continua 0%** — sem imagens hospedadas próprias; as 5.692 são hotlinks externos frágeis.
3. **Duplicatas pioraram:** 37 → ~1.534 excedentes (10,5%). O dedup foi desenhado (abas auxiliares) mas não aplicado até o fim.
4. **Completude caiu em colunas que eram 100%:** região 46%, teor 41%, faixa_preco_tier 50%, harmonizacao_categorias 8%, safra 55% — efeito da ingestão em massa do Mercado Livre.
5. **Preços ainda sem validação completa:** 122 outliers/lixo (R$0,00, R$0,01, R$99.999), embora agora existam flags (`preco_invalido_origem`: 80) e a aba `vivino_resgate` com 80 casos aguardando decisão humana.
6. **Vazamento de não-vinhos:** 43 destilados/sucos/acessórios dentro de `vinhos` com `is_vinho=True`.
7. **Normalização pendente:** tipo (rose/rosé/rosado), país (Australia/Austrália, EUA/Estados Unidos), status_moderacao, confianca_sensorial (escala mista).

---

## G) Veredito

### Para o motor de geração de questões — **APTO, com filtro de elegibilidade**

| Tipo de questão | Viabilidade | Base |
|---|---|---|
| "Qual uva?" | **Alta** | uva_principal 99,2% (14,5k vinhos) |
| "De onde vem?" (país) | **Alta** | pais 99,8% |
| "De onde vem?" (região) | **Média** | regiao 46% (~6,8k vinhos — ainda 5,5× o banco anterior inteiro) |
| "Harmoniza com?" | **Alta** | harmonizacao_texto 44,6% (6,5k) — templates coerentes por perfil servem para quiz |
| "Mais encorpado?" (comparação 5D) | **Alta** | 5D em 98,4%, coerência validada |
| Conteúdo educativo (cards) | **Alta** | curiosidade única em 91,6% |

**Recomendação obrigatória:** gerar questões só de uma *view* filtrada — `is_active=True` ∧ vinho real (excluir os 43 vazados) ∧ deduplicada por nome+produtor+safra (~13k restantes) ∧ opcionalmente `status_moderacao != 'pendente'` (~11,4k). Mesmo a view mais conservadora tem ~10× o banco anterior. Para questões com imagem, restringir aos 5.692 com URL (idealmente após re-hospedar).

### Para o scanner futuro — **NÃO APTO ainda**

- **Por código de barras: inviável** (0% de `codigo_barras`, igual à versão anterior).
- **Por foto do rótulo: parcialmente viável** — 5.692 imagens externas válidas dão base para um índice visual, mas (a) cobrem só 39% do catálogo, (b) excluem justamente a metade Mercado Livre/popular, (c) são hotlinks que precisam ser baixados e hospedados antes de indexar.
- Caminho: (1) baixar as 5.692 imagens agora, enquanto as URLs estão vivas; (2) preencher `codigo_barras` via API externa (Open Food Facts / GS1 / Cosmos) começando pelos top vendidos; (3) priorizar captura de imagem dos itens ML.

### Prioridades de correção (ordem sugerida)

1. Aplicar o dedup na aba principal (1.534 linhas excedentes).
2. Remover/reclassificar os 43 não-vinhos vazados.
3. Baixar e hospedar as 5.692 imagens (urgente — URLs perecíveis) e popular `thumbnail_url`.
4. Normalizar `tipo`, `pais`, `status_moderacao`, `confianca_sensorial`.
5. Zerar os 122 preços inválidos (flags já existem; `vivino_resgate` aguarda decisão).
6. Corrigir os 2 Monte Paschoal tintos marcados como espumante.
