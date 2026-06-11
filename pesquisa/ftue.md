# Onboarding estilo jogo para o Treine seu Paladar
## Pesquisa de FTUE e blueprint passo a passo

Data: junho de 2026. Escopo: substituir o onboarding conversacional de 9 passos por um onboarding guiado, na pratica, jogando de verdade desde o primeiro toque, com cadastro adiado para depois do primeiro aha.

---

## 1. Por que matar o onboarding de 9 passos: os dados de abandono

O argumento quantitativo e brutal e suficiente sozinho:

- O app movel medio perde 77% dos seus DAUs nos primeiros 3 dias apos a instalacao, e 90% em 30 dias (dados da Quettra sobre milhares de apps Android, publicados por Andrew Chen). A conclusao do proprio Chen: a janela para provar valor e minuscula, e os melhores apps vencem exatamente nos primeiros dias. Fonte: https://andrewchen.com/new-data-shows-why-losing-80-of-your-mobile-users-is-normal-and-that-the-best-apps-do-much-better/
- Para o nosso caso (82% Android, publico 35-54, iniciante), isso significa que cada tela entre o primeiro toque e a primeira pergunta real da licao e um vazamento no funil. Nove passos de conversa antes do jogo e nove oportunidades de abandono antes de qualquer valor entregue.
- A propria Gina Gotthilf (ex-VP de Growth do Duolingo) formula a regra: "a cada passo, voce tem o potencial de perder usuarios", e por isso a primeira soft wall deve vir o mais cedo possivel depois do momento de valor, nunca antes. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

Implicacao direta: o teste real do FTUE nao e "completou o tutorial", e D1. Com gates de 2000/3500/5000 usuarios e metas de D30 de 10/15/30%, nao ha folga para queimar instalacoes em formulario.

---

## 2. O caso Duolingo: licao antes do cadastro (o numero exato)

Este e o precedente mais forte e mais documentado, vindo de quem viveu o experimento:

**O experimento de delayed signup.** O Duolingo via "uma queda enorme" entre download e cadastro. A hipotese contraintuitiva: deixar a pessoa experimentar o produto antes de pedir conta. Resultado, nas palavras de Gina Gotthilf: "Simplesmente mover a tela de cadastro alguns passos para tras levou a cerca de 20% de aumento nos DAUs." Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

**Os refinamentos que vieram depois (todos citaveis):**

1. **Botao de recusa neutro.** A tela de cadastro tinha um botao vermelho grande escrito "Discard my progress" (descartar meu progresso). Trocar por um botao discreto "Later" (depois) moveu o ponteiro de novo. Licao para nos: a recusa nunca pode ser punitiva nem chamativa.
2. **Soft walls e hard wall.** O Duolingo opera com 3 soft walls (telas opcionais de cadastro com "Later") e uma hard wall apos varias licoes. Detalhe critico de Gotthilf: sem as soft walls preparando o terreno, a hard wall performa significativamente pior. A otimizacao do conjunto soft/hard walls rendeu +8,2% de DAU adicionais, tres anos depois do teste original, com base de usuarios muito maior.
3. **A receita dela, literal:** estime o momento em que o usuario descobre o valor do produto, coloque a primeira soft wall logo depois desse ponto, outra apos algumas interacoes, depois a hard wall, e analise os vazamentos em cada parede. "Pense nas soft walls como dominos enfileirados."

Tudo na mesma fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

**Confirmacao independente do padrao (gradual engagement).** A analise da Appcues documenta o fluxo: o onboarding do Duolingo "comeca com o produto e termina com criacao de conta opcional", o usuario faz exercicios de traducao antes de qualquer cadastro, e os prompts de signup aparecem "em momentos logicos da jornada", tipicamente apos completar uma licao. Recursos sociais (leaderboard) ficam atras do cadastro, mas o valor central fica acessivel anonimo. Fonte: https://goodux.appcues.com/blog/duolingo-user-onboarding

**Bonus de contexto (motor de retencao pos-onboarding).** A historia contada por Jorge Mazal (ex-CPO do Duolingo) na newsletter do Lenny: o trabalho em streaks, leaderboards e notificacoes tirou a empresa de crescimento de um digito para DAU 4,5x em 4 anos, com churn reduzido em 40%; leaderboards sozinhos aumentaram o tempo de aprendizado em 17%. Fonte: https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth

**Outros numeros uteis do mesmo arsenal Duolingo (First Round):** badges renderam +2,4% DAU e +4,5% em licoes completadas; o mascote Duo atuando como coach dentro da licao, com copy de growth mindset ("seu esforco esta valendo a pena" venceu "voce e incrivel"), rendeu +7,2% de retencao D14. Isso valida exatamente o papel que queremos para o nosso mascote: ensinar e encorajar durante a licao, nao apresentar slides antes dela. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

---

## 3. Tutorial in-action: o que os classicos ensinam

### 3.1 Plants vs Zombies (George Fan, GDC 2012): as 10 regras

A palestra "How I Got My Mom to Play Through Plants vs. Zombies" e o manual canonico de tutorial invisivel. As 10 dicas, resumidas pela Game Developer (fonte: https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan e video original em https://www.gdcvault.com/play/1015541/How-I-Got-My-Mom):

1. **Misture o tutorial ao jogo.** "Eu faco questao de nunca chamar nenhuma secao do meu jogo de tutorial." Ensinar sem que a pessoa perceba que esta sendo ensinada.
2. **Fazer e melhor que ler.** A primeira fase de PvZ ensina que plantas atiram para a direita e zumbis andam para a esquerda deixando o jogador ver, nao explicando.
3. **Espalhe o ensino das mecanicas.** Dinheiro so aparece depois de 10 fases; o modo mais complexo so perto do fim. "Conforme eu jogo e fico investido, minha disposicao para aprender coisas novas aumenta."
4. **Basta fazer uma vez.** Uma moeda cai com uma seta gigante em cima; um clique e o jogador entendeu para sempre. Inspiracao declarada: Fisher Price, apertar o objeto brilhante.
5. **Maximo de 8 palavras na tela por vez.** Pensar como um "caveman eloquente".
6. **Mensagens que nao interrompem.** Nada de pausar o jogo para mostrar texto.
7. **Mensagens adaptativas.** Dica so aparece para quem esta errando; quem acerta nunca ve, e se sente inteligente.
8. **Nao crie ruido.** Cada mensagem irrelevante e o menino que gritava lobo: o jogador desliga.
9. **Ensine pelo visual.** O Peashooter tem uma boca gigante que atira; o personagem comunica sua funcao.
10. **Aproveite o que a pessoa ja sabe.** Plantas nao andam, zumbis sao lentos, moedas valem dinheiro. Conhecimento do mundo real reduz o que precisa ser ensinado.

### 3.2 Super Mario Bros 1-1: o level e o tutorial

A fase 1-1 ensina correr, pular, pisar em inimigo, blocos, cogumelo e cano sem uma palavra de texto: o primeiro Goomba vem na direcao do jogador num espaco plano e seguro, forcando a descoberta do pulo; os blocos suspensos convidam ao toque; o cogumelo vem em sua direcao de um jeito que e dificil nao pegar, ensinando que power-up e bom. O proprio Miyamoto explica essas decisoes deliberadas no video da Eurogamer sobre a criacao da 1-1. Fontes: https://www.eurogamer.net/video-miyamoto-on-how-nintendo-made-marios-most-iconic-level e analise detalhada em https://medium.com/swlh/the-perfect-game-tutorial-analyzing-super-marios-level-design-92f08c28bdf7

Traducao para o nosso app: a "geografia" da licao 1 deve tornar o acerto inicial quase inevitavel (pergunta 1 impossivel de errar), criando confianca antes do primeiro desafio real.

### 3.3 Portal: uma mecanica por camara, em sequencia controlada

Portal introduz uma unica ideia por test chamber, deixa o jogador provar que entendeu e so entao compoe ideias. E o padrao de referencia para ensinar mecanica desconhecida de forma natural. Fonte (analise Design Club): https://www.youtube.com/watch?v=Q_AsF3Rfw8w

### 3.4 Extra Credits: os primeiros 5 minutos

O episodio "Tutorials 101 - How to Design a Good Game Tutorial" resume: os primeiros cinco minutos fazem ou quebram o jogo; tutoriais devem ser jogaveis, nao lidos, e devem sumir para quem nao precisa deles. Fonte: https://www.youtube.com/watch?v=BCPcn-Q5nKE

---

## 4. Progressive disclosure e contextual teaching

Dois conceitos irmaos, um da UX classica e um do game design:

- **Progressive disclosure (NN/g):** adiar recursos avancados ou raramente usados para um segundo momento torna sistemas mais faceis de aprender e menos propensos a erro. Mostrar tudo de uma vez sobrecarrega o iniciante. Fonte: https://www.nngroup.com/articles/progressive-disclosure/
- **Contextual teaching (game design):** "introduza mecanicas exatamente quando o jogador precisa delas, nao antes. Se o jogo tem pulo, crie uma situacao em que pular e necessario." Tutoriais em bloco no inicio sao descartados pela memoria; a mecanica ensinada no momento do uso gruda. Fontes: https://gdevelop.io/blog/improve-game-tutorials e o principio repetido pelo pesquisador de games UX Lennart Nacke: "nao explique crafting no tutorial, explique quando o jogador encontrar materiais" em https://www.linkedin.com/pulse/7-psychology-principles-every-game-designer-learns-too-lennart-nacke-kbvsc
- A literatura de FTUE para jogos F2P converge: tutorial curto, interativo, com recompensa imediata, e o resto ensinado em contexto ao longo das primeiras sessoes. Fonte: https://www.gameanalytics.com/blog/tips-for-a-great-first-time-user-experience-ftue-in-f2p-games

Aplicado as nossas mecanicas: vidas, streak, XP, cristais, liga e badges NAO sao apresentados no inicio. Cada um e revelado pelo mascote no primeiro momento em que se torna relevante (detalhado no blueprint).

---

## 5. Personalizacao sem virar formulario

O risco de embutir perguntas de objetivo e parecer cadastro disfarçado. O que a evidencia mostra:

- O Duolingo pergunta meta diaria e "Por que voce esta aprendendo um idioma?" logo no inicio, e a Appcues documenta o efeito duplo: dar uma meta aumenta motivacao e retencao (completion bias e goal gradient effect), e a resposta permite personalizar a experiencia. O ponto chave: sao 2-3 toques visuais com o mascote reagindo, nunca campos de texto. Fonte: https://goodux.appcues.com/blog/duolingo-user-onboarding
- Goal-setting alimenta o sistema de streak e da legitimidade as notificacoes ("voce tem uma meta, complete sua meta hoje" em vez de "volte para o app"), como descrito por Gotthilf. O timing otimo de notificacao que eles acharam: 23,5 horas apos o ultimo uso. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/
- O proprio blog do Duolingo confirma o streak atrelado a meta como mecanismo central de compromisso de longo prazo. Fonte: https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/

**Regra de design:** a pergunta de objetivo deve (a) parecer uma jogada do jogo, com cartas visuais grandes e resposta de 1 toque; (b) ter payoff imediato e visivel (o mascote reage e a proxima pergunta muda por causa da resposta); (c) ser no maximo 2 perguntas dentro da licao 1. Se a resposta nao muda nada que o usuario percebe, a pergunta nao merece existir.

---

## 6. BLUEPRINT: o onboarding ideal do Treine seu Paladar

Persona de referencia: 35-54 anos, iniciante em vinho, Android, abriu o PWA por curiosidade vinda de anuncio. Ela tem 10 segundos de paciencia e medo de parecer ignorante. O onboarding inteiro e a Licao 1, e a Licao 1 e o tutorial invisivel.

### Fase 0: do toque a primeira pergunta (0 a 10 segundos)

1. **Splash unico, 1 tela, 1 botao.** Logo, uma frase de valor ("Aprenda a confiar no seu paladar") e um unico botao primario: "Comecar". Nada de carrossel de 3 telas, nada de login social, nada de pedir notificacao. Justificativa: cada passo perde usuarios (Gotthilf, First Round) e 77% dos DAUs somem em 3 dias (Andrew Chen).
2. **Toque em Comecar abre direto a pergunta 1 da Licao 1 real.** Sem tela de "escolha sua trilha", sem explicacao de regras. Meta tecnica: menos de 10 segundos entre abrir o app e estar respondendo. Pre-carregar a Licao 1 no bundle do PWA para funcionar mesmo em rede ruim (realidade Android Brasilia/Goiania).
3. **Usuario anonimo com ID local.** Todo progresso (XP, respostas, streak) vive em localStorage/IndexedDB e e migrado para a conta no cadastro. E o que torna o deferred signup possivel num PWA.

### Fase 1: Licao 1, o tutorial que nao se chama tutorial (60 a 120 segundos)

Estrutura de 7 jogadas. Principios de PvZ aplicados: fazer em vez de ler, maximo 8 palavras por mensagem do mascote, uma ideia por jogada, acerto inicial garantido.

**Jogada 1 (impossivel de errar, conhecimento do mundo real).** "Qual destes voce serviria gelado?" com duas fotos grandes: vinho branco numa taca suada e vinho tinto. Qualquer adulto acerta. Feedback instantaneo verde, som curto, o mascote comemora em 5 palavras. Equivalente ao primeiro Goomba do Mario: desafio seguro que ensina o verbo basico do jogo (tocar na carta certa). Fonte do principio: https://www.eurogamer.net/video-miyamoto-on-how-nintendo-made-marios-most-iconic-level

**Jogada 2 (primeiro conteudo de verdade).** Pergunta sensorial simples, por exemplo associar "seco" vs "suave" a uma descricao de sensacao na boca. Ainda facil, mas ja e aprendizado real de paladar.

**Jogada 3 (pergunta de objetivo disfarçada de jogada).** "Onde voce mais quer mandar bem?" com 3 cartas ilustradas: "Escolher vinho no mercado", "Pedir vinho em restaurante", "Impressionar nos encontros em casa". A escolha grava o objetivo do usuario E muda o exemplo usado na jogada 5 (payoff visivel imediato). O mascote reage a escolha em 1 frase. Justificativa: Duolingo pergunta motivacao cedo porque meta aumenta retencao e permite personalizar, mas sempre em formato de 1 toque com reacao do mascote. Fonte: https://goodux.appcues.com/blog/duolingo-user-onboarding

**Jogada 4 (primeiro erro provavel + tooltip de VIDAS).** Pergunta com pegadinha honesta, calibrada para uns 50% de erro. No primeiro erro de qualquer usuario (nesta jogada ou em outra), o mascote aparece pela primeira e unica vez com o tooltip de vidas: "Errou? Tranquilo. Voce tem 5 vidas." E so. Quem nao errar a licao inteira nao ve o tooltip nessa licao (mensagem adaptativa, regra 7 do George Fan: quem acerta merece se sentir inteligente). Copy de erro sempre growth mindset: "errando tambem se aprende", padrao que deu +7,2% D14 ao Duolingo. Fontes: https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan e https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

**Jogada 5 (personalizada).** Usa o objetivo da jogada 3. Se escolheu "mercado": "No mercado, qual rotulo combina com churrasco?" O usuario percebe que a resposta dele mudou o jogo. Isso e personalizacao com payoff, nao formulario.

**Jogada 6 (segunda pergunta de perfil, opcional, so se necessaria).** "Quanto voce ja conhece de vinho?" com 3 cartas: "Estou comecando", "Ja arrisco uns palpites", "Ja sei o que gosto". Define dificuldade da trilha (autosegmentacao, mesmo padrao do Duolingo com nivel de idioma). Se der para inferir o nivel pelas respostas das jogadas 1-5, corte esta jogada: pergunta inferivel e pergunta que nao deveria ser feita.

**Jogada 7 (fechamento forte).** Pergunta de consolidacao que reusa o que foi aprendido nas jogadas 1-2 (composicao de ideias, padrao Portal: so combine mecanicas ja dominadas individualmente). Fonte do principio: https://www.youtube.com/watch?v=Q_AsF3Rfw8w

**Regras transversais da licao:**
- Barra de progresso sempre visivel no topo (goal gradient: quanto mais perto do fim, mais a pessoa se esforca para completar; fonte: https://goodux.appcues.com/blog/duolingo-user-onboarding).
- Mascote so fala em momentos de ensino ou celebracao, nunca em jogada neutra (nao criar ruido, regra 8 do Fan).
- Zero jargao de sommelier sem traducao imediata (marca anti-elitista). Sem emoji na UI, sem travessao em copy.
- Nenhuma mencao a cristais, liga, badges ou loja durante a Licao 1. Progressive disclosure: recurso que nao e necessario agora nao aparece agora. Fonte: https://www.nngroup.com/articles/progressive-disclosure/

### Fase 2: o aha e a celebracao (10 a 15 segundos)

1. **Tela de conclusao da Licao 1.** Animacao curta, contagem de XP subindo (primeiro e unico momento em que XP e nomeado: "Voce ganhou 80 XP"), acertos destacados. O tooltip de XP acontece aqui, no fim, quando o numero ja tem significado emocional.
2. **Tooltip de STREAK na mesma tela.** "Dia 1 da sua sequencia. Volte amanha para o dia 2." Streak so faz sentido depois de completar algo, nunca antes. E o gancho de retorno D1, a metrica que de fato testa o FTUE. Fonte do mecanismo: https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
3. **Micro-compromisso de meta.** "Quantas licoes por dia?" com 2-3 opcoes de 1 toque ("Leve: 1 por dia" / "Firme: 2 por dia"). Meta definida pelo usuario alimenta streak e legitima notificacoes futuras ("complete sua meta de hoje"), padrao validado pelo Duolingo. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

### Fase 3: a soft wall de cadastro (somente agora)

1. **Tela unica:** "Salve seu progresso" mostrando o que a pessoa ja tem a perder: 80 XP, streak de 1 dia, trilha personalizada. Botao primario: criar conta (Google em 1 toque como default no Android, e-mail como alternativa). Botao secundario discreto e neutro: "Depois". Nunca algo como "descartar progresso". Justificativa: trocar o botao punitivo por "Later" moveu metricas no Duolingo; o delayed signup como um todo deu cerca de +20% DAU. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/
2. **Quem toca "Depois" segue jogando.** Soft wall 2 ao fim da Licao 2 ou ao tentar ver a liga; soft wall 3 ao fim da Licao 3; hard wall no inicio da Licao 4 (ajustar pelos dados). As soft walls ignoradas preparam a hard wall, que sem elas performa significativamente pior (Gotthilf, mesma fonte; o conjunto rendeu +8,2% DAU adicionais ao Duolingo).
3. **Prompt de instalacao do PWA (Add to Home Screen) nunca antes do aha.** Disparar apos o cadastro ou apos a Licao 2, atrelado ao streak: "Instale para nao perder sua sequencia."

### Fase 4: revelacao progressiva das demais mecanicas (Licoes 2 a 5)

| Mecanica | Momento do tooltip (primeira ocorrencia real) | Copy maxima |
|---|---|---|
| Vidas | Primeiro erro do usuario | 8 palavras |
| XP | Tela de fim da Licao 1 | 8 palavras |
| Streak | Fim da Licao 1, junto da meta | 8 palavras |
| Cristais | Primeira vez que ganha cristais (fim da Licao 2) | 8 palavras + 1 toque para coletar (padrao moeda com seta do PvZ) |
| Liga semanal | Apos cadastro, fim da Licao 2 ou 3, quando ja existe XP acumulado para a liga ter sentido | 1 tela curta |
| Badges | Ao desbloquear o primeiro badge real (nunca badge por cadastro: "se cadastrar nao e conquista", licao do fracasso do badge V1 do Duolingo) | so a animacao do badge |
| Loja / reposicao de vidas | Primeira vez que zerar as vidas | 1 tela curta |

Justificativas: espalhar o ensino e introduzir mecanica perifericas devagar (Fan, regras 3 e 4, https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan); contextual teaching (https://gdevelop.io/blog/improve-game-tutorials); progressive disclosure (https://www.nngroup.com/articles/progressive-disclosure/); badges bem implementados deram +2,4% DAU e +4,5% em licoes completadas ao Duolingo (https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/).

### Instrumentacao e testes (essencial para os gates de 2000/3500/5000)

- **Funil por evento:** abriu app > tocou Comecar > respondeu J1 > ... > completou Licao 1 > viu soft wall > cadastrou ou tocou Depois > iniciou Licao 2 > voltou D1. Medir vazamento em cada parede, como manda a receita de Gotthilf.
- **Metrica norte do FTUE: retorno D1**, nao taxa de conclusao do tutorial. "Se voce quer saber se seu FTUE funciona, D1 e o teste de verdade." Fonte: https://www.linkedin.com/posts/phillip-black-economist_%F0%9D%97%9A%F0%9D%97%98%F0%9D%97%A7-%F0%9D%97%A5%F0%9D%97%9C%F0%9D%97%97-%F0%9D%97%A2%F0%9D%97%99-%F0%9D%97%A7%F0%9D%97%A8%F0%9D%97%A7%F0%9D%97%A2%F0%9D%97%A5%F0%9D%97%9C%F0%9D%97%94%F0%9D%97%9F%F0%9D%97%A6-%F0%9D%97%A3-activity-7419066377828933632-p68y
- **Testes A/B prioritarios, em ordem de ROI esperado:** (1) posicao da primeira soft wall (fim da Licao 1 vs fim da Licao 2); (2) hard wall na Licao 3 vs 4; (3) jogada de objetivo na posicao 3 vs no fim da licao; (4) copy do mascote no erro (growth mindset vs neutro); (5) notificacao 23,5h com referencia a meta. Maximo de 3 bracos por experimento (controle + 2), regra do Duolingo. Para produto novo, buscar efeitos de 20-30% por teste. Fonte: https://review.firstround.com/the-tenets-of-a-b-testing-from-duolingos-master-growth-hacker/

### O que NAO fazer (anti-padroes que o fluxo de 9 passos comete)

1. Perguntar antes de entregar: qualquer pergunta de perfil antes da primeira jogada real e custo sem payoff.
2. Apresentar as mecanicas em slides ("isso e XP, isso e vida, isso e liga"): despejo de informacao que a memoria descarta; ensinar em contexto ou nao ensinar ainda.
3. Cadastro, push permission ou prompt de instalacao do PWA antes do primeiro aha.
4. Tooltip para quem nao precisa: mensagens adaptativas, quem acerta nao ve dica.
5. Texto longo do mascote: 8 palavras por mensagem e o teto, quebrar so com motivo forte.
6. Chamar qualquer coisa de "tutorial" ou "onboarding" na UI.

---

## 7. Resumo em uma frase

O onboarding ideal e a Licao 1: o usuario abre o app e em 10 segundos esta acertando uma pergunta impossivel de errar, aprende cada mecanica no exato momento em que ela acontece pela boca curta do mascote, entrega seu objetivo como se fosse uma jogada, sente o aha na tela de XP e so entao encontra um convite gentil para salvar o que ja conquistou, com a opcao "Depois" sempre disponivel ate a Licao 4.
