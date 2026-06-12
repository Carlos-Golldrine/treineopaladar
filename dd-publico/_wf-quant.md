# DD Público — Análise Quantitativa dos Estudos de Público (Tchin Tchin / Treine seu Paladar)

> Análise estatística · 12/06/2026 · Python (pandas 2.2.3, scipy 1.14.1, statsmodels 0.14.4) · Script reproduzível: `_analysis_quant.py` nesta pasta.
> Regra da DD aplicada: **só dado primário entra em estatística**; rótulos gerados por IA sobre dado primário entram como *proxy com erro de medida* (sempre sinalizados); síntese pura (personas P1–P4, HP% do PDF) entra apenas como **hipótese a testar**, nunca como evidência.

---

## 0. Bases que entraram na análise

| Base | n analítico | Classe | Papel na estatística |
|---|---|---|---|
| `s5_comments_classified.csv` (pipeline 13/05/2026) | 834 comentários (676 pt; 817 com upvotes) | HÍBRIDO: texto/upvotes/fonte/data = primário; persona_fit (HP1–HP6), pain_intensity (1–5), sentiment, jtbd, mentions_* = rótulos IA | Estratificação por nível de conhecimento; correlações; modelos de engajamento; teste de segmento |
| `s3_instagram_personas.csv` + `s5_personas_visual.csv` | 73 perfis (57 com idade inferida; 53 com gênero F/M) | HÍBRIDO: métricas de perfil = primário; idade/gênero/cenário = inferência de visão IA (22% nulos) | Estratificação demográfica; correlações; logit exploratório |
| `Extração - Vinhos(Comentarios).csv` (YouTube BR, out/2025) | 264 únicos após limpeza (213 autores) | PRIMÁRIO puro (só texto) | Triangulação lexical |
| `s1_demand_map.csv` (queries Google related/PAA) | 114 queries | HÍBRIDO: queries reais; persona/intent = rótulo IA | Estratificação da demanda de busca |
| `Extração - Vinhos(Reddit).csv` | 536 únicos | PRIMÁRIO, mas ~100% inglês | **Excluído** das inferências sobre público pt-BR (mantido só na sensibilidade do modelo D1) |
| Personas xlsx P1–P4, HP% do PDF, TAM/LTV | 0 | SÍNTESE | Só como hipótese (H: 73% iniciantes; H: core 35–54) |

Nota de auditoria: `s5_comments_classified.csv` (n=834) e `s2_community_comments.csv` não constavam do inventário 00; foram inspecionados agora (0 duplicatas de comment_id, 736 autores únicos, fontes: YouTube 579, TikTok curado 226, App Store 15, Reddit 12, LinkedIn 2). É a base mais rica do acervo e a única com variável de engajamento real (upvotes/likes).

---

## 1. Estratificação das amostras vs. público-alvo declarado (35–54, 73% iniciantes, BSB/GYN)

### 1.1 Idade — perfis Instagram (inferida por IA de visão; n=57 classificados de 73)

| Faixa | n | % [IC 95% Wilson] |
|---|---|---|
| 18–24 | 6 | 10,5% [4,9; 21,1] |
| 25–34 | 18 | **31,6%** [21,0; 44,5] |
| 35–44 | 16 | 28,1% [18,1; 40,8] |
| 45–54 | 12 | 21,1% [12,5; 33,3] |
| 55+ | 5 | 8,8% [3,8; 18,9] |

- **35–54 agregado: 28/57 = 49,1% [36,6; 61,7]**. Teste binomial unilateral H0: P(35–54) ≥ 50% → p=0,500, **não rejeita**. O alvo etário NÃO é refutado pelos dados — mas também não é "dominante": a faixa modal individual é 25–34, e 25–44 soma 59,6% [46,7; 71,4].
- Leitura honesta: a amostra IG é compatível tanto com "metade do público engajado é 35–54" quanto com "o centro de gravidade é 25–44". Com n=57 o IC é largo demais para arbitrar; soma-se o viés de que quem comenta no IG tende a ser mais jovem do que quem só consome. **A tensão apontada no inventário existe, mas é mais fraca do que parecia: 35–54 ainda é ~metade da amostra.**

### 1.2 Gênero — perfis Instagram (inferido por IA; n=53 F/M de 73)

- F: 38, M: 15, ambíguo: 4, nulo: 16.
- **%F = 71,7% [58,4; 82,0]**; binomial vs. 50%: **p=0,002**. Sinal robusto de predominância feminina na audiência engajada de conteúdo de vinho no IG — mesmo descontando erro do classificador de visão, dificilmente o viés inverteria uma razão de 2,5:1.

### 1.3 Nível de conhecimento — comentários pt-BR (persona codificada por IA; n=676, 529 classificados)

| Persona (rótulo IA) | n | % dos classificados [IC 95%] |
|---|---|---|
| HP3 iniciante estratégica | 274 | 51,8% [47,5; 56,0] |
| HP4 sommelier de fim de semana | 173 | 32,7% [28,8; 36,8] |
| HP2 curioso conectado | 46 | 8,7% |
| HP6 Gen Z | 26 | 4,9% |
| HP5 restaurante / HP1 organizadora | 10 | 1,9% |
| (indefinido) | 146 | — |

- "Iniciante amplo" (HP3+HP2+HP6): **65,4% [61,3; 69,3]**.
- **Teste da hipótese sintética "73% iniciantes"**: binomial vs. p0=0,73 → HP3 estrito p=4×10⁻²⁵ (rejeita); iniciante amplo p=1,3×10⁻⁴ (**rejeita**). Incluindo os "indefinidos" no denominador, iniciante amplo cai para 51,3% [47,5; 55,0].
- Conclusão: **a maioria do público que se manifesta é de fato iniciante/curiosa, mas o número "73%" não se sustenta nesta amostra** (melhor estimativa: 51–65%, conforme a definição). Há um bloco entendido/entusiasta de ~33% que não é marginal.

### 1.4 Demanda de busca — 114 queries Google (rótulo IA sobre queries reais)

- iniciante 65,8% [56,7; 73,9] · intermediário 21,1% · todos 11,4% · avançado 1,8%.
- Funil: ToFu 50 / MoFu 42 / BoFu 22. Emoções: pragmatismo 33, curiosidade 30, incerteza 29.
- Converge com 1.3 (~2/3 da demanda é de iniciante), com a ressalva de circularidade: as queries derivam de seeds escolhidas pelo time (ex.: "como aprender sobre vinho"), o que infla mecanicamente a fração iniciante.

### 1.5 Região e renda

- **Nenhuma base primária auditada contém região ou renda no microdado.** O único dado regional (BSB 53%) é agregado de GA citado no PDF — não testável aqui. Toda afirmação sobre renda do público é, hoje, síntese sem dado.

### 1.6 Triangulação lexical — YouTube BR out/2025 (primário puro, n=264)

aprender/aprendizado 3,4% [1,8; 6,4] · dicas 5,3% · preço 5,3% · iniciante 1,9% · harmonização 0,8% · curso 0,8%.
Leitura: nos comentários espontâneos de canais de vinho BR, o vocabulário explícito de aprendizado é minoritário — a maior parte é interação social/elogio. Reforça que "iniciante que quer aprender" é melhor capturado por classificação semântica (1.3) do que por palavras-chave, e que o comportamento dominante do público engajado é **social**, não didático.

---

## 2. Matriz de correlações (Spearman; p ajustado por Benjamini–Hochberg)

### 2.1 Perfis Instagram (n=53–73)

| Par | n | rho | p | p-FDR | |
|---|---|---|---|---|---|
| followers × following | 73 | 0,552 | <0,0001 | <0,001 | * |
| followers × ratio | 73 | 0,523 | <0,0001 | <0,001 | * |
| followers × posts | 73 | 0,518 | <0,0001 | <0,001 | * |
| following × posts | 73 | 0,465 | <0,0001 | <0,001 | * |
| following × ratio | 73 | −0,331 | 0,004 | 0,018 | * |
| followers × gênero F | 53 | −0,312 | 0,023 | 0,080 | n.s. |
| ratio × vinho na foto | 72 | 0,258 | 0,029 | 0,086 | n.s. |
| idade × (qualquer métrica) | 57 | \|rho\|≤0,22 | — | ≥0,19 | n.s. |

Só as correlações estruturais entre métricas de perfil sobrevivem ao FDR. **Nenhuma associação entre demografia inferida e comportamento de perfil é detectável com n=73** — consistente com falta de poder, não necessariamente com ausência de efeito (para rho=0,3, o poder com n=57 é ~62%).

### 2.2 Comentários pt-BR com upvotes (n=673–674)

Pares significativos após FDR envolvendo a única variável 100% primária de resultado (percentil de upvotes dentro da fonte):

| Par | rho | p-FDR |
|---|---|---|
| upvotes-pctile × sentimento "dúvida" (IA) | **−0,126** | 0,002 |
| upvotes-pctile × entendido HP4 | +0,072 | 0,089 (n.s.) |
| upvotes-pctile × iniciante HP3 | −0,029 | n.s. |
| upvotes-pctile × pain_intensity | +0,031 | n.s. |

Pares fortes **entre rótulos IA** (interpretar como consistência do codificador, não como duas medições independentes): pain×dúvida 0,472; pain×iniciante 0,469; learning×iniciante 0,356; iniciante×dúvida 0,344 — todos p-FDR<0,001. E um par primário×IA relevante: log(tamanho do texto)×learning 0,347 (comentários sobre aprendizado são mais longos — coerência externa do rótulo).

---

## 3. Modelos com variável-resposta

Não existe variável-resposta de negócio (conversão, retenção, gasto) em nenhuma base. A melhor resposta disponível é **engajamento social real** (upvotes/likes, primário). Definição: `engaged = upvotes > mediana da própria fonte` (YouTube mediana 0; TikTok 2; Reddit 3,5), neutralizando escala entre plataformas.

### 3.1 Logit principal — engaged ~ rótulos IA + controles (pt-BR, n=673)

Pseudo-R²=0,027 · LLR p=0,0016 · max |corr| entre preditores 0,49

| Preditor | OR | IC 95% | p |
|---|---|---|---|
| pain_intensity (IA, 1–5) | 1,14 | [0,94; 1,38] | 0,187 |
| mentions_learning (IA) | 0,88 | [0,61; 1,27] | 0,484 |
| iniciante HP3 (IA) | 1,33 | [0,85; 2,09] | 0,216 |
| **entendido HP4 (IA)** | **1,71** | **[1,11; 2,63]** | **0,014** |
| log(tamanho texto) | 1,13 | [0,89; 1,42] | 0,316 |
| **idade do comentário (anos)** | **0,87/ano** | **[0,79; 0,95]** | **0,002** |
| fonte TikTok | 0,62 | [0,39; 0,97] | 0,036 |
| fonte Reddit | 1,43 | [0,42; 4,81] | 0,564 |

Sensibilidade com todas as línguas (n=816): entendido OR=1,74 [1,19; 2,54], p=0,004 — **o efeito "entendido engaja mais" é estável**; pain e learning continuam nulos.

Leitura: (i) comentários classificados como de **entendidos recebem ~70% mais chance de engajamento acima da mediana** — o conteúdo de quem "sabe" gera mais validação social na audiência atual dos criadores; (ii) **dor e demanda por aprendizado NÃO convertem em engajamento social** — a dor do iniciante é silenciosa (consistente com rho=−0,126 de dúvida×upvotes: comentário com dúvida recebe *menos* like); (iii) comentários mais recentes engajam mais (vídeos novos concentram tráfego). Diagnóstico: pseudo-R² baixíssimo (2,7%) — o engajamento é quase todo ruído/efeito de exposição não observado; os ORs são sinais direcionais, não estrutura explicativa.

### 3.2 OLS robusto (HC3) — percentil de upvotes ~ mesmos preditores (n=673)

R²=0,022. Nenhum rótulo IA significativo a 5% (entendido β=0,047, p=0,096; idade β=−0,012/ano, p=0,046). Confirma o logit em versão contínua: efeitos pequenos, baixo poder explicativo.

### 3.3 Logit exploratório IG — vinho na foto ~ idade 35+ + log followers + gênero (n=53, 7 eventos)

~2,3 eventos por parâmetro (mínimo usual: 10) → **subpotência severa, reportado apenas por completude**: nenhum OR significativo (todos IC cruzando 1; gênero F OR=0,25, p=0,11). Fisher exato 35+×vinho: p=1,000. **Nada se conclui daqui.**

---

## 4. Teste da hipótese de segmento: priorizar INICIANTES (ensinar) vs. ENTENDIDOS (provocação)?

Comparação HP3 (iniciante estratégica, n=274) vs. HP4 (sommelier de fim de semana, n=173), comentários pt-BR.

| Dimensão | HP3 iniciante | HP4 entendido | Teste | Resultado |
|---|---|---|---|---|
| **Tamanho** (share dos classificados) | 51,8% [47,5; 56,0] | 32,7% [28,8; 36,8] | z=6,29 | p=3×10⁻¹⁰ — iniciantes são ~1,6× mais numerosos |
| **Intensidade de dor** (IA, 1–5) | média 2,33 / mediana 2 | média 1,74 / mediana 1 | Mann-Whitney | p=2×10⁻¹², **delta de Cliff=0,375 (efeito médio)** |
| Dor alta (≥3) | 37,2% [31,7; 43,1] | 18,5% [13,4; 24,9] | — | dobro de dor alta entre iniciantes |
| **Demanda de aprendizado** | 75,9% [70,5; 80,6] | 53,8% [46,3; 61,0] | χ²=22,7 | p=2×10⁻⁶ |
| **Sentimento "dúvida"** | 46,4% [40,5; 52,3] | 13,3% [9,0; 19,2] | χ²=50,5 | p=1×10⁻¹² |
| **Engajamento social real** (percentil upvotes) | mediana 0,29 / média 0,50 | mediana 0,69 / média 0,54 | Mann-Whitney | p=0,129, delta=−0,08 — **sem diferença significativa**; direção favorece HP4 |
| JTBD nº1 (IA) | "Aprender sem parecer ignorante" 42% | "Conteúdo educativo contextualizado" 29% | — | — |

Kruskal-Wallis da dor entre as 6 personas: H=94,6, p=7×10⁻¹⁹ — HP3 é a persona com maior dor média (2,33) de todas; HP2/HP6 (curioso/GenZ) têm dor baixa (~1,4).

**Veredicto estatístico (com os limites do dado):**
1. **Tamanho e intensidade de dor favorecem INICIANTES**: são o maior bloco (52–65%), com dor codificada ~2× maior e demanda de aprendizado explícita em 3/4 dos comentários. O JTBD dominante ("aprender sem parecer ignorante", 42%) é exatamente a tese do produto de treino.
2. **MAS o sinal de dor vem de rótulos IA correlacionados entre si** (persona, dor, dúvida e learning foram codificados na mesma passada sobre o mesmo texto — rho 0,34–0,47 entre eles). O tamanho do efeito real é provavelmente menor que o delta de Cliff de 0,375 sugere. Trate como **hipótese fortemente sugerida, não medida**.
3. **O engajamento social (único outcome primário) NÃO favorece iniciantes** — quem performa socialmente são os entendidos (OR 1,71 no logit). Implicação de produto coerente com os dois sinais: **iniciantes como mercado de dor (monetização/uso), entendidos como motor de distribuição/conteúdo** — provocar entendidos gera alcance; ensinar iniciantes resolve dor. Os dados não suportam escolher um e descartar o outro.
4. O que decidiria de verdade: microdado GA4/Firebase (retenção/conversão por tipo de usuário) — citado no PDF, ausente do acervo.

---

## 5. Caveats — o que esta análise NÃO permite concluir

1. **Viés de seleção em tudo**: todas as amostras são de pessoas que *comentam ou interagem publicamente* com conteúdo de vinho (YouTube, TikTok, IG). O iniciante silencioso — justamente o alvo do produto — está sub-representado por construção. Direção do viés: superestima entusiasmo, engajamento e, provavelmente, juventude.
2. **Demografia é inferida por IA, não declarada**: idade/gênero do IG vêm de um modelo de visão sobre foto de perfil (22% nulos, confiança média 0,81); persona/dor/sentimento dos comentários vêm de classificação LLM. São proxies com erro de medida não quantificado. Correlações *entre* rótulos IA medem coerência do codificador, não realidade externa — só os cruzamentos rótulo×variável primária (upvotes, tamanho de texto, data) têm leitura causal-candidata.
3. **Células pequenas**: idade IG tem 5–18 perfis por faixa; HP1/HP5 têm 3–7 comentários; o logit de vinho-na-foto tem 7 eventos. Qualquer subdivisão adicional (ex.: "mulheres 45–54") cai para n<10 e é estatisticamente vazia.
4. **Sem variável de negócio**: não há conversão, retenção, gasto ou intenção de uso em nenhuma base primária. O "engajamento" modelado é like em comentário de terceiros — distância grande do comportamento de uso do app. Os agregados Firebase/GA do PDF (n≈250 orgânicos, funil 0,5% criam evento) não têm microdado disponível e não entraram na estatística.
5. **Sem região e sem renda** no microdado: nada se pode afirmar quantitativamente sobre BSB/GYN ou poder aquisitivo a partir destes arquivos.
6. **Datas relativas e mistura de plataformas**: idade dos comentários parseada de "X years ago" (erro de até ±6 meses); escalas de upvotes neutralizadas por mediana-da-fonte, mas efeitos de exposição (views do vídeo) não são observados — o pseudo-R² de 2,7% reflete isso.
7. **Multiplicidade**: correlações corrigidas por BH-FDR; os testes de hipótese da seção 4 são 7 testes — mesmo com Bonferroni (α=0,007), os resultados de tamanho, dor, learning e dúvida permanecem significativos; o de engajamento permanece nulo.
8. **O que segue sendo síntese sem suporte**: "73% iniciantes" (rejeitado contra esta amostra), "core 35–54" (não rejeitado, mas não confirmado — IC 37–62%), percentuais P1–P4/HP1–HP6 do material de personas, TAM 70k, LTV/CAC. Nenhum destes deve ir a material de investidor como medição.

---

### Síntese em 5 linhas

Com n=676 comentários pt-BR (híbrido), 73 perfis IG (híbrido) e 264 comentários YT (primário): o público engajado observável é **majoritariamente feminino (72% [58; 82])**, com centro etário **25–44 (60%)** mas **35–54 ainda respondendo por ~metade (49% [37; 62] — alvo não refutado)**; **iniciantes são o maior segmento (52–65%, abaixo dos 73% declarados, p<0,001)** e concentram **2× mais dor e dúvida**; porém **o engajamento social favorece os entendidos (OR 1,71, p=0,01)** — a dor do iniciante é real e silenciosa, e o dado atual sustenta a tese "ensinar iniciante" como hipótese de dor, não como medição de mercado.

---

Arquivos salvos:
- `C:\Users\camargo\Downloads\treino-paladar-app\dd-publico\01-quantitativo.md` (relatório acima)
- `C:\Users\camargo\Downloads\treino-paladar-app\dd-publico\_analysis_quant.py` (script reproduzível de toda a análise)
