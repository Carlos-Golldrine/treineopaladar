Project typecheck shows no errors in conteudo.ts. All edits are clean. Here is the report.

## Correções aplicadas (escopo: unidade-1/-2/-3/-4 + conteudo.ts)

Todas as 17 correções do plano dentro do meu escopo foram aplicadas com match exato. JSONs validados com node (8/8 OK), conteudo.ts sem erros de typecheck no arquivo, zero travessão/en-dash e zero emoji introduzidos.

**conteudo.ts** (`app/src/onboarding/conteudo.ts`)
- Item 1 — fichaCanonica[0]: "entre 6 e 10 graus" → "abaixo de uns 10 graus"
- Item 2 — fichaCanonica[1]: "entre 14 e 18" → "entre 12 e 18, com os leves no lado mais frio"
- Item 3 — j7.porque: "entre 6 e 10 graus" → "entre 6 e 8 graus"
- Item 4 — comentário acima de j1: "tinto fresco, 12-16" → "tinto fresco, 12-18 (leves no lado frio)" (o textoAtual do plano omitia o prefixo "factualmente exata."; localizei pela linha real)
- Item 5 — j5Mercado: pergunta para "O que essa palavra conta sobre o vinho?" e opção[1] "Um vinho que resseca a língua" → "Que ele resseca a língua"
- Item 6 — j5Outros: mesma reescrita (pergunta + opção[1]), mantendo as duas variantes idênticas no padrão

**unidade-1**
- Item 7 — licao-01.json swipe carta idx 4 porque (tanino natural/tato)
- Item 8 — licao-04.json mc café erroMsg (café: doçura, não cafeína/temperatura)
- Item 9 — licao-04.json mc café porque (açúcar em dose alta soma corpo)
- Item 10 — licao-04.json mc origem da doçura porque (açúcar residual no mundo vs. adição no Brasil)
- Item 11 — licao-04.json ordenar itens[2]: "Colheita tardia bem doce" → "Colheita tardia, néctar de sobremesa"
- Item 12 — licao-05.json duasverdades afirmacoes[1] (eixos variam em separado, mas interagem; acidez disfarça doçura)

**unidade-3**
- Item 13 — licao-02.json swipe carta idx 1 texto: "Toque de manteiga" → "Baunilha com toque de manteiga"
- Item 14 — licao-04.json fichaCanonica[0] (maioria + exceção moscatel)
- Item 15 — licao-04.json swipe carta idx 2 texto ("Na maioria dos espumantes...")
- Item 16 — licao-04.json fichaCanonica[2] (regras internacionais de indicação de origem)
- Item 17 — licao-04.json mc d3 pergunta ("Por que, pelas regras de origem... usa outro nome?")

**unidade-4**
- Item 18 — licao-02.json swipe carta idx 0 texto (prefixo "No vinho tranquilo,")
- Item 19 — licao-02.json swipe carta idx 0 porque (lei do tranquilo; espumante 15-20 g)
- Item 20 — licao-02.json swipe carta idx 4 porque ("variam em separado")
- Item 21 — licao-04.json swipe carta idx 3 texto ("Estoque fresco, com temperatura estável...")
- Item 22 — licao-05.json fichaCanonica[0] (tinto 12-18, branco leve a 7, espumante 6-8)
- Item 23 — licao-05.json mc erro do tinto porque ("entre 12 e 18, conforme o corpo")
- Item 24 — licao-05.json recap ("entre 12 e 18 graus conforme o corpo")
- Item 25 — licao-05.json voceAgoraSabe[0] ("tinto 12 a 18 (leves no lado frio)")

**Relabel dos OBJETIVOS (decisão do fundador) em CARTAS_OBJETIVO**
- Mantidos os mesmos ids/valores; só a copy do `rotulo` mudou e adicionei campo opcional `sub`:
  - mercado: "Comprar sem medo de errar" / "na gôndola do mercado"
  - restaurante: "Pedir bem no restaurante" / "carta de vinhos sem pânico"
  - receber: "Harmonizar em casa" / "casar prato e taça"
  - presente: "Acertar no presente" / "a garrafa certa para a pessoa certa"
  - trabalho: "Trabalhar com vinho" / "balcão, salão ou adega"
  - outros: "Só quero aprender" / "curiosidade e motivo de sobra"
- A interface `CartaConteudo` ganhou `sub?: string` com comentário instruindo o componente da J3 a exibir o sub abaixo do rótulo. **Não toquei no componente**, apenas no dado e no comentário.

## O que NÃO está no meu escopo (não aplicado, propositalmente)
Itens fora dos arquivos permitidos, deixados intactos para outro editor:
- Itens 26-35 — unidade-5 e unidade-6 (licao-01/-03/-04 da u5; licao-05 da u6)
- Itens 36-39 — pipeline de dados (banco-pratica.json, desafios.json, vinhos_clean.csv): correções de gerador/CSV, não de copy

## Observação
- Item 4: o `textoAtual` no plano (`Branco serve a 8-12 graus; tinto fresco, 12-16. */`) não casou na primeira tentativa porque a frase compartilha linha com o prefixo `factualmente exata.`; ancorei nesse prefixo e apliquei. Nenhum outro item teve divergência de texto.

Arquivos modificados:
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\conteudo.ts`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-1\licao-01.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-1\licao-04.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-1\licao-05.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-3\licao-02.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-3\licao-04.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-4\licao-02.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-4\licao-04.json`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-4\licao-05.json`
