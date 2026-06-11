Validação passou limpa: 6 JSON parseados, contrato respeitado, zero travessão, zero emoji, zero vocabulário proibido. Resultado final:

## Arquivos criados

- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\types.ts` (types do contrato: Licao, UnidadeMeta, 6 payloads de exercicio)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\index.ts` (barrel tipado: meta + 5 licoes + licoesPorId)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\json.d.ts` (declaracao ambiente para importar JSON sem tocar no tsconfig, que nao tem resolveJsonModule)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-1.meta.json` (id u1, cor #722F37)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-1\licao-01.json` ... `licao-05.json`

Nenhum outro arquivo do app foi tocado. Build nao foi rodado; JSON validados com node (parser + checagens de schema, indices, dificuldade, calibrar, 4+ tipos por licao, travessao/emoji/vocabulario proibido/formula "nao e X, e Y").

## Contagem de exercicios (48 no total)

| Licao | Total | mc | swipe | slider | ordenar | intruso | duasverdades | Dificuldade | calibrar |
|---|---|---|---|---|---|---|---|---|---|
| u1-l1 Tanino | 9 | 5 | 1 | 1 | 0 | 1 | 1 | 1,1,2,2,2,2,3,3,1 | 2 |
| u1-l2 Acidez | 9 | 5 | 1 | 1 | 0 | 1 | 1 | 1,1,2,2,2,2,3,3,1 | 2 |
| u1-l3 Corpo | 10 | 6 | 0 | 1 | 1 | 1 | 1 | 1,1,2,2,2,2,3,3,1,1 | 2 |
| u1-l4 Docura | 10 | 6 | 1 | 1 | 1 | 0 | 1 | 1,1,2,2,2,2,3,3,3,1 | 2 |
| u1-l5 Os 4 juntos | 10 | 5 | 1 | 1 | 1 | 1 | 1 | 1,1,2,2,2,2,3,3,3,1 | 2 |
| **Totais** | **48** | **27** | **4** | **5** | **3** | **4** | **5** | abre facil, nucleo, fecha facil | 10 |

Nota de contrato: a licao u1-l5 e consolidacao dos 4 eixos, mas o enum de `habilidade` nao tem valor misto; usei `"corpo"` como tag. Se o engine for creditar Score de Paladar por habilidade, vale decidir se o enum ganha um valor `"mista"`.

## Ficha canonica por licao (para o verificador)

**u1-l1 Tanino:**
1. Tanino e um polifenol natural presente na casca, na semente e no engaco da uva, e tambem na madeira dos barris de carvalho.
2. O tanino se liga as proteinas da saliva e provoca adstringencia, a sensacao de boca seca e aspera.
3. A adstringencia do tanino e uma sensacao tatil, percebida na gengiva, na lingua e nas bochechas, e nao um dos cinco gostos basicos.
4. Vinhos tintos tem mais tanino que brancos porque fermentam em contato com as cascas da uva.
5. Cha preto em infusao longa e rico em taninos e produz a mesma secura na boca de um tinto tanico.
6. Proteinas e gorduras dos alimentos (carne vermelha, queijos) se ligam ao tanino e suavizam a secura.

**u1-l2 Acidez:**
1. A acidez do vinho vem de acidos naturais da propria uva, principalmente tartarico e malico.
2. A acidez estimula a salivacao: boca enchendo de agua apos engolir e o sinal classico de acidez alta.
3. A acidez corresponde ao gosto azedo, um dos cinco gostos basicos.
4. Uvas de climas mais frios tendem a preservar mais acidez, porque o calor consome o acido malico no amadurecimento.
5. Brancos e espumantes costumam apresentar acidez mais marcada que tintos.
6. A acidez atua como conservante natural e e responsavel pela sensacao de frescor.

**u1-l3 Corpo:**
1. Corpo e a sensacao de peso e textura que o vinho provoca na boca.
2. O alcool e o principal componente do corpo: mais teor alcoolico, mais encorpado tende a ser.
3. Acucar residual e concentracao de compostos extraidos da uva tambem aumentam a sensacao de corpo.
4. Referencia geral: abaixo de 12,5% de alcool tende a leve; acima de 13,5% tende a encorpado.
5. Uvas de climas quentes acumulam mais acucar, que fermenta em mais alcool, gerando vinhos tendencialmente mais encorpados.
6. Corpo descreve estilo e nao indica qualidade.

**u1-l4 Docura:**
1. A docura vem do acucar residual: acucar da uva nao transformado em alcool na fermentacao.
2. Em um vinho seco, a fermentacao consumiu praticamente todo o acucar da uva.
3. Legislacao brasileira: seco ate 4 g/L de acucar; meio seco entre 4 e 25 g/L; suave ou doce acima de 25 g/L.
4. No Brasil, grande parte dos vinhos rotulados suaves recebe adicao de acucar pos-fermentacao (pratica prevista em lei); os classicos vinhos doces do mundo concentram acucar natural da uva.
5. Alguns dos vinhos mais celebrados e caros do mundo sao doces: Sauternes, Tokaji, Porto.
6. Acidez alta equilibra e disfarça a docura: vinho com muito acucar e muita acidez pode parecer menos doce do que e.

**u1-l5 Os 4 juntos:**
1. Docura e acidez sao gostos basicos; tanino e sensacao tatil de adstringencia; corpo e percepcao de peso e textura: canais diferentes.
2. Na prova tecnica, a sequencia de avaliacao e: docura na entrada, acidez pela salivacao, tanino pela secura, corpo pelo peso do conjunto.
3. Pinot Noir produz tintos tipicamente leves, de tanino baixo e acidez alta.
4. Cabernet Sauvignon produz tintos tipicamente encorpados e de tanino alto.
5. Sauvignon Blanc produz brancos tipicamente secos, leves e de acidez alta.
6. Espumantes de Moscatel (Moscatel de Asti, moscateis brasileiros) sao tipicamente doces, leves e de baixo teor alcoolico.

Curiosidades tambem checaveis (fora da ficha): tanino como conservante natural (l1), cristais de tartarato (l2), lagrimas na taca indicam mais alcool (l3), Tokaji "vinho dos reis, rei dos vinhos" atribuido a corte de Luis XIV (l4).
