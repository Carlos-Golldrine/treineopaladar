# Auditoria dos bancos de dados de vinho — Tchin Tchin ("Duolingo do vinho")

Data: 2026-06-11 · Ambiente: Windows 11, Python 3.12 + pandas 2.2.3 / openpyxl 3.1.5
Arquivos auditados:

1. `C:\Users\camargo\Downloads\base_vinhos_15000.xlsx` (2,9 MB)
2. `C:\Users\camargo\Downloads\sipeagrovinhosebebidas.csv` (4,3 MB)
3. `C:\Users\camargo\Downloads\tchintchin_vinhos_seed (1) (2).xlsx` (214 KB)
4. Referência de schema do app: `C:\Users\camargo\tchin-tchin-app\src\legacy\data.jsx` (MOCK_WINES)

---

## TL;DR

| Base | Linhas | É real? | Imagens | Veredito |
|---|---|---|---|---|
| base_vinhos_15000 | 15.000 | **NÃO — sintética/aleatória** (40% das uvas brancas rotuladas "Tinto"; "Château Margaux Pinot Meunier Branco") | Nenhuma coluna | **Descartar como fonte de fatos.** No máximo inspiração de schema |
| SIPEAGRO/MAPA | 30.725 | Sim, mas são **estabelecimentos**, não vinhos | Não | Não serve para lições. Útil só para validar produtores BR |
| tchintchin_seed | 1.227 | **Sim — vinhos reais, curados** (Catena, Crasto, Pingus, Aurora, Guaspari…) | Colunas existem, **0% preenchidas** | **Base primária.** Falta: imagens, EAN, validação de preço, dedup (~37 dups) |

**Recomendação: usar o seed (1.227 vinhos) como base primária das lições e enriquecê-lo** (imagens, descrições, dedup). A base de 15k é dado sintético inconsistente — usá-la geraria perguntas factualmente erradas (ex.: "qual uva é essa?" com resposta impossível).

---

## 1. base_vinhos_15000.xlsx

### A. Schema
3 abas: **`Base de Vinhos`** (15.000 × 37), `Resumo Estatístico` (19 × 2), `Por País` (20 × 5).

Colunas da aba principal (todas ~100% preenchidas, exceto onde indicado):
`ID` (int), `Nome do Vinho`, `Produtor/Vinícola`, `País`, `Região`, `Sub-Região`, `Uva/Casta Principal`, `Tipo`, `Safra` (int 1985–2024), `Teor Alcoólico (%)` (8,0–22,0), `Volume (ml)`, `Preço (USD)` (5,00–653,12), `Pontuação (pts)` (70–100), `Corpo`, `Acidez`, `Taninos` (**55,5%**), `Doçura`, `Aroma Principal/Secundário/Terciário`, `Harmonização 1/2/3`, `Temp. Serviço (°C)`, `Potencial de Guarda (anos)`, `Método de Produção`, `Classificação/Denominação` (**47,6%**), `Envelhecimento`, `Meses em Barrica`, `Tipo de Fechamento`, `Orgânico`, `Biodinâmico`, `Vegano`, `Cor`, `Lote`, `Código de Barras (EAN)`, `Notas do Enólogo`.

Exemplos reais (3 linhas):

| ID | Nome | Uva | Tipo | País/Região | Preço USD |
|---|---|---|---|---|---|
| 1 | Classic Heitz Cellar 1991 | **Merlot** | Tinto | EUA / Napa / Coombsville | 35,13 |
| 2 | Au Bon Climat Chardonnay 2002 | Chardonnay | **Tinto** (!) | EUA / **Oregon** (!) | 35,60 |
| 3 | Clarendon Hills Limited Edition Chardonnay | Chardonnay | Tinto (!) | Austrália / **Hunter Valley** (!) | 10,36 |

### B. Volume
15.000 linhas, 487 produtores únicos, 196 uvas, 20 países.

### C. Qualidade
- Preenchimento alto (37 colunas ~100%), mas **o conteúdo é gerado aleatoriamente**:
  - **39,5% das uvas brancas (1.382/3.496) rotuladas como "Tinto"**; 34,4% das uvas tintas como Branco/Rosé.
  - Chardonnay aparece como Tinto (500), Rosé (128), Espumante (127), Fortificado (83)…
  - Produtores reais combinados com regiões erradas: Au Bon Climat em "Oregon", Clarendon Hills em "Hunter Valley", "Château Margaux Icon Pinot Meunier" Branco em Champagne.
  - Harmonizações aleatórias: a mais comum para Tinto é "Sobremesas de Frutas"; Espumante = "Comida Indiana"; sushi + foie gras na mesma linha.
  - EANs com 13 dígitos mas prefixos inventados; lotes tipo `L1991-649-D49`.
- Duplicatas: 0 linha-inteira; 121 por nome; 19 por (nome, produtor, safra).
- Encoding: limpo (sem mojibake), pt-BR correto.

### D. Imagens
**Nenhuma coluna de imagem/URL.** Amostra de URLs: N/A.

### E. Distribuições
- **Top 10 uvas:** Chardonnay 1.222 · Cabernet Sauvignon 1.008 · Pinot Noir 757 · Sauvignon Blanc 733 · Syrah 621 · Merlot 607 · Riesling 572 · Grenache 278 · Malbec 270 · Tannat 203.
- **Top 10 países:** Itália 1.853 · França 1.787 · EUA 1.504 · Espanha 1.471 · Portugal 1.205 · Argentina 835 · Alemanha 820 · Chile 806 · Austrália 782 · África do Sul 635 (Brasil: 622).
- **Tipos:** Tinto 6.038 · Branco 3.620 · Rosé 1.562 · Espumante 1.500 · Sobremesa 1.215 · Fortificado 1.065.
- **Preço (USD):** mediana 24,51; <10: 2.386 · 10–20: 3.776 · 20–30: 2.644 · 30–50: 3.048 · 50–100: 2.297 · 100–200: 708 · >200: 141.

### F. Veredito
**Não serve para gerar conteúdo factual de lições.** Qualquer pergunta "qual uva é essa / de onde vem / com o que harmoniza" gerada daqui teria ~35–40% de chance de ter resposta errada na fonte. Uso aceitável apenas como: (a) inspiração de schema (a lista de 37 campos é boa — aromas em 3 níveis, temp. de serviço, potencial de guarda, método de produção são campos que o seed não tem); (b) volume para teste de carga/UI. **Não usar como verdade.**

---

## 2. sipeagrovinhosebebidas.csv (SIPEAGRO/MAPA)

### A. Schema
CSV, separador `;`, encoding UTF-8, 9 colunas — **registro de ESTABELECIMENTOS, não de vinhos**:
`UF`, `MUNICIPIO`, `NUMERO_REGISTRO_ESTABELECIMENTO`, `STATUS_DO_REGISTRO`, `CPF_CNPJ` (mascarado: `**.***.082/***-**`), `RAZAO_SOCIAL`, `AREA_ATUACAO`, `ATIVIDADE`, `CLASSIFICACAO`.

Exemplos reais:

| UF | Município | Registro | Status | Razão Social | Atividade | Classificação |
|---|---|---|---|---|---|---|
| PR | Paranavaí | PR0001422 | Cancelado | INDUSTRIA DE BEBIDAS PRATIKO LTDA | Bebidas em geral | Produtor ou fabricante |
| RS | Caxias do Sul | RS0034908 | Ativo | CANTINA DE VINHO SANTA CECILIA LTDA | Vinhos e derivados | Produtor ou elaborador |
| RS | Rio Grande | RS0023400 | Ativo | Supermercado Guanabara S/A | Vinhos e derivados | Importador |

### B. Volume
30.725 linhas = 12.390 estabelecimentos únicos (1 linha por classificação/atividade).

### C. Qualidade
- 100% de preenchimento nas 9 colunas; 0 duplicatas linha-inteira (a "duplicação" é o modelo 1:N estabelecimento × classificação).
- **Zero colunas de vinho**: sem nome de produto, uva, safra, preço, tipo, descrição, imagem.
- CNPJ mascarado (inútil para join externo). Encoding OK (o mojibake aparente no `head` era só visualização; lido como UTF-8 fica perfeito).
- Status: Ativo 26.566 · Cancelado 4.112 · Suspenso 47.
- Atividade: "Bebidas em geral" 22.717 · "Vinhos e derivados da uva e do vinho" 8.006.
- Classificação (top): Produtor/Fabricante 7.867 · Envasilhador 7.624 · Importador 6.111 · Exportador 2.675.
- UF (top): SP 5.863 · RS 4.903 · MG 4.103 · SC 3.395 · PR 1.895.

### D. Imagens
Não há. N/A.

### E. Distribuições
Não aplicável a vinhos (não há uva/tipo/preço). Distribuição geográfica acima.

### F. Veredito
**Não serve para lições de vinho.** Usos válidos e restritos:
- Validar/normalizar nomes de **vinícolas brasileiras** (filtrar `ATIVIDADE = VINHOS E DERIVADOS` + `Ativo` + classificação Produtor/Elaborador/Cantina ≈ catálogo de produtores BR legalizados);
- Conteúdo "curiosidade Brasil" (ex.: "RS e a Serra Gaúcha concentram a produção" — RS tem 4.903 registros);
- Futuro marketplace/parcerias (lista de importadoras ativas).

---

## 3. tchintchin_vinhos_seed (1) (2).xlsx

### A. Schema
2 abas: **`vinhos`** (1.227 × 33) e `README` (metadados + limitações declaradas — ótimo sinal de curadoria).

Colunas: `id` (UUID), `nome`, `produtor`, `safra` (90,5%), `is_nv` (bool), `codigo_barras` (**0%**), `tipo` (minúsculo: tinto/branco/…), `subtipo_docura` (seco/doce/demi_sec/suave), `uva_principal`, `uvas_secundarias` (37,2%), `pais`, `regiao`, **perfil sensorial 0–5**: `acidez`, `tanino`, `corpo`, `frutado`, `docura`, + `confianca_sensorial` (65–75), `fonte_sensorial` (100% "template"), `preco_referencia` (R$), `faixa_preco_tier` ($–$$$$), `tamanho_garrafa_ml`, `teor_alcoolico`, `imagem_rotulo_url` (**0%**), `thumbnail_url` (**0%**), `harmonizacao_categorias` (CSV de slugs: `carnes_vermelhas,queijos_duros,churrasco,…`), `fornecedores_ativos` (0%), `parcerias_afiliado_json`, `status_moderacao` (100% "pendente"), `origem_cadastro` (100% "llm"), `is_active`, `created_at`, `updated_at`.

Exemplos reais:

| nome | produtor | uva | tipo | país/região | R$ | tier | sensorial (ac/ta/co/fr/do) |
|---|---|---|---|---|---|---|---|
| Catena Malbec (2022) | Bodega Catena Zapata | Malbec | tinto | Argentina/Mendoza | 189,90 | $$ | 3/4/4/4/1 |
| Catena Alta Malbec (2021) | Bodega Catena Zapata | Malbec | tinto | Argentina/Mendoza | 459,00 | $$$ | 3/4/5/4/1 |
| Catena Cabernet Sauvignon (2021) | Bodega Catena Zapata | Cab. Sauvignon | tinto | Argentina/Mendoza | 189,90 | $$ | 3/4/4/3/1 |

Amostra aleatória confirma vinhos reais e relevantes para o mercado BR: Quinta do Crasto Touriga Nacional, Flor de Pingus, Vieux Télégraphe La Crau, Aurora Reserva, Guaspari Vista Verde, Cordilheira de Sant'Ana, Frontera Rosé…

### B. Volume
1.227 vinhos · 474 produtores · 112 uvas · 18 países.

### C. Qualidade
- **Preenchimento das colunas-chave: nome/uva/país/região/tipo/preço/teor/harmonização = 100%**; safra 90,5% (+117 NV legítimos via `is_nv`); uvas_secundarias 37,2% (esperado — maioria varietal).
- **Lacunas zeradas (declaradas no README): código de barras 0%, imagem_rotulo_url 0%, thumbnail_url 0%, fornecedores 0%.**
- Sem descrição textual/notas de degustação (não existe coluna).
- **Duplicatas: 37 por (nome, produtor, safra), 56 por (nome, produtor)** — ex.: Allegrini La Grola 2020 aparece 2×, Aurora Reserva Cab 2×. Dedup necessário antes de seed em produção (~3–5% da base).
- Coerência sensorial OK: 0 brancos/espumantes com tanino ≥ 3 (vs. 40% de erro da base 15k). Escalas: acidez 3–5 (pouca variância — tudo "template"), tanino 0–5, corpo 1–5.
- Encoding limpo, sem mojibake. `fonte_sensorial=template` + `confianca 65–75` em 100% das linhas = perfis derivados de uva/região, não degustação real (o próprio README recomenda fine-tuning manual nos ícones $$$$).
- Preços: estimativas em BRL não validadas (README manda validar com importadoras). Max R$ 29.900 (DRC?) puxa a média; mediana R$ 159,90.

### D. Imagens
Colunas existem (`imagem_rotulo_url`, `thumbnail_url`) mas **100% vazias** — amostra de 5 URLs: impossível, não há nenhuma. O README já prevê "pipeline próprio de scraping necessário".

### E. Distribuições
- **Top 10 uvas:** Cabernet Sauvignon 172 · Chardonnay 113 · Malbec 95 · Pinot Noir 72 · Touriga Nacional 57 · Sauvignon Blanc 53 · Merlot 52 · Tempranillo 48 · Sangiovese 44 · Carmenere 38.
- **Top 10 países:** Brasil 201 · Itália 189 · Chile 176 · França 172 · Argentina 130 · Portugal 127 · Espanha 113 · Alemanha 22 · EUA 20 · Nova Zelândia 17 (+ Hungria, Grécia, Líbano, Uruguai, Geórgia — boa cauda longa para lições "fora do óbvio").
- **Tipos:** tinto 757 (62%) · branco 271 · espumante 130 · fortificado 31 · rose 27 · sobremesa 11.
- **Preço (R$):** mediana 159,90; <50: 138 · 50–100: 256 · 100–150: 191 · 150–250: 265 · 250–500: 190 · 500–1000: 113 · >1000: 74. Tiers: $ 268 · $$ 515 · $$$ 257 · $$$$ 187.
- **Harmonização (slugs, top):** massas_molho_vermelho 714 · queijos_duros 455 · carnes_vermelhas 453 · churrasco 453 · pizza 261 · aperitivo 250 · frutos_do_mar 224.

### F. Veredito
**É a base primária correta.** Já suporta diretamente os 3 tipos de pergunta de lição:
- "Qual uva é essa?" → `uva_principal` 100% (112 uvas, distribuição condizente com o mercado BR);
- "De onde vem?" → `pais` + `regiao` 100% (regiões reais: Mendoza, Serra Gaúcha, Toscana, Douro…);
- "Com o que harmoniza?" → `harmonizacao_categorias` 100% em taxonomia controlada de slugs (perfeita para gerar alternativas erradas plausíveis);
- Bônus: perfil sensorial 0–5 compatível com o conceito do quiz de paladar do app, `faixa_preco_tier` para perguntas de valor, `subtipo_docura` para lições de doçura.

**O que falta:** (1) imagens de rótulo — bloqueador para perguntas visuais e cards; (2) descrição/nota de degustação textual; (3) dedup de ~37 linhas; (4) validação de preços BRL; (5) rosé/sobremesa sub-representados (27 e 11) — pouco material para lições desses tipos; (6) fine-tuning sensorial dos ícones; (7) EAN para o scanner (f20).

---

## 4. Comparação com o schema do app (MOCK_WINES em data.jsx)

```js
{ id, name, producer, country, region, type, price, match,
  perfil: { docura, acidez, tanino, corpo, alcool } }  // escala 0–100
```

| Campo do app | Seed | Base 15k | Observação |
|---|---|---|---|
| name/producer | `nome`/`produtor` ✔ | ✔ (mas fictícios) | direto |
| country/region | `pais`/`regiao` ✔ | ✔ (inconsistentes) | direto |
| type | `tipo` ✔ (minúsculo: "tinto" vs app "Tinto") | ✔ | normalizar capitalização |
| price | `preco_referencia` ✔ (BRL, igual ao mock) | USD | seed já está em R$ |
| perfil 0–100 | sensorial **0–5** → multiplicar ×20 | textual ("Médio-Alto") | conversão trivial do seed; do 15k exigiria mapeamento |
| perfil.alcool | não existe como 0–100; derivar de `teor_alcoolico` | idem | ex.: normalizar 8–16% → 0–100 |
| perfil.frutado | seed tem `frutado` extra (app não usa) | — | manter, útil p/ lições |
| match | calculado em runtime | — | OK |

**Conversão seed → app é direta** (renomear colunas, ×20 nas escalas, capitalizar tipo, derivar `alcool`). O seed ainda traz campos que o mock não tem e as lições vão precisar (`uva_principal`, `harmonizacao_categorias`, `subtipo_docura`, `safra`, `teor_alcoolico`).

---

## 5. Plano recomendado

1. **Primária = seed (1.227)**: dedup por (nome, produtor, safra) → ~1.190 vinhos; normalizar `tipo`; converter sensorial 0–5 → 0–100.
2. **Enriquecer**: pipeline de imagens de rótulo (scraping Vivino/sites de importadoras ou fotos próprias — atenção a direitos de uso); gerar descrições pt-BR por LLM **ancoradas nos campos estruturados** (uva+região+sensorial) e marcar `fonte=llm` para revisão; validar preços contra Evino/Wine/Grand Cru/Mistral (o README do seed já lista); preencher EAN onde possível.
3. **SIPEAGRO**: usar apenas como tabela auxiliar de produtores BR ativos (filtro: atividade vinhos + status Ativo) e curiosidades regionais.
4. **base_vinhos_15000: arquivar.** Aproveitar só a *ideia* dos campos extras (aromas em níveis, temperatura de serviço, potencial de guarda, método de produção) como roadmap de schema — nunca os dados.
5. **Gaps de conteúdo para lições**: gerar/curar mais rosés, espumantes nacionais e vinhos de sobremesa; criar banco de distratores por taxonomia (uvas parecidas, regiões vizinhas) a partir das 112 uvas e 18 países do seed.
