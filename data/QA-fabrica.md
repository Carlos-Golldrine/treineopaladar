# QA — Fabrica de questoes (deterministica, sem LLM)

**Gerado por:** `scripts/fabrica_questoes.py` (seed 20260611, idempotente). Fonte: `data/vinhos_clean.csv` filtrada por `view_estrita=True` e `preco_valido!=False` + filtro defensivo de nao-vinhos.
**Quando:** 2026-06-12 02:20 UTC · duracao 28.8s

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
| acidez | 67 |
| frutado | 60 |
| tanino | 45 |
| corpo | 35 |
| docura | 33 |

Bundle: 420 exercicios de vinhos com imagem baixada · 420 de vinhos do mercado BR.

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
- (dif 3) O Bertani Velante Pinot Grigio IGT vem da Itália. De qual região? **Opcoes:** Soave / Puglia / Piemonte / Toscana **Resposta:** Soave
- (dif 3) O Château Quinault L’Enclos vem da França. De qual região? **Opcoes:** Champagne / Bourgogne / Rhône / Bordeaux **Resposta:** Bordeaux
- (dif 1) De qual país vem o Almadén Vintage Rosé? **Opcoes:** Itália / Portugal / Brasil / França **Resposta:** Brasil
- (dif 2) De qual país vem o M. Molitor Brauneberger Mandelgraben Pinot Noir? **Opcoes:** Itália / Alemanha / Espanha / França **Resposta:** Alemanha

### harmoniza

- (dif 2) Qual destes pratos costuma cair bem com o Kaufmann Rheingau Riesling Vdp Gutswein 2023? **Opcoes:** Churrasco / Carne vermelha grelhada / Massa ao sugo / Sushi **Resposta:** Sushi
- (dif 3) Qual destes pratos costuma cair bem com o Château Pajzos Hárslevelu "H" Late Harvest? **Opcoes:** Ceviche / Sobremesa de frutas / Sushi / Ostras frescas **Resposta:** Sobremesa de frutas
- (dif 3) Qual destes pratos costuma cair bem com o Graham's Blend N5? **Opcoes:** Sushi / Ceviche / Ostras frescas / Queijo gorgonzola **Resposta:** Queijo gorgonzola
- (dif 1) Qual destes pratos costuma cair bem com o Marqués de Murrieta Dalmau? **Opcoes:** Ostras frescas / Sushi / Ceviche / Carne vermelha grelhada **Resposta:** Carne vermelha grelhada
- (dif 1) Qual destes pratos costuma cair bem com o Santa Carolina Reservado Cabernet Sauvignon 1,5lt? **Opcoes:** Ceviche / Carne vermelha grelhada / Ostras frescas / Sushi **Resposta:** Carne vermelha grelhada

### intruso-uva

- (dif 2) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Cabernet Sauvignon / Gamay / Castelão / Chenin Blanc **Resposta:** Chenin Blanc
- (dif 2) Três destas uvas dão vinho branco. Qual é a intrusa? **Opcoes:** Sémillon / Alvarinho / Castelão / Pinot Grigio **Resposta:** Castelão
- (dif 2) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Tempranillo / Nero d'Avola / Arinto / Cabernet Franc **Resposta:** Arinto
- (dif 1) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Cabernet Sauvignon / Sauvignon Blanc / Malbec / Tempranillo **Resposta:** Sauvignon Blanc
- (dif 1) Três destas uvas dão vinho tinto. Qual é a intrusa? **Opcoes:** Merlot / Cabernet Sauvignon / Syrah / Sauvignon Blanc **Resposta:** Sauvignon Blanc

### mais-encorpado

- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** Château Lafaurie-Peyraguey / A. Goichot Meursault "Les Narvaux" **Resposta:** Château Lafaurie-Peyraguey
- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** Château Climens / Montevertine Rosso 2022 **Resposta:** Château Climens
- (dif 2) Qual destes costuma ser mais doce? **Opcoes:** Luigi Bosca Gewurztraminer Granos Nobles 2024 / Salton Virtude Chardonnay 2023 **Resposta:** Luigi Bosca Gewurztraminer Granos Nobles 2024
- (dif 1) Qual destes costuma ser mais doce? **Opcoes:** Château Doisy-Védrines / Montagny 1 er cru "Les Coères" 2017 **Resposta:** Château Doisy-Védrines
- (dif 1) Qual destes costuma ter o tanino mais firme, aquele que seca a boca? **Opcoes:** Machete California 2019 / Fortis **Resposta:** Machete California 2019

### qual-uva

- (dif 2) O Michele Chiarlo Palás Barolo, da região de Piemonte, é feito principalmente de qual uva? **Opcoes:** Nebbiolo / Sangiovese / Aglianico / Tannat **Resposta:** Nebbiolo
- (dif 2) O G. Bertrand Héritage Fitou "An 990", da região de Languedoc-Roussillon, é feito principalmente de qual uva? **Opcoes:** Castelão / Grenache / Negroamaro / Trincadeira **Resposta:** Grenache
- (dif 2) O Morlet La Proportion Dorée White 2019, da região de Califórnia, é feito principalmente de qual uva? **Opcoes:** Sémillon / Malvasia / Gewurztraminer / Viognier **Resposta:** Sémillon
- (dif 2) O Borsao Selección, da região de Campo de Borja, é feito principalmente de qual uva? **Opcoes:** Castelão / Negroamaro / Trincadeira / Grenache **Resposta:** Grenache
- (dif 2) O Porto Burmester Ruby, da região de Douro, é feito principalmente de qual uva? **Opcoes:** Touriga Nacional / Corvina / Touriga Franca / Syrah **Resposta:** Touriga Nacional

### rotulo

- (dif 3) Este rótulo é de um vinho feito com qual uva? **Opcoes:** Antão Vaz / Chardonnay / Grenache Blanc / Grillo **Resposta:** Grenache Blanc · imagem: `/rotulos/ca04f082-e04b-4b7d-bb11-392afc1ce135.webp`
- (dif 2) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** Itália / Chile / Argentina / Brasil **Resposta:** Itália · imagem: `/rotulos/e5ffd901-05db-41b0-be04-379d7007e879.webp`
- (dif 3) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** África do Sul / Chile / Argentina / Brasil **Resposta:** África do Sul · imagem: `/rotulos/f22a3aee-718f-4dc8-a32c-18bb4a0a474d.webp`
- (dif 2) Olhe o rótulo com calma. Este vinho vem de qual país? **Opcoes:** França / Argentina / Brasil / Chile **Resposta:** França · imagem: `/rotulos/1283e218-15ac-4777-b5d2-52ded780e124.webp`
- (dif 3) Este rótulo é de um vinho feito com qual uva? **Opcoes:** Marsanne / Antão Vaz / Grenache Blanc / Chardonnay **Resposta:** Antão Vaz · imagem: `/rotulos/416c0710-ca97-4ab9-9a6f-1fda2e8c7f53.webp`

## Desafios do Dia (amostra)

- **desafio-01** · Catena Zapata Malbec Argentino 2022 (Argentina, tinto) · imagem `/rotulos/d3555ff4-ca4a-4a01-98d6-25aac799da80.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?
- **desafio-02** · Sassicaia (Itália, tinto) · imagem `/rotulos/5a789f44-152e-463d-a769-b4248fc0b724.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?
- **desafio-03** · Miolo Sebrumo Cabernet Sauvignon 2020 (Brasil, tinto) · imagem `/rotulos/648c944b-a5b9-4be2-bcd2-fafa3ea7aa65.webp` · perguntas: Para abrir: este vinho é de qual tipo? | Procure a origem no rótulo. De qual país vem este vinho? | E a uva principal deste rótulo, qual é? | Para fechar: qual destes pratos costuma cair bem com este vinho?

## Imagens preparadas

- Convertidas para webp 480px: **112** arquivos em `app/public/rotulos/`
- Peso total: **0.79 MB** (alvo < 8 MB) · media 7.2 KB
