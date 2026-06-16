Revisão concluída. Li os 10 JSONs das unidades 5 e 6 e o FTUE completo, e cruzei com as faixas de temperatura e claims de tanino ensinados em u2-l4, u2-l5, u3-l1, u3-l4 e u4-l5 (via grep) para validar contradições.

## ACHADOS

**1.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\conteudo.ts`
- idOuIndiceDoExercicio: `fichaCanonica[0]` (linha 198) + `j7.porque` (linha 175, IDX_J7)
- trechoProblematico: "Vinhos brancos e espumantes são servidos bem gelados, entre 6 e 10 graus" / "Espumante se serve bem gelado, entre 6 e 10 graus"
- problema: (b) contradição interna
- porQueEDefensavel: u4-l5 (lição canônica de temperatura de serviço) ensina e TESTA as "três faixas": espumante 6 a 8, branco 8 a 12 (duasverdades com "Branco vai bem entre cerca de 8 e 12 graus" como verdade; voceAgoraSabe lista as três faixas). u3-l4 também fixa espumante "6 a 8". O FTUE, porta de entrada, entrega "6 a 10" tanto para espumante quanto para branco: para espumante o teto diverge (10 vs 8) e para branco o piso diverge (6 vs 8). Quem decorar o número do FTUE chega "errado" na u4-l5.
- gravidade: MEDIA (nenhuma resposta vira, mas é divergência numérica entre fichas canônicas, no ponto mais visível do app)
- correcaoSugerida: alinhar o FTUE ao padrão da u4-l5: ficha "Espumantes vão bem gelados, por volta de 6 a 8 graus; brancos, entre 8 e 12" e j7.porque "entre 6 e 8 graus". Se quiser manter uma faixa única e simples no FTUE, usar "bem gelados, abaixo de uns 10 graus" (sem piso) para não conflitar.

**2.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\conteudo.ts`
- idOuIndiceDoExercicio: `fichaCanonica[1]` (linha 199) + comentário da J1 (linha 31)
- trechoProblematico: "Vinhos tintos são servidos frescos, entre 14 e 18 graus" (ficha) vs comentário no código "tinto fresco, 12-16" vs u2-l4 "tintos leves... em torno de 12 a 16 graus"
- problema: (b) contradição interna (piso da faixa)
- porQueEDefensavel: u2-l4 ensina tinto leve a 12-16 (e o próprio porque interno dela diz "entre 12 e 14"). Pela ficha do FTUE, um Pinot a 13 graus estaria fora da faixa; pela u2-l4, está perfeito. O comentário no próprio arquivo (12-16) já diverge da ficha que ele documenta, sinal de drift.
- gravidade: BAIXA (faixas aproximadas e sobrepostas; nenhum exercício vira)
- correcaoSugerida: na ficha do FTUE: "entre 12 e 18 graus, com os leves no lado mais frio da faixa" (cobre u2-l4 e u4-l5), e corrigir o comentário da linha 31 para citar a mesma faixa da ficha.

**3.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\conteudo.ts`
- idOuIndiceDoExercicio: `j5Mercado` (exercicios[3]) e variante `j5Outros`
- trechoProblematico: pergunta "O rótulo diz seco. O que esperar do gole?" com distrator "Um vinho que resseca a língua"
- problema: (d) enunciado ambíguo, com (a) latente
- porQueEDefensavel: a pergunta pede uma EXPECTATIVA sobre o gole, não o significado da palavra. Se a garrafa for um tinto seco tânico (caso comum no mercado), "resseca a língua" é literalmente o que acontece, pelo mecanismo que o próprio app ensina depois (u5-l2: tanino resseca a boca; régua do tanino). Um aluno que voltar ao FTUE depois da trilha pode escolher o distrator estando certo sobre o gole e errado só sobre o rótulo. É exatamente a estrutura do caso-padrão J1: a resposta "errada" é verdadeira sob leitura razoável.
- gravidade: MEDIA (no FTUE o leigo ainda não conhece tanino, mas a porta de entrada não deveria depender disso)
- correcaoSugerida: ancorar a pergunta na palavra, não na sensação: "No mercado, o rótulo diz seco. Essa palavra conta o quê sobre o vinho?" com opções "Que quase não sobrou açúcar nele" / "Que ele resseca a língua" / "Que ele está perto de vencer". Assim o distrator vira inequivocamente falso (seco fala de açúcar, não de adstringência).

**4.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-5\licao-01.json`
- idOuIndiceDoExercicio: exercicios[2] (swipe), carta 4 "Queijo curado intenso com vinho bem levinho" (verdade: false)
- trechoProblematico: a carta dá o par como sempre falso; o porque diz "O queijo engole o vinho, que desaparece da taça"
- problema: (a) segunda leitura defensável via regra que o próprio app ensina
- porQueEDefensavel: "vinho bem levinho" descreve corpo, e um moscatel é leve de corpo e doce. Pela regra sal-com-doce que a u5-l4 ensina três lições depois (parmesão com mel é dado como par clássico; gorgonzola com Porto idem), queijo curado salgado com vinho doce leve é par real (Moscato com queijos curados é serviço corrente). A carta só é inequívoca se o vinho for seco.
- gravidade: BAIXA (no contexto da lição de peso a intenção é clara, e a leitura alternativa exige escolher um vinho doce)
- correcaoSugerida: trocar o texto da carta para "Queijo curado intenso com vinho seco bem levinho", fechando a brecha do sal-doce.

**5.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-5\licao-03.json`
- idOuIndiceDoExercicio: exercicios[1] (mc dif1, "Qual vinho faz o papel do limão...") — campo erroMsg
- trechoProblematico: "Quem corta gordura é acidez: branco fresco ou espumante..."
- problema: (b) + (c) absoluto que contradiz a lição anterior
- porQueEDefensavel: a u5-l2, ensinada imediatamente antes, afirma na ficha canônica que "o tanino limpa a gordura da boca e prepara o próximo garfo". Dizer "quem corta gordura É acidez" apaga o segundo mecanismo que o app acabou de ensinar; um aluno atento percebe a inconsistência.
- gravidade: MEDIA (copy de feedback, não vira resposta; mas é contradição frontal de mecanismo entre lições vizinhas)
- correcaoSugerida: "Quem faz o papel do limão é a acidez: branco fresco ou espumante. (O tanino também limpa gordura, mas esse é o time do churrasco.)" ou simplesmente "Quem faz o papel do limão é a acidez".

**6.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-5\licao-03.json`
- idOuIndiceDoExercicio: exercicios[6] (mc dif3 calibrar, "Jantar com fritura e um vinho de acidez baixa na taça")
- trechoProblematico: resposta correta "A gordura forra a boca e o vinho não dá conta de limpar" + porque "É a acidez que varre a gordura; sem ela, cada garfada empilha peso na boca"
- problema: (d) + (b)
- porQueEDefensavel: o enunciado não diz nada sobre o tanino do vinho. Um tinto de acidez baixa e tanino firme (perfil que a u6-l3 atribui aos tintos de sol) LIMPARIA a gordura pelo tanino, segundo a própria u5-l2. Os distratores são piada ("fritura fica mais crocante", "vinho ganha bolhas"), então a resposta não vira, mas o porque generaliza um mecanismo que o app ensina como duplo.
- gravidade: MEDIA
- correcaoSugerida: especificar o vinho no enunciado: "um vinho mole, de acidez baixa e pouco tanino" e ajustar o porque: "Na fritura, quem varre a gordura é a acidez; sem ela nem tanino, cada garfada empilha peso na boca."

**7.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-5\licao-04.json`
- idOuIndiceDoExercicio: exercicios[8] (mc dif1 de fechamento)
- trechoProblematico: "Pra fechar: a sobremesa nunca pode ser mais doce que... O vinho na taça" + okMsg "a sobremesa nunca por cima"
- problema: (c) absolutismo indevido
- porQueEDefensavel: a própria ficha desta lição formula como tendência ("se a sobremesa é mais doce que o vinho, o vinho PARECE magro e azedo") e a u5-l1 ensina como mentira a ideia de tabela oficial ("harmonização é diretriz, e o seu gosto faz parte da conta"). "Nunca pode" transforma diretriz em proibição, o tipo de regra-absoluta que o app mesmo desmonta.
- gravidade: BAIXA (imprecisão de copy; a regra em si está certa)
- correcaoSugerida: "Pra fechar: pra sobremesa e vinho brilharem juntos, quem nunca deve ganhar no açúcar é..." ou trocar "nunca pode ser" por "não deve ser".

**8.**
- arquivo: `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\unidade-6\licao-05.json`
- idOuIndiceDoExercicio: hook (linha 7), exercicios[3] swipe carta 2 (porque, linha 71), exercicios[7] (mc dif3, erroMsg linha 142), recap (linha 161)
- trechoProblematico: "a uva mais tânica do mundo" (hook, swipe, recap) e "nenhuma uva tem mais tanino que a Tannat" (erroMsg)
- problema: (b) + (c) — promoção de "entre as mais" para "A mais"
- porQueEDefensavel: a ficha canônica DESTE MESMO arquivo diz "está entre as mais tânicas do mundo", igual a u2-l5 e u5-l2 (todas as fichas usam "entre as"). O superlativo absoluto contradiz a ficha revisada (regra do CLAUDE.md: fatos só da ficha canônica) e é tecnicamente contestável (Sagrantino, por exemplo, disputa o topo em medições de polifenóis). Quatro ocorrências no mesmo arquivo.
- gravidade: MEDIA (não vira resposta de exercício, mas é fato afirmado mais forte do que a ficha autoriza, em 4 pontos)
- correcaoSugerida: hook: "a uva entre as mais tânicas do mundo em programa de domingo"; swipe porque: "Uma das uvas mais tânicas com uma das carnes mais gordas" (mesma fórmula já usada em u5-l2); erroMsg: "...e pouquíssimas uvas têm mais tanino que a Tannat"; recap: "a Tannat, das uvas mais tânicas do mundo".

## LOTES LIMPOS

Passaram pela revisão adversarial sem achado: `unidade-5\licao-02.json`, `unidade-5\licao-05.json`, `unidade-6\licao-01.json`, `unidade-6\licao-02.json`, `unidade-6\licao-03.json`, `unidade-6\licao-04.json`. Verificações que fiz e descartei de propósito: ordenar de tanino da u6-l5 (índices [1,2,3,0] corretos e Carmenère < Cabernet bate com a ficha); "duas safras por ano" da u6-l3 (hedge "quase nenhuma outra" cobre Índia/Tailândia); "primeira Denominação de Origem" do Vale dos Vinhedos (correto, 2012); IP da Campanha em 2020 (correto); Torrontés "tipicamente seca" (hedge cobre colheita tardia); Malbec como "tinto tânico" em u5-l5 (defensável no nível do app e ancorado na ficha); brut vs moscatel na sobremesa (posição minoritária de contraste existe, mas a regra doce-com-doce é canônica no app e no mainstream, distrator não é defensável dentro do currículo).

## NUANCES NOVAS PARA O MAPA

- Faixas de serviço são ensinadas como: espumante 6-8 (u3-l4, u4-l5), branco 8-12 (u4-l5; branco leve 7-10 em u3-l1), tinto 14-18 com leves a 12-16 (u4-l5 vs u2-l4) — qualquer copy nova deve usar esses números, e o FTUE hoje diverge (achados 1 e 2).
- TANTO acidez QUANTO tanino limpam gordura (u5-l2 e u5-l3); copy que atribuir o papel a um só mecanismo "sempre" contradiz a outra lição (achados 5 e 6).
- Tannat é "ENTRE as mais tânicas", nunca "A mais tânica" (todas as fichas; achado 8).
