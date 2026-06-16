# PLANO-CORRECOES.md — Auditoria de consistência (julgado)

Fonte da verdade dos números: `docs/canon-fatos.md`. Voz Mago+Sábio, sem travessão, sem emoji.
Cada `textoAtual` é exato para o editor localizar via busca. `textoNovo` é cirúrgico.

Contagem: ALTA 4 · MEDIA 8 · BAIXA 9 · rejeitados 3.

---

## Achados procedentes (ordenados por arquivo)

| # | arquivo | idOuIndice/campo | textoAtual (exato) | textoNovo | gravidade |
| --- | --- | --- | --- | --- | --- |
| 1 | app/src/onboarding/conteudo.ts | fichaCanonica[0] (licaoFtue) | `Vinhos brancos e espumantes são servidos bem gelados, entre 6 e 10 graus.` | `Vinhos brancos e espumantes são servidos bem gelados, abaixo de uns 10 graus.` | MEDIA |
| 2 | app/src/onboarding/conteudo.ts | fichaCanonica[1] (licaoFtue) | `Vinhos tintos são servidos frescos, entre 14 e 18 graus, abaixo da temperatura ambiente do Brasil.` | `Vinhos tintos são servidos frescos, entre 12 e 18 graus, com os leves no lado mais frio, abaixo da temperatura ambiente do Brasil.` | BAIXA |
| 3 | app/src/onboarding/conteudo.ts | j7.porque (IDX_J7) | `Espumante se serve bem gelado, entre 6 e 10 graus. É a regra que abre qualquer encontro.` | `Espumante se serve bem gelado, entre 6 e 8 graus. É a regra que abre qualquer encontro.` | MEDIA |
| 4 | app/src/onboarding/conteudo.ts | comentário linha 31 (acima de j1) | `Branco serve a 8-12 graus; tinto fresco, 12-16. */` | `Branco serve a 8-12 graus; tinto fresco, 12-18 (leves no lado frio). */` | BAIXA |
| 5 | app/src/onboarding/conteudo.ts | j5Mercado.pergunta + j5Mercado.opcoes[1] | `'No mercado, o rótulo diz seco. O que esperar do gole?'` ... `'Um vinho que resseca a língua'` | pergunta: `'No mercado, o rótulo diz seco. O que essa palavra conta sobre o vinho?'`; opção: `'Que ele resseca a língua'` | MEDIA |
| 6 | app/src/onboarding/conteudo.ts | j5Outros.pergunta + j5Outros.opcoes[1] | `'Uma garrafa diz seco no rótulo. O que esperar do primeiro gole?'` ... `'Um vinho que resseca a língua'` | pergunta: `'Uma garrafa diz seco no rótulo. O que essa palavra conta sobre o vinho?'`; opção: `'Que ele resseca a língua'` | MEDIA |
| 7 | app/src/content/unidade-1/licao-01.json | exercicios[2] (swipe) carta índice 4, campo porque | `Tanino é natural da uva e da madeira. Ninguém precisa adicionar nada.` | `Tanino não é aroma: é um composto natural da casca, da semente e da madeira, sentido no tato.` | BAIXA |
| 8 | app/src/content/unidade-1/licao-04.json | exercicios[0] (mc café), campo erroMsg | `Quase. Açúcar muda a doçura e mais nada. Guarde essa ideia: ela vale para o vinho inteiro.` | `Quase. No café, açúcar mexe na doçura, não na cafeína nem na temperatura.` | MEDIA |
| 9 | app/src/content/unidade-1/licao-04.json | exercicios[0] (mc café), campo porque | `No vinho funciona igual: seco e suave são o mesmo universo, mudando a quantidade de açúcar.` | `No vinho, seco e suave são o mesmo universo mudando o açúcar, que em dose alta também soma corpo.` | MEDIA |
| 10 | app/src/content/unidade-1/licao-04.json | exercicios[1] (mc origem da doçura), campo porque | `Doçura é açúcar residual: o açúcar que a fermentação não transformou em álcool.` | `Na maior parte do mundo, doçura é açúcar residual da própria uva; no Brasil, parte dos suaves também recebe açúcar depois da fermentação.` | MEDIA |
| 11 | app/src/content/unidade-1/licao-04.json | exercicios[5] (ordenar), itens[2] | `"Colheita tardia bem doce"` | `"Colheita tardia, néctar de sobremesa"` | BAIXA |
| 12 | app/src/content/unidade-1/licao-05.json | exercicios[5] (duasverdades), afirmacoes[1] | `Os 4 eixos são independentes e se combinam em qualquer arranjo` | `Os 4 eixos variam em separado, mas interagem na boca: a acidez disfarça a doçura` | ALTA |
| 13 | app/src/content/unidade-3/licao-02.json | exercicios[2] (swipe) carta índice 1, campo texto | `"Toque de manteiga"` | `"Baunilha com toque de manteiga"` | MEDIA |
| 14 | app/src/content/unidade-3/licao-04.json | fichaCanonica[0] | `As bolhas do espumante nascem de uma segunda fermentação: leveduras transformam açúcar em álcool e gás carbônico, e o gás fica preso no líquido.` | `Na maioria dos espumantes, as bolhas nascem de uma segunda fermentação: leveduras transformam açúcar em álcool e gás carbônico, e o gás fica preso no líquido. O moscatel é a exceção charmosa, de uma única fermentação interrompida ainda doce.` | MEDIA |
| 15 | app/src/content/unidade-3/licao-04.json | exercicios[3] (swipe) carta índice 2, campo texto | `"As bolhas nascem de uma segunda fermentação"` | `"Na maioria dos espumantes, as bolhas nascem de uma segunda fermentação"` | MEDIA |
| 16 | app/src/content/unidade-3/licao-04.json | fichaCanonica[2] | `Só pode se chamar Champagne o espumante feito na região de Champagne, na França; fora dela, o vinho com bolhas atende por espumante, Cava, Prosecco e outros nomes.` | `Pelas regras internacionais de indicação de origem, só o espumante da região de Champagne, na França, usa esse nome; fora dela, o vinho com bolhas atende por espumante, Cava, Prosecco e outros nomes.` | MEDIA |
| 17 | app/src/content/unidade-3/licao-04.json | exercicios[8] (mc d3), pergunta | `Por que um espumante de fora da região de Champagne não pode usar esse nome?` | `Por que, pelas regras de origem, um espumante de fora da região de Champagne usa outro nome?` | MEDIA |
| 18 | app/src/content/unidade-4/licao-02.json | exercicios[5] (swipe) carta índice 0, campo texto | `"Seco quer dizer até 4 gramas de açúcar por litro"` | `"No vinho tranquilo, seco quer dizer até 4 gramas de açúcar por litro"` | ALTA |
| 19 | app/src/content/unidade-4/licao-02.json | exercicios[5] (swipe) carta índice 0, campo porque | `É o número da lei brasileira: seco mora coladinho no zero.` | `É o número da lei para o vinho tranquilo. No espumante, seco mora bem mais à frente, entre 15 e 20 gramas.` | ALTA |
| 20 | app/src/content/unidade-4/licao-02.json | exercicios[5] (swipe) carta índice 4, campo porque | `Seco fala só de açúcar; o corpo é outra régua, e as duas se combinam livremente.` | `Seco fala só de açúcar; o corpo é outra régua, e as duas variam em separado.` | BAIXA |
| 21 | app/src/content/unidade-4/licao-04.json | exercicios[2] (swipe) carta índice 3, campo texto | `"Estoque com temperatura estável o ano inteiro"` | `"Estoque fresco, com temperatura estável o ano inteiro"` | MEDIA |
| 22 | app/src/content/unidade-4/licao-05.json | fichaCanonica[0] | `Tintos tendem a mostrar o melhor levemente frescos, em torno de 14 a 18 graus, com os mais leves perto dos 14 e os encorpados perto dos 18; brancos vão bem entre cerca de 8 e 12 graus; espumantes pedem mais frio, por volta de 6 a 8 graus.` | `Tintos tendem a mostrar o melhor levemente frescos, em torno de 12 a 18 graus, com os mais leves perto dos 12 a 14 e os encorpados perto dos 18; brancos vão bem entre cerca de 8 e 12 graus, e os leves bem ácidos descem a 7; espumantes pedem mais frio, por volta de 6 a 8 graus.` | MEDIA |
| 23 | app/src/content/unidade-4/licao-05.json | exercicios[1] (mc erro do tinto), porque | `A sala brasileira passa fácil dos 25 graus, e o tinto fica melhor levemente fresco, entre 14 e 18.` | `A sala brasileira passa fácil dos 25 graus, e o tinto fica melhor levemente fresco, entre 12 e 18, conforme o corpo.` | BAIXA |
| 24 | app/src/content/unidade-4/licao-05.json | recap | `Tinto levemente fresco entre 14 e 18 graus, branco entre 8 e 12, espumante de 6 a 8, e a geladeira é a ponte entre o calor do Brasil e a taça certa.` | `Tinto levemente fresco entre 12 e 18 graus conforme o corpo, branco entre 8 e 12, espumante de 6 a 8, e a geladeira é a ponte entre o calor do Brasil e a taça certa.` | BAIXA |
| 25 | app/src/content/unidade-4/licao-05.json | voceAgoraSabe[0] | `Você sabe as três faixas de serviço: tinto 14 a 18, branco 8 a 12, espumante 6 a 8 graus` | `Você sabe as três faixas de serviço: tinto 12 a 18 (leves no lado frio), branco 8 a 12, espumante 6 a 8 graus` | MEDIA |
| 26 | app/src/content/unidade-5/licao-01.json | exercicios[2] (swipe) carta índice 3, campo texto | `"Queijo curado intenso com vinho bem levinho"` | `"Queijo curado intenso com vinho seco bem levinho"` | BAIXA |
| 27 | app/src/content/unidade-5/licao-03.json | exercicios[1] (mc), erroMsg | `Quase. Quem corta gordura é acidez: branco fresco ou espumante, o limão em forma de taça.` | `Quase. Quem faz o papel do limão é a acidez: branco fresco ou espumante. O tanino também limpa gordura, mas esse é o time do churrasco.` | MEDIA |
| 28 | app/src/content/unidade-5/licao-03.json | exercicios[6] (mc calibrar), pergunta | `Jantar com fritura e um vinho de acidez baixa na taça. O que acontece?` | `Jantar com fritura e um vinho mole, de acidez baixa e pouco tanino, na taça. O que acontece?` | MEDIA |
| 29 | app/src/content/unidade-5/licao-03.json | exercicios[6] (mc calibrar), porque | `É a acidez que varre a gordura; sem ela, cada garfada empilha peso na boca.` | `Na fritura, quem varre a gordura é a acidez; sem ela nem tanino, cada garfada empilha peso na boca.` | MEDIA |
| 30 | app/src/content/unidade-5/licao-04.json | exercicios[8] (mc fechamento), pergunta | `Pra fechar: a sobremesa nunca pode ser mais doce que...` | `Pra fechar: pra sobremesa e vinho brilharem juntos, quem não deve ganhar no açúcar é...` | BAIXA |
| 31 | app/src/content/unidade-5/licao-04.json | exercicios[8] (mc fechamento), okMsg | `Fechou. Doce com doce, e a sobremesa nunca por cima.` | `Fechou. Doce com doce, e a sobremesa de preferência não passa o vinho.` | BAIXA |
| 32 | app/src/content/unidade-6/licao-05.json | hook | `E o Uruguai transformou a uva mais tânica do mundo em programa de domingo.` | `E o Uruguai transformou uma das uvas mais tânicas do mundo em programa de domingo.` | MEDIA |
| 33 | app/src/content/unidade-6/licao-05.json | exercicios[3] (swipe) carta índice 1, campo porque | `A uva mais tânica com a carne mais gorda: gordura ama tanino.` | `Uma das uvas mais tânicas com uma das carnes mais gordas: gordura ama tanino.` | MEDIA |
| 34 | app/src/content/unidade-6/licao-05.json | exercicios[7] (mc d3), erroMsg | `Quase. Carne gorda na brasa pede tanino à altura, e nenhuma uva tem mais tanino que a Tannat.` | `Quase. Carne gorda na brasa pede tanino à altura, e pouquíssimas uvas têm mais tanino que a Tannat.` | MEDIA |
| 35 | app/src/content/unidade-6/licao-05.json | recap | `o Uruguai transformou a Tannat, a uva mais tânica, na rainha da parrilla.` | `o Uruguai transformou a Tannat, das uvas mais tânicas do mundo, na rainha da parrilla.` | MEDIA |
| 36 | app/src/content/pratica/banco-pratica.json + data/vinhos_clean.csv | pipeline: país "EUA" inválido | exercícios `de-onde-vem-*` com `pais=EUA` para vinhos brasileiros (Casa Perini, Lidio Carraro Faces do Brasil, Casa Valduga, Aurora, Almadén, Salton) e Brasil como distrator | Corrigir país por produtor na origem (CSV) ou bloquear no gerador vinhos com marcador de origem no nome cujo país != Brasil; regenerar o banco. ~20 exercícios afetados | ALTA |
| 37 | app/src/content/pratica/banco-pratica.json + data/vinhos_clean.csv | pipeline: linha não-vinho e ids trocados | id `mais-encorpado-docura-0988d894d4-1fff9d8b4c` opção 0 = `Poltrona Decorativa - Valentina - Bianchi Móveis`; vinhoIds `v10-ml-0efc143b9ca3` (Macaw Frisante) e `v10-ml-34796ac5e8d6` (Poltrona) trocados entre si | Remover não-vinhos da view estrita (filtro is_vinho/categoria); levar snapshot do nome junto do id ao gerar; varrer nome/categoria por `Móveis|Poltrona|Decorativa`; regenerar | ALTA |
| 38 | app/src/content/pratica/banco-pratica.json | template `intruso-uva`: enunciado/regra | enunciados do tipo `Três destas uvas dão vinho tinto` / `...são uvas de vinho tinto` com Pinot Noir, Grenache, Cinsault ou Pinot Grigio como não-intrusas | Trocar o enunciado para falar da CASTA, não do vinho: `Três destas são uvas de casta tinta` / `...é uva de casta branca`; e/ou excluir castas dual-color (Pinot Noir, Grenache, Cinsault, Pinot Grigio) das posições não-intrusas no gerador | MEDIA |
| 39 | app/src/content/pratica/desafios.json | chip vs opção de preço (desafio-09, -15, -27, -28, -34) | card mostra `"faixaPreco": "R$ 40 a 80"` e a opção correta diz `Entre R$ 40 e R$ 90` | Unificar os dois sistemas de bucket: usar os mesmos cortes (40/90/200) no metadado do card e nas opções. Ajuste de gerador/pipeline | BAIXA |

---

## Notas de execução por bloco

- FTUE (itens 1 a 6): `conteudo.ts` é a porta de entrada e o ponto mais visível.
  Itens 5 e 6 ancoram a pergunta na palavra ("seco fala de açúcar"), tornando o
  distrator "resseca a língua" inequivocamente falso, sem depender de o leigo já
  conhecer tanino. Manter as duas variantes (j5Mercado e j5Outros) idênticas no padrão.
- Temperatura (itens 1-4, 22-25): todos apontam para o canon tinto 12 a 18,
  branco 8 a 12 (leve a 7), espumante 6 a 8. Conferir também `licao-03/licao-01`
  da u3 (branco 7 a 10) que JÁ está coerente com o canon (branco leve desce a 7):
  não precisa de edição, está harmonizado pelo item 22.
- Bolhas e Champagne (itens 14-17): o item 14 vira gancho narrativo para a u3-l5
  (moscatel). O item 17 reescreve a pergunta para não afirmar "não pode usar".
- Tannat (itens 32-35): quatro ocorrências no mesmo arquivo u6-l5, todas de
  "a mais tânica" para "entre/uma das mais tânicas" (verificado: Sagrantino disputa
  o topo). A ficha canônica do arquivo já diz "entre as mais"; as edições alinham o
  resto do arquivo à própria ficha.
- Pipeline (itens 36-39): não são edições de copy; são correções de dados/gerador.
  Devem ser feitas na origem (CSV + fábrica) e o banco regenerado. Detalhe em
  `canon-fatos.md` seção 5.

## Achados REJEITADOS (pedantismo)

- u3-l1 exercicios[8] distrator "Vinho doce de sobremesa": rejeitado. O enunciado
  pede "branco que refresque DE VERDADE"; doce de sobremesa evoca Porto/Sauternes,
  não Moscato, e o app define refrescância como acidez + leveza. Defesa fraca demais.
- u3-l5 exercicios[3] (Farroupilha, distratores Curitiba/Petrolina): rejeitado como
  erro factual. O filtro "Serra Gaúcha" no enunciado é didático e o gabarito está
  certo; trocar distratores é polimento opcional, não correção de consistência.
- desafio-17 (espumante rosé + ostras) e harmoniza Graham's N5: rejeitados. Gabaritos
  corretos, sem contradição factual; eram apenas alertas de cobertura no relatório.
