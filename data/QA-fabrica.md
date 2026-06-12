# QA — Fabrica de questoes (deterministica, sem LLM)

**Gerado por:** `scripts/fabrica_questoes.py` (seed 20260611, idempotente). Fonte: `data/vinhos_clean.csv` filtrada por `view_estrita=True` e `preco_valido!=False` + filtro defensivo de nao-vinhos.
**Quando:** 2026-06-12 07:09 UTC · duracao 31.9s

## Totais

| Onde | Total |
|---|---|
| Banco completo (`data/banco_pratica_full.jsonl`) | 19497 |
| Bundle curado (`app/src/content/pratica/banco-pratica.json`) | 480 |
| Desafios do Dia (`app/src/content/pratica/desafios.json`) | 40 (160 perguntas) |

### Banco completo, por template e dificuldade

| template | dif 1 | dif 2 | dif 3 | total |
|---|---|---|---|---|
| de-onde-vem | 1558 | 201 | 3536 | 5295 |
| harmoniza | 1151 | 1935 | 130 | 3216 |
| intruso-uva | 28 | 123 | 69 | 220 |
| mais-encorpado | 802 | 2362 | 857 | 4021 |
| qual-uva | 1339 | 717 | 349 | 2405 |
| rotulo | 2516 | 1564 | 260 | 4340 |
| **total** | 7394 | 6902 | 5201 | 19497 |

### Bundle curado, por template e dificuldade

| template | dif 1 | dif 2 | dif 3 | total |
|---|---|---|---|---|
| de-onde-vem | 36 | 30 | 24 | 90 |
| harmoniza | 30 | 36 | 12 | 78 |
| intruso-uva | 24 | 24 | 12 | 60 |
| mais-encorpado | 36 | 30 | 24 | 90 |
| qual-uva | 36 | 36 | 18 | 90 |
| rotulo | 24 | 30 | 18 | 72 |
| **total** | 186 | 186 | 108 | 480 |

### Bundle por habilidade

| habilidade | exercicios |
|---|---|
| rotulo | 162 |
| harmonizacao | 78 |
| acidez | 73 |
| frutado | 61 |
| tanino | 41 |
| docura | 33 |
| corpo | 32 |

Bundle: 365 exercicios de vinhos com imagem baixada · 418 de vinhos do mercado BR.

## Distribuicao de preco (correcao C3 da DD de publico)

A faixa real de compra do publico e R$30-80; a mediana do banco (R$108) nao descreve o cenario-base. A curadoria pondera a selecao por faixa: 30-80 tem prioridade nas dificuldades 1-2 de todos os templates, 80-150 e neutra e acima de 150 vira conteudo aspiracional concentrado na dificuldade 3. Meta: 45% ou mais do bundle com vinhos de R$30-80.

| faixa | antes (12/jun, pre-C3) | depois |
|---|---|---|
| abaixo de R$30 | 2 (0%) | 0 (0%) |
| R$30-80 (gondola do publico) | 44 (9%) | 293 (61%) |
| R$80-150 | 57 (12%) | 9 (2%) |
| acima de R$150 (aspiracional) | 317 (66%) | 118 (25%) |
| sem vinho ancorado (intruso-uva) | 60 (12%) | 60 (12%) |
| vinho sem preco de referencia | 0 (0%) | 0 (0%) |

### Depois, por dificuldade

| dificuldade | <30 | 30-80 | 80-150 | >150 | sem vinho | sem preco |
|---|---|---|---|---|---|---|
| 1 | 0 | 147 | 0 | 15 | 24 | 0 |
| 2 | 0 | 146 | 9 | 7 | 24 | 0 |
| 3 | 0 | 0 | 0 | 96 | 12 | 0 |

Desafios do Dia com vinho de R$30-150 (gondola BR): 40/40 (antes: 11/40). Por faixa: <30 0 · 30-80 21 · 80-150 19 · >150 0.

## Taxa de descarte por regra de validacao

| regra | descartes |
|---|---|
| qual-uva/nome_contem_uva | 5208 |
| mais-encorpado/nome_vaza_docura | 1888 |
| qual-uva/uva_invalida_ou_blend | 1500 |
| de-onde-vem/poucos_paises_distratores | 1140 |
| de-onde-vem/nome_contem_pais | 1118 |
| de-onde-vem/pais_invalido | 1047 |
| qual-uva/uva_sem_cor_ou_rara_demais | 827 |
| harmoniza/perfil_fora_dos_arquetipos | 822 |
| de-onde-vem/nome_contem_regiao_que_entrega | 685 |
| de-onde-vem/nome_sujo | 633 |
| de-onde-vem/dedup | 560 |
| mais-encorpado/nome_vaza_tanino | 522 |
| harmoniza/nome_sujo | 357 |
| de-onde-vem/poucas_regioes_distratoras | 331 |
| mais-encorpado/nome_vaza_corpo | 304 |
| qual-uva/nome_sujo | 164 |
| qual-uva/dedup | 126 |
| harmoniza/categoria_certa_ausente_no_arquetipo | 103 |
| harmoniza/texto_sem_categoria_mapeavel | 83 |
| qual-uva/pais_invalido | 75 |
| harmoniza/dedup | 70 |
| intruso-uva/combo_repetido | 30 |
| rotulo/sem_variante_valida | 22 |
| **total** | 17615 |

Aproveitamento: 19497 aceitos / 37112 tentados (53%).

## Exemplos (5 por template, do bundle)

### de-onde-vem

- (dif 3) O Sassicaia vem da Itália. De qual região? **Opcoes:** Piemonte / Puglia / Sicilia / Toscana **Resposta:** Toscana
- (dif 3) O Rainwater Medium Dry vem de Portugal. De qual região? **Opcoes:** Douro / Dão / Madeira / Alentejo **Resposta:** Madeira
- (dif 3) O Arrogant Frog Syrah Viognier Croak Rotie 2022 vem da França. De qual região? **Opcoes:** Bordeaux / Pézenas, Languedoc / Rhône / Bourgogne **Resposta:** Pézenas, Languedoc
- (dif 1) De qual país vem o Catena Dv Chardonnay 2020? **Opcoes:** Itália / Argentina / Portugal / França **Resposta:** Argentina
- (dif 2) De qual país vem o Brut N.V? **Opcoes:** Argentina / Brasil / EUA / Chile **Resposta:** EUA

### harmoniza

- (dif 2) Qual destes pratos costuma cair bem com o Blason del Valle Bonarda 2025? **Opcoes:** Ostras frescas / Churrasco / Sushi / Ceviche **Resposta:** Churrasco
- (dif 3) Qual destes pratos costuma cair bem com o Château Pajzos Hárslevelu "H" Late Harvest? **Opcoes:** Ceviche / Sobremesa de frutas / Sushi / Ostras frescas **Resposta:** Sobremesa de frutas
- (dif 3) Qual destes pratos costuma cair bem com o Paul Mas Rivesaltes Ambre Hors d'Age? **Opcoes:** Ostras frescas / Ceviche / Queijo gorgonzola / Sushi **Resposta:** Queijo gorgonzola
- (dif 1) Qual destes pratos costuma cair bem com o Santa Carolina Reservado Merlot? **Opcoes:** Ceviche / Sushi / Massa ao sugo / Ostras frescas **Resposta:** Massa ao sugo
- (dif 1) Qual destes pratos costuma cair bem com o Drama Red Blend? **Opcoes:** Sushi / Ostras frescas / Ceviche / Carne vermelha grelhada **Resposta:** Carne vermelha grelhada

### intruso-uva

- (dif 2) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Cabernet Sauvignon / Gamay / Castelão / Chenin Blanc **Resposta:** Chenin Blanc
- (dif 2) Três destas uvas dão vinho branco. Qual é a intrusa? **Opcoes:** Sémillon / Alvarinho / Castelão / Pinot Grigio **Resposta:** Castelão
- (dif 2) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Tempranillo / Nero d'Avola / Arinto / Cabernet Franc **Resposta:** Arinto
- (dif 1) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Cabernet Sauvignon / Sauvignon Blanc / Malbec / Tempranillo **Resposta:** Sauvignon Blanc
- (dif 1) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Merlot / Cabernet Sauvignon / Syrah / Sauvignon Blanc **Resposta:** Sauvignon Blanc

### mais-encorpado

- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** Chile Raposa Andina Sauvignon Blanc / Château Doisy Védrines **Resposta:** Château Doisy Védrines
- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** B. P. de Rothschild Baronne Pauline / D.v. Catena Zapata Cabernet Malbec 2020 **Resposta:** B. P. de Rothschild Baronne Pauline
- (dif 2) Qual destes costuma ser mais doce? **Opcoes:** Macaw Tropical / Nat Cool Niepoort **Resposta:** Macaw Tropical
- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** Arcadia Malbec / Andre Kientzler Alsace Gewurztraminer SGN 2000 **Resposta:** Andre Kientzler Alsace Gewurztraminer SGN 2000
- (dif 1) Qual destes costuma ter o tanino mais firme, aquele que seca a boca? **Opcoes:** Bianchi Iv Generacion Gran Corte 2022 / Azul Ice Moscato Casa Motter **Resposta:** Bianchi Iv Generacion Gran Corte 2022

### qual-uva

- (dif 2) O Donnafugata La Bella Sedàra DOC, da região de Sicilia, é feito principalmente de qual uva? **Opcoes:** Carménère / Trincadeira / Malbec / Nero d'Avola **Resposta:** Nero d'Avola
- (dif 2) O Frisante Namorico, da região de Vinho de Portugal, é feito principalmente de qual uva? **Opcoes:** Carricante / Loureiro / Arinto / Doña Blanca **Resposta:** Arinto
- (dif 2) O Veuve D'Argent Rosé Brut, da região de Bourgogne, é feito principalmente de qual uva? **Opcoes:** Barbera / Bobal / Gamay / Nerello Mascalese **Resposta:** Gamay
- (dif 2) O Celler Del Roure Vermell, da região de Valencia, é feito principalmente de qual uva? **Opcoes:** Castelão / Negroamaro / Grenache / Trincadeira **Resposta:** Grenache
- (dif 2) O Conde Vimioso Tâmara 2023, da região de Almeirim, Tejo, é feito principalmente de qual uva? **Opcoes:** Merlot / Cabernet Franc / Castelão / Grenache **Resposta:** Castelão

### rotulo

- (dif 3) Este rótulo é de um vinho feito com qual uva? **Opcoes:** Barbera / Bobal / Pinot Noir / Nerello Mascalese **Resposta:** Bobal · imagem: `/rotulos/62e9ddd0-1813-466a-8920-4a11d2e76a84.webp`
- (dif 2) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** Portugal / Itália / Chile / França **Resposta:** Chile · imagem: `/rotulos/24204e0d-8c75-4b48-9424-2a03d09abf5a.webp`
- (dif 3) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** África do Sul / Chile / Argentina / Brasil **Resposta:** África do Sul · imagem: `/rotulos/f22a3aee-718f-4dc8-a32c-18bb4a0a474d.webp`
- (dif 2) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** Chile / França / Argentina / Brasil **Resposta:** Argentina · imagem: `/rotulos/83b27e6f-b316-4cd8-affa-723ba3c2b913.webp`
- (dif 3) Este rótulo é de um vinho feito com qual uva? **Opcoes:** Chenin Blanc / Macabeo / Riesling / Grillo **Resposta:** Chenin Blanc · imagem: `/rotulos/dd55e29f-2893-4721-9076-f948a94ed8c3.webp`

## Desafios do Dia (amostra)

- **desafio-01** · Miolo Sebrumo Cabernet Sauvignon 2020 (Brasil, tinto) · imagem `/rotulos/648c944b-a5b9-4be2-bcd2-fafa3ea7aa65.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?
- **desafio-02** · Vallontano Reserva Merlot 2018 (Brasil, tinto) · imagem `/rotulos/c769b4e6-33a6-4562-8ebe-02278decb8b5.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?
- **desafio-03** · Santa Carolina Reservado Sauvignon Blanc (Chile, branco) · imagem `/rotulos/f9721482-33f3-4bf1-8cf9-e2553175541d.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?

## Imagens preparadas

- Convertidas para webp 480px: **112** arquivos em `app/public/rotulos/`
- Peso total: **0.79 MB** (alvo < 8 MB) · media 7.2 KB
