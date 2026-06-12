Salvo em `C:\Users\camargo\Downloads\treino-paladar-app\dd-publico\DUE-DILIGENCE-PUBLICO.md`. Conteúdo completo:

# DUE DILIGENCE DE PÚBLICO: VEREDITO ESTRATÉGICO (Tchin Tchin / Treine seu Paladar)

> Síntese final da DD · 12/06/2026 · Estrategista de produto
> Cruza: `dd-publico/01-quantitativo.md` (estatística sobre 676 comentários pt-BR, 73 perfis IG, 264 comentários YT, 114 queries) + `dd-publico/02-qualitativo.md` (1.549 textos codificados) + `tchin-social-v2/_pesquisa/04-estrategia-publico.md` (Firebase/cadastros, Consevitis, IDIs, playbook) + `treino-paladar-app/DECISOES-PRODUTO-V2.md` (decisões vigentes do teste de 3 meses).
> Convenção: [DADO] = evidência primária ou híbrida com fonte e n explícitos. [HIPOTESE] = síntese, inferência ou rótulo de IA sem validação externa. Quando um dado é rótulo de IA sobre texto primário, está sinalizado como [DADO proxy].

---

## A. VEREDITO DA SEGMENTAÇÃO: o ST "iniciante 35-54" se sustenta?

**Veredito curto: sustenta-se em duas das três pernas, com uma correção numérica obrigatória e dois ajustes de retrato.**

### A1. Idade 35-54: SUSTENTADA com confiança média-alta
- [DADO] Cadastros reais de confraria do Tchin (n=148, dado declarado): mediana 40 anos, faixa 35-44 dominante (32%), 35-54 somam 53% (fonte: 04-estrategia-publico.md, seção 2.3, relatório v3 ao board).
- [DADO proxy] Perfis IG da audiência de criadores (n=57 com idade inferida por visão IA): 35-54 = 49,1% [IC 95%: 36,6; 61,7]. Teste binomial não rejeita H0 de que 35-54 ≥ 50% (p=0,500). O alvo etário NÃO é refutado.
- [DADO proxy] Mesma amostra: faixa modal individual é 25-34 (31,6%) e o bloco 25-44 soma 59,6%. Quem comenta em rede social tende a ser mais jovem do que quem só assiste, então o viés puxa contra 35-54 e mesmo assim a faixa segura metade da amostra.
- **Leitura cruzada**: são duas fontes independentes (cadastro real do app + audiência social inferida) apontando o mesmo centro: o núcleo é 35-54, com uma cauda 25-34 relevante demais para ser excluída do criativo. Confiança: média-alta para "núcleo 35-54", baixa para qualquer afirmação mais fina (células de idade têm 5-18 perfis).
- **O que muda**: nada no produto (as decisões do V2 não dependem de idade). Na aquisição, segmentar 28-54, não 35-54, e deixar o criativo arbitrar. [HIPOTESE de mídia, barata de testar]

### A2. "73% iniciantes": NÚMERO REJEITADO, TESE MANTIDA
- [DADO] A origem do 73% é a Consevitis (n=1.709, "se consideram iniciantes"), pesquisa de MERCADO TOTAL, não da nossa audiência (04-estrategia, seção 2.2). O número é legítimo para dimensionar mercado, ilegítimo como descrição do público que chega até nós.
- [DADO proxy] Nos 676 comentários pt-BR classificados: iniciante amplo (HP3+HP2+HP6) = 65,4% [61,3; 69,3] dos classificados; 51,3% se os indefinidos entram no denominador. Teste binomial contra p0=0,73: rejeitado com p=1,3 por 10 elevado a menos 4.
- [DADO proxy] Queries Google (n=114): 65,8% iniciante [56,7; 73,9], com circularidade de seeds que infla a fração.
- [DADO proxy] Existe um bloco de entendidos (HP4) de 32,7% [28,8; 36,8] que NÃO é marginal.
- **Veredito**: a maioria do público observável é iniciante (melhor estimativa: 52-65%, conforme a definição). A tese "produto para iniciante" segue de pé. O NÚMERO 73% não pode mais ser usado como descrição do público do app em nenhum material (investidor, board, CLAUDE.md). Ver correção C1.

### A3. O que o retrato declarado ESCONDIA (dois ajustes)
1. **Gênero**: [DADO proxy] audiência engajada de conteúdo de vinho no IG é 71,7% feminina [58,4; 82,0], p=0,002, razão 2,5:1. [DADO] A base real do Tchin é 50/50 (Firebase, 04-estrategia 2.3) e o mercado é 53% mulheres (Consevitis). Leitura: o CANAL de aquisição social entrega mulheres em maioria clara; o produto não deve ser gendered, mas o criativo de topo de funil deve ser female-forward. [HIPOTESE acionável]
2. **Região e renda**: [DADO] nenhuma base primária auditada contém região ou renda no microdado. "BSB 53%" é agregado GA citado em PDF, não auditável. Toda afirmação sobre renda do público é hoje síntese sem dado. Tratar BSB/GYN como hipótese de mídia, não como fato de público. Coleta barata em E1.

### A4. Síntese do veredito
| Componente do ST | Status | Confiança | Fonte |
|---|---|---|---|
| Núcleo etário 35-54 | Sustentado | Média-alta | [DADO] cadastros n=148 + [DADO proxy] IG n=57 |
| Maioria iniciante | Sustentado | Alta | [DADO proxy] 52-65%, 2 corpora + queries convergem |
| O número "73%" | Rejeitado para nossa audiência | Alta (p<0,001) | [DADO proxy] n=676 |
| BSB/GYN | Não testável | Nenhuma | sem microdado |
| Renda média-alta | Não testável | Nenhuma | sem microdado; único indício contrário: devices de entrada na base (04-estrategia 2.3) |
| Segmento secundário entendido (~33%) | NOVO, promovido a estratégico | Média | [DADO proxy] n=676 + OR de engajamento |

---

## B. PROVOCAÇÃO vs ENSINAR: papel de cada abordagem

**Veredito curto: não é uma escolha. Os dados separam os papéis com nitidez incomum: ENSINAR é o produto e a monetização (a dor está nos iniciantes); PROVOCAR é a distribuição (o engajamento está nos entendidos). A provocação certa é a do paladar como jogo; a provocação errada (vergonha ou IA) tem risco documentado.**

### B1. Por que ENSINAR é o produto
- [DADO proxy] Iniciantes (HP3) são 1,6x mais numerosos que entendidos (51,8% vs 32,7%, p=3 por 10 elevado a menos 10) e concentram o dobro de dor alta (37,2% vs 18,5%) com delta de Cliff 0,375 (efeito médio; rótulos correlacionados entre si, tratar o tamanho do efeito como teto).
- [DADO proxy] 75,9% dos comentários de iniciantes pedem aprendizado explicitamente; JTBD nº 1 deles é "aprender sem parecer ignorante" (42%).
- [DADO] As citações de maior carga emocional do corpus são de iniciantes narrando vergonha como gatilho de decisão: "fiquei perdido na conversa e percebi que precisava aprender pelo menos o básico" [S2435, 8 likes]; "tudo o que eu sempre quis saber sobre vinhos e nunca tive coragem de perguntar" [S2267, 8 likes].
- [DADO] IDIs do Tchin (n=13): tom condescendente faz deletar; mercado pune elitismo (04-estrategia, dores 1 e 3). Converge com o corpus: quando um criador humilha, a audiência defende o humilde [S2167].

### B2. Por que PROVOCAR é a aquisição
- [DADO] Único outcome 100% primário do acervo (upvotes): comentários de entendidos têm OR 1,71 [1,11; 2,63] (p=0,014) de engajar acima da mediana; estável na sensibilidade com todas as línguas (OR 1,74, p=0,004). Dor e demanda de aprendizado NÃO convertem em engajamento (ORs nulos).
- [DADO] A dor do iniciante é SILENCIOSA: comentário com dúvida recebe MENOS like (rho = menos 0,126, p-FDR=0,002). Implicação dura para aquisição orgânica: conteúdo "aprenda comigo" não será carregado pelo algoritmo via engajamento; quem gera alcance é o entendido performando e o desafio.
- [DADO] A audiência pede mecânica de jogo aos criadores: 18/264 comentários YT pedem teste cego, ranking, adivinhar preço ("Erraste lindamente!" [YT238]; "errar faz parte" [YT236]). Iniciante e entendido convivem no mesmo jogo [YT214].
- [DADO] O comentário mais curtido de todo o acervo (1.304 likes) é provocação aspiracional autoirônica: "não existe nada mais performático do que entender coisas sobre vinhos" [S2626]. O frame de status converte atenção quando dito com cumplicidade, nunca com julgamento.

### B3. Riscos quantificados de cada provocação errada
| Provocação | Risco | Evidência | Severidade |
|---|---|---|---|
| Vergonha do iniciante ("você passa vergonha na adega?") | Backlash + rejeição de tom | [DADO] audiência defende o humilhado [S2167]; tom Acessível = 53% dos posts virais vs Técnico 6% (04-estrategia 7.1); IDIs: condescendência = delete | Alta. Não usar em nenhuma LP |
| IA como argumento de venda ("a IA sabe mais que você") | Hostilidade do segmento entendido/criador, que é exatamente o motor de distribuição | [DADO] 14/536 menções a IA no Reddit, 100% hostis ("Clanker", "AI slop", "Go away" [RD022, RD450, RD533-534]). [HIPOTESE para BR: zero ocorrências no corpus pt, risco ainda latente] | Média-alta. Vender como TREINO, nunca como IA. Ver correção C5 |
| Gatekeeping de gosto (zoar quem gosta de suave) | Alienar o maior bloco do público | [DADO] "E o preconceito que sofre quem gosta de vinho suave?" [S2442, 18 likes]; guerra suave vs seco nos dois lados [S2576, S2579] | Alta. A marca jamais toma partido contra o suave |
| Desafio sem rede de proteção (errar dói) | Abandono do iniciante | [DADO] pedidos precedidos de "desculpa a ignorância", "pergunta meio boba" [S2226, S2236] | Média. Mitigada pelo design já decidido (primeiro erro não custa vida, "Errar aqui faz parte do treino") |

### B4. Tradução operacional (mapa abordagem x camada)
- **Produto (trilha, lições, reveal, vidas, recap)**: 100% ENSINAR com acolhimento. Já está assim nas DECISOES V2 (seções 2, 3, 4, 7). Nenhuma mudança.
- **Mecânicas de hábito e share (Desafio do Dia, Rótulo do Dia, grade Wordle, Degustação da Semana, ligas)**: PROVOCAÇÃO-JOGO, serve os dois públicos. [DADO] demanda explícita por teste cego/desafio no corpus YT; o formato compartilhável sem spoiler é o veículo natural do entendido performático. Já está nas DECISOES (seções 3.1, 5.8, 8). Nenhuma mudança de produto, mas a aquisição deve usar essas mecânicas como isca para o entendido (LP5 abaixo).
- **Aquisição (LPs, anúncios, conteúdo)**: dois flights separados. Flight ACOLHIMENTO+ASPIRAÇÃO para iniciante (dor silenciosa: ela não engaja, mas clica; medir CTR e D1, não like). Flight DESAFIO para entendido (ele engaja e compartilha; medir share e tráfego indireto). [HIPOTESE: o A/B do beta arbitra o mix, ver E4]

---

## C. CORREÇÕES AO PRODUTO/POSICIONAMENTO VIGENTE

### C1. OBRIGATÓRIA: aposentar "73% iniciantes" como descrição do público do app
- Onde está: `DECISOES-PRODUTO-V2.md` seção 3 ("Vidas recalibradas para público 73% iniciante") e `CLAUDE.md` ("público 35-54, 73% iniciantes").
- Evidência: [DADO proxy] rejeitado contra a amostra de 676 comentários (p<0,001); melhor estimativa 52-65%. O 73% é da Consevitis sobre o mercado total, outra população.
- Correção: substituir por "maioria iniciante (52-65% do público observável; 73% do mercado total segundo Consevitis)". A DECISÃO em si (vidas generosas, regen 1/4h, primeiro erro grátis) PERMANECE: iniciantes seguem maioria e concentram a dor. Muda o rótulo, não o design. Em material de investidor, nunca apresentar 73% como medição do nosso público.

### C2. OBRIGATÓRIA: dar ao entendido um papel explícito de distribuição (hoje ele não tem dono)
- Onde está: DECISOES V2 desenha tudo para o iniciante; o entendido só aparece implicitamente na liga e no Desafio do Dia.
- Evidência: [DADO] OR 1,71 de engajamento do entendido; 18/264 pedidos de teste cego; [DADO] bios IG: ~1 em 4 comentadores ativos já é semi-profissional (15/64 com credencial WSET/sommelier) e a gamificação JÁ existe no nicho ("@mestre_dos_vinhos", "1° @vivino blind tasting") = demanda e concorrência informal.
- Correção: (a) garantir que o Desafio do Dia tenha teto de dificuldade que desafie um WSET2 (a grade compartilhada por um entendido é o melhor anúncio gratuito para iniciantes: "se até ele erra, eu posso errar"); (b) na aquisição, flight dedicado de desafio (LP5); (c) no pós-MVP, Duelo assíncrono (já previsto como sink da loja) é a mecânica natural desse segmento. Nada disso viola o solo-first nem a Mesa.

### C3. OBRIGATÓRIA: ancorar os exercícios de compra na faixa de preço REAL do público (R$30-80), não na mediana do banco (R$108)
- Onde está: DECISOES V2 seção 1: banco v10.5 com preços medianos R$108, 44% na faixa R$30-120. Os formatos "cenário ramificado" e "slider de preço" puxam vinhos do banco.
- Evidência: [DADO] faixa mental do iniciante é R$30-60 de mercado, R$100+ é "especial" (~67/676 menções de preço; "os vinhos de $40 não me fazem mais feliz kkkk ódio!" [S2661, 210 likes]); [DADO] Consevitis: faixa dominante do mercado R$30-70 (45,4%).
- Correção: a view filtrada para exercícios de COMPRA (cenário ramificado, slider de preço, prateleira) deve ponderar para a faixa R$30-80 com vinhos de supermercado. Vinhos de R$108+ entram como conteúdo aspiracional, não como cenário-base. O cenário "Churrasco na casa do amigo, R$80 no mercado" já acerta o tom; virar regra, não exemplo.

### C4. RECOMENDADA: adicionar o objetivo "para o trabalho" na matriz da trilha
- Onde está: DECISOES V2 seção 2: objetivo = mercado / restaurante / receber em casa / hobby.
- Evidência: [DADO] segmento profissional inesperado com alto engajamento: "Vou trabalhar como atendente de vinhos segunda em um empório" [S2436, 56 likes, o 2º maior like de comentário de aprendizado do corpus]; garçom de wine bar [S2298, 12 likes]; adega [S2512]; ~10 casos fortes. JTBD 7 do ranking qualitativo.
- Correção: 5º objetivo "comecei a trabalhar com vinho" reordenando as unidades (Fundamentos, Uvas, Rótulo & Compra primeiro) e personalizando exemplos para atendimento. Custo baixo (a matriz já existe), abre um caso de uso com urgência real e prazo (segunda-feira) que nenhum concorrente atende. [HIPOTESE de impacto; validar com a distribuição de respostas do onboarding]

### C5. OBRIGATÓRIA (posicionamento): NÃO vender o produto como "IA do vinho"
- Onde está: 04-estrategia seção 1.2, reposicionamento v3 ao board: PR pitch proposto "App com IA que aprende seu paladar".
- Evidência: [DADO] hostilidade unânime a produtos "AI" no segmento entendido/criador (14/536 Reddit, "Clanker", "AI slop"); [DADO] o valor percebido do vinho para o entendido é o percurso sem atalho ("Aprendi o ofício marca a marca; garrafa a garrafa" [S2073, 15 likes]). [HIPOTESE: no corpus pt a rejeição ainda não aparece; o risco é com criadores e parceiros, exatamente o canal de distribuição].
- Correção: pitch e LP falam de TREINO, paladar, jogo, método ("Treine seu paladar" já é a linguagem espontânea do público: [S2073], [S2661], [S2655]). A fábrica de questões com IA (DECISOES seção 9) permanece como infraestrutura interna, jamais como argumento de venda. O nome do produto já está certo; o PR pitch do v3 precisa ser reescrito antes de ir a qualquer imprensa.

### C6. RECOMENDADA: estabelecer a posição "suave sem vergonha" como princípio editorial
- Onde está: implícito no anti-elitismo do brief, mas sem menção ao eixo suave/seco, que é A taxonomia nativa do público.
- Evidência: [DADO] suave vs seco é o tema nº 1 em volume do corpus iniciante (~82/676); há vergonha documentada de gostar de suave [S2442, 18 likes] e gatekeeping dos dois lados [S2576, S2579]; [DADO] demanda por informação de doçura no rótulo ("A Evino deveria informar no app/site se o vinho é seco, meio seco ou doce/suave" [S2417, 15 likes]).
- Correção: (a) a unidade Fundamentos abre pelo eixo doçura percebida (o exercício "ordenar do mais doce ao mais seco" já existe, promovê-lo a cedo na trilha); (b) regra editorial explícita no brief: nenhum reveal, distrator ou copy jamais trata gosto por suave como inferior; (c) toda ficha de vinho exibida mostra seco/meio seco/suave com destaque (é a informação que o público diz não achar no rótulo).

### C7. ATENÇÃO (não é contradição, é validação pendente): "A Mesa"
- Onde está: DECISOES V2 seção 8.
- Evidência a favor: [DADO] rejeição de 100% nas IDIs a "comunidade online com desconhecidos PARA CONVERSAR" (04-estrategia, seção 4); a Mesa foi desenhada para jogar junto sem conversar (sem DM, sem seguidores), o que respeita o dado.
- Evidência de risco: [DADO] o desejo de desafio/competição aparece quase só no público YT engajado (entendidos), não no TikTok iniciante (02-qualitativo, seção 5.5). A Mesa pode ser sentida pelo iniciante como exposição.
- Correção preventiva: nenhuma. Manter o design e tratar a telemetria Tchin! dados/recebidos x retenção (já prevista na seção 10) como teste de kill/continue da Mesa, com leitura separada por nível auto-declarado. [HIPOTESE em teste]

### C8. ATENÇÃO (criativo de mídia): "Malbec" sozinho evoca perfume
- Evidência: [DADO] 29/118 menções pt a Malbec no TikTok são sobre o perfume Malbec do O Boticário (a de maior like: 10.467).
- Correção: em qualquer anúncio ou LP, sempre "uva Malbec" ou "vinho Malbec". Dentro do app o contexto resolve.

### O que a DD CONFIRMA das decisões vigentes (sem mudança)
- Solo-first e "come for the tool": [DADO] comportamento orgânico do Tchin (scanner/busca com pull, confraria sem pull) + case Ei Colibri + IDIs. A DD reforça: a dor do iniciante é silenciosa e individual.
- FTUE como Lição 1, deferred signup, primeiro erro grátis, inoculação "errar faz parte do treino": [DADO] linguagem literal do público ("nunca tive coragem de perguntar" [S2267]); alinhamento total.
- Desafio do Dia compartilhável estilo Wordle: [DADO] demanda explícita por mecânica de desafio no corpus YT e nas bios IG.
- Voz Mago+Sábio anti-elitista, reveal "em uma frase de gente": [DADO] tom acessível = 53% dos virais vs 6% técnico; o corpus mostra o público pedindo alfabetização no jargão, não a abolição dele ("Tanino? Que gosto tem isso?" [S2544]). Manter os termos técnicos COM tradução de uma linha, no estilo deles ("tanino = aquela sensação de caju verde que seca a boca" [S2197]).
- Score de Paladar com decaimento e recap comparativo: [DADO] linguagem espontânea de progressão existe (~37/676: "evoluindo de 40 reais até 200" [S2372]; "elevar meu paladar" [S2655]).
- Gamificação de conhecimento, nunca de volume (CONAR): sem conflito com nenhum dado.

---

## D. MAPA DE MENSAGENS PARA AS LPs

Regras transversais (do brief + DD): sem travessão, sem emoji, sem "usuário/premium/expert como rótulo", sem "última chance", sem "erro de iniciante", sem IA como argumento. CTA fora da lista banida (nada de "Baixe agora"). Vocabulário do público: dica, combina/casa com, errar/acertar, mundo do vinho, treinar o paladar, custo-benefício, suave/meio seco/seco. Headlines abaixo são candidatas para A/B, no padrão Ogilvy: benefício específico + concretude + a língua do cliente.

### LP1. Medo de errar na compra (prateleira do supermercado) · público: iniciante · flight ACOLHIMENTO
- **Dor na língua do público**: "Um receio que tenho é de comprar vinhos que não são bons, no supermercado... Mas um vinho nesse valor é bom?" [S2093] · "Queria variar na compra dos vinhos mas sempre que escolho diferente não agrada ao meu paladar" [S2344] · [DADO] tema com ~50 ocorrências, JTBD nº 1 do ranking.
- **Promessa (headlines candidatas)**:
  1. "Escolha vinho no mercado sem medo de errar."
  2. "Pare de gastar R$60 em vinho que você não vai gostar."
  3. "Dez minutos por dia e a prateleira do mercado deixa de ser uma roleta."
- **Prova (feature que entrega)**: cenário ramificado com prateleira de garrafas reais ("Churrasco na casa do amigo, R$80 no mercado"); hotspot em rótulo real (5.692 imagens); unidade autoral "Comprar sem errar"; trilha personalizada pelo objetivo "mercado".
- **CTA**: "Começar o treino (grátis, leva 2 minutos)". Secundário: "Que tal experimentar?"

### LP2. Jargão e vergonha na conversa · público: iniciante · flight ACOLHIMENTO+ASPIRAÇÃO
- **Dor na língua do público**: "Estava com uns amigos tomando um vinho, e eles não paravam de comentar sobre a safra, o tipo de uva... Eu, sem entender nada, fiquei perdido na conversa" [S2435, 8 likes] · "Tanino? Que gosto tem isso? Amargo? Azedo?" [S2544] · [DADO] jargão é o 2º tema em volume (~74/676); vergonha tem baixa frequência (9 menções) e altíssima carga (promoção qualitativa explícita).
- **Promessa (headlines candidatas)**:
  1. "Tudo o que você sempre quis saber de vinho e nunca teve coragem de perguntar." (frase literal do público [S2267])
  2. "Tanino, encorpado, seco: em 30 lições essas palavras viram suas."
  3. "Da próxima vez que a mesa falar de vinho, você participa."
- **Prova**: reveal em uma frase de gente (regra anti-elitista universal); primeiro erro de cada lição não custa vida; inoculação "errar aqui faz parte do treino"; fichas canônicas que traduzem cada termo no primeiro contato.
- **CTA**: "Vem treinar com a gente".

### LP3. Ocasião social com nome (presente, encontro, jantar, macarrão de domingo) · público: iniciante · flight ACOLHIMENTO
- **Dor na língua do público**: "Me indiquem um bom vinho tinto seco, preciso presentear e ñ entendo nd de vinhos. Obs: Por ate 100,00" [S2370] · "qual vinho casa mais com macarrão?" [S2627, 116 likes] · "me dá uma dica de vinho tinto para primeiro encontro? Suave" [S2062] · [DADO] ~32 ocorrências de ocasião + ~37 de harmonização cotidiana.
- **Promessa (headlines candidatas)**:
  1. "Presente, jantar, primeiro encontro: chegue com o vinho certo."
  2. "Aprenda a acertar o vinho de cada ocasião gastando menos de R$100."
  3. "O vinho que casa com o seu macarrão de domingo existe. Aprenda a encontrar."
- **Prova**: swipe harmoniza/não harmoniza (picanha + este tinto?); trilha reordenada pelo objetivo "receber em casa" ou "restaurante"; cenários por ocasião real (churrasco, pizza, presente), nunca gastronomia de revista.
- **CTA**: "Que tal experimentar?". Nota de copy: usar "combina/casa com"; "harmonização" só como palavra a ser ensinada.

### LP4. "Só sinto gosto de álcool" (treinar o paladar como academia) · público: iniciante e intermediário · flight ASPIRAÇÃO
- **Dor na língua do público**: "Já bebo vinho há anos, mas só sinto presença do gosto de álcool. Não consigo separar os outros sabores" [S2161] · "Tô muito triste pq meu paladar está se tornando apurado, os vinhos de $40 não me fazem mais feliz kkkk ódio!" [S2661, 210 likes] · "Fico chateada de não ter elevado meu paladar antes" [S2655] · [DADO] linguagem espontânea de treino e progressão (~37/676; "treinando o olfato e o paladar, degustando" [S2073, 15 likes]).
- **Promessa (headlines candidatas)**:
  1. "Paladar não é dom. É treino."
  2. "Do 'só sinto gosto de álcool' ao 'isso é tanino': treine 10 minutos por dia."
  3. "Seu paladar evolui igual academia: com série, repetição e descanso."
- **Prova**: Score de Paladar por dimensão (Acidez, Tanino, Corpo, Frutado, Doçura) que sobe com desempenho; recap "Você agora sabe" com comparativo ("8 de 10 em aromas, semana passada era 5"); momento "Monte seu vinho"; revisão espaçada apresentada como método.
- **CTA**: "Começar o treino". Esta LP carrega o NOME do produto; candidata a LP principal da marca. [HIPOTESE: arbitrar via A/B contra LP1]

### LP5. Desafio "será que você acerta?" · público: ENTENDIDO (motor de distribuição) · flight DESAFIO
- **Dor/desejo na língua do público**: "Continuo achando que uma tasting às cegas de teroldego e Marselan nacionais pode ser uma boa" [YT157] · "não existe nada mais performático do que entender coisas sobre vinhos" [S2626, 1.304 likes] · "I would bet money if you served it blind a lot of people here would get it wrong" [RD392] · [DADO] 18/264 pedidos de mecânica de desafio; OR 1,71 de engajamento do entendido.
- **Promessa (headlines candidatas)**:
  1. "Você acha que entende de vinho? O Desafio do Dia responde."
  2. "Um rótulo por dia, quatro perguntas. Poste sua grade sem medo."
  3. "Às cegas, sem nota de sommelier: só você e o rótulo."
- **Prova**: Desafio do Dia com reset à meia-noite e resultado compartilhável sem spoiler (grade estilo Wordle); Rótulo do Dia com rótulo real; liga semanal por coorte; ranking da Mesa na Degustação da Semana.
- **CTA**: "Encarar o desafio de hoje". Risco controlado: a provocação é do paladar, nunca da tecnologia (C5); o erro é celebrado como parte do jogo ("errar faz parte", linguagem do próprio público [YT236]).

### LP6 (opcional, nicho de alta intenção). Comecei a trabalhar com vinho · público: iniciante profissional
- **Dor na língua do público**: "Vou trabalhar como atendente de vinhos segunda em um empório e estou aqui adquirindo conhecimento" [S2436, 56 likes] · "Comecei essa semana como garçom em um Wine bar, estou tendo que aprender sobre vinhos" [S2298, 12 likes] · [DADO] ~10 casos fortes, engajamento desproporcional.
- **Promessa (headlines candidatas)**:
  1. "Começou a trabalhar com vinho? Aprenda o essencial antes de segunda-feira."
  2. "O treino de paladar de quem atende, vende e indica vinho."
- **Prova**: objetivo "comecei a trabalhar com vinho" (correção C4) com trilha reordenada; unidades Fundamentos + Rótulo & Compra primeiro; Desafio do Dia como prática diária no trajeto.
- **CTA**: "Começar o treino hoje". Depende da correção C4; sem ela, esta LP promete personalização que o produto não entrega.

**Priorização sugerida do A/B de aquisição** [HIPOTESE]: LP1 vs LP4 disputam a LP principal (dor aguda vs identidade de marca); LP5 roda em flight separado para entendidos com objetivo de share, não de conversão direta; LP2 e LP3 entram como variações de anúncio dentro do flight acolhimento; LP6 só após C4.

---

## E. LACUNAS HONESTAS E COLETA BARATA NO PRÓPRIO BETA

O acervo inteiro não tem: dado demográfico declarado, região, renda, variável de negócio (conversão, retenção, gasto) nem o iniciante silencioso (sub-representado por construção em todas as amostras [DADO, caveat 5.1 do quantitativo]). O beta de 3 meses resolve quase tudo de graça:

1. **Idade, gênero e cidade declarados**: 3 perguntas opcionais de 1 toque na tela de cadastro (soft wall, DEPOIS do aha, nunca no FTUE antes da Lição 1, conforme DECISOES seção 7). Cidade alternativa: geolocalização por IP do GA4 (GTM é web). Fecha as lacunas A1, A3 e "BSB/GYN" com dado declarado em vez de inferência de visão IA.
2. **Share real de iniciantes**: a jogada J6 do FTUE (nível auto-declarado) já coleta isso. Apenas instrumentar e reportar a distribuição da semana 1. Fecha em definitivo a questão do "73%" com dado próprio, n na casa dos milhares se o gate 1 for atingido.
3. **Retenção por segmento (a pergunta que NENHUM dado atual responde)**: cruzar nível auto-declarado (J6) e objetivo (J3) com D7/D30 e com 1º resgate. Testa a hipótese central da DD: iniciante retém e monetiza melhor, entendido compartilha mais. [HIPOTESE até a coorte 1 fechar D30]
4. **Provocar vs ensinar na aquisição**: A/B dos flights (LP1/LP4 acolhimento vs LP5 desafio) medindo CTR, CAC, D1 e D7 POR LP, mais share orgânico da grade do Desafio (gate 3 já prevê). Importante: avaliar a dor silenciosa por CLIQUE e conversão, nunca por engajamento do anúncio (o dado mostra que dor não gera like [DADO, rho negativo de dúvida x upvotes]). Custo: só criativo; aquisição já é por conta do Gabriel.
5. **Renda/preço (proxy útil e on-brand)**: 1 pergunta no onboarding ou no D2: "quanto você costuma pagar numa garrafa?" (até R$30 / R$30-60 / R$60-100 / R$100+). Dupla função: personaliza os cenários de compra (C3) e cria o primeiro proxy de poder aquisitivo do acervo.
6. **Disposição a pagar**: Van Westendorp de 4 perguntas por e-mail (web push + e-mail já aprovados) na coorte D14+. Hoje o pricing R$9,90/R$29,90 do ecossistema é 100% síntese sem dado de demanda.
7. **Validação da Mesa**: telemetria já decidida (Tchin! dados/recebidos x retenção, DECISOES seção 10), com um corte adicional: ler por nível auto-declarado, para detectar se o iniciante sente a Mesa como exposição (risco C7).
8. **O iniciante silencioso**: é invisível em social listening por definição. O único jeito barato de ouvi-lo: micro-survey de 1 pergunta dentro do app no D7 ("o que quase te fez não começar?") + análise dos termos de busca pagos que converteram (queries são o comportamento do silencioso [DADO: 114 queries, 65,8% iniciante]).
9. **Confiabilidade dos rótulos de IA do acervo**: se algum número desta DD for a investidor, rodar validação humana de 100 comentários (2 codificadores, kappa) contra os rótulos persona/dor da pipeline. Custo: meio dia. Sem isso, todos os percentuais de persona seguem [DADO proxy], nunca medição.

---

## Síntese executiva (10 linhas)

O ST intuitivo sobrevive à DD com uma demissão e uma promoção. Sobrevive: núcleo 35-54 (cadastros reais n=148 + IG não refuta), maioria iniciante com dor 2x maior e silenciosa, solo-first, tom acolhedor anti-elitista. Demitido: o número "73% iniciantes" como descrição do nosso público (rejeitado, p<0,001; usar 52-65%, e 73% só como dado de mercado Consevitis). Promovido: o entendido (~33%), de figurante a motor de distribuição, porque é ele quem engaja (OR 1,71) e pede o jogo de desafio que o produto já construiu. Ensinar é o produto e a receita; provocar é a mídia; a provocação certa é a do paladar como jogo, e as proibidas são vergonha, gatekeeping do suave e IA como argumento (este último derruba o PR pitch "App com IA" do v3). As decisões V2 saem quase intactas: as correções são de calibragem (preço dos exercícios na faixa R$30-80, objetivo "trabalho", suave sem vergonha) e de rótulo, não de arquitetura. O beta de 3 meses, com 5 perguntas declaradas e os cortes de telemetria certos, substitui de graça quase todas as inferências de IA deste acervo por dado próprio.

---

*Fontes: `dd-publico/01-quantitativo.md` · `dd-publico/02-qualitativo.md` · `tchin-social-v2/_pesquisa/04-estrategia-publico.md` · `treino-paladar-app/DECISOES-PRODUTO-V2.md` · corpora primários listados nos relatórios 01 e 02.*
