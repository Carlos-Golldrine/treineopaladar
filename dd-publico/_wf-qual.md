Salvo em `C:\Users\camargo\Downloads\treino-paladar-app\dd-publico\02-qualitativo.md`. Conteúdo completo:

# DD Público — Análise Qualitativa dos Corpora Primários (Tchin Tchin / Treine seu Paladar)

> Codificação temática feita por leitura integral dos textos (não só keyword matching) · 12/06/2026
> Corpora: social listening "Extração - Vinhos" (YouTube BR + Reddit), perfis de audiência Instagram (pipeline s3/s5) e — como fonte complementar de triangulação — o corpus de comentários da própria pipeline (s2_community_comments, pt-BR).
> Convenção: [YTnnn] = Extração-Vinhos Comentários YouTube BR · [RDnnn] = Extração-Vinhos Reddit · [S2nnn] = pipeline s2 (YouTube/TikTok/Reddit pt) · [IG] = bios Instagram s3+s5. Citações literais, anonimizadas (nomes de comentadores removidos; criadores públicos mantidos só quando inevitável ao sentido).

---

## 0. Corpus efetivamente analisado

| Corpus | n limpo | Língua | O que é | Peso para o público-alvo BR |
|---|---|---|---|---|
| YouTube BR (Extração - Vinhos) | 264 comentários, 213 autores, 18 vídeos, 5 canais | pt-BR | Audiência de canais BR de vinho (Vinhos de Bicicleta, Assunto Vinho, Vinhos de Corte, etc.) | ALTO, mas enviesado para o já-engajado |
| Reddit (Extração - Vinhos) | 536 comentários, 66 posts (r/wine 510, r/winemaking 26) | ~100% inglês | Entusiasta anglófono global | BAIXO para pt-BR; útil como retrato do "entendido" e da cultura anti-pretensão |
| s2 pipeline (complementar) | 676 comentários pt (YouTube 544, TikTok 118, Reddit 12) | pt-BR | Comentários coletados pela pipeline v2 (13/05/2026) com likes; inclui vídeos "iniciante" e TikTok lifestyle | ALTO — é a melhor janela para o iniciante BR; **não estava no inventário da DD, rotular como corpus complementar não auditado** |
| Instagram (s3/s5) | 73 perfis, 64 com bio | pt-BR | Audiência (não criadores) que interage com criadores de vinho | MÉDIO — n pequeno, demografia inferida por IA |

Total lido e codificado: **1.549 textos** (264 + 536 + 676 + 73 bios). Codebook construído indutivamente na leitura; frequências abaixo são contagens por regex sobre o corpus limpo (aproximações de teto, um comentário pode ter 2+ temas).

---

## 1. Codificação temática (temas, frequência, citações literais)

### Bloco A — A voz do INICIANTE pt-BR (YouTube BR + s2)

**A1. Medo de errar na compra / escolha como momento de risco — ~47/676 no s2 + presente no YT**
A prateleira do supermercado é o epicentro da dor. Errar = perder dinheiro + frustração sensorial.
- "Um receio que tenho é de comprar vinhos que não são bons, no supermercado... Mas um vinho nesse valor é bom? Para quem não pode comprar vinhos caros, qual a sua dica?" [S2093]
- "Me senti mais confiante para explorar essa faixa de preço dos chilenos com pouco risco de errar, vou dedicar o segundo semestre a essa missão." [S2217, 8 likes]
- "Queria variar na compra dos vinhos mas sempre que escolho diferente não agrada ao meu paladar" [S2344]
- "Alguém que conhece vinho 🍷 pode me dizer qual tipo de vinho eu possa comprar gente peço ajuda me ajuda por favor sou do SP" [S2083]
- "Me indiquem um bom vinho tinto seco, preciso presentear e ñ entendo nd de vinhos 😥 Obs: Por ate 100,00" [S2370]

**A2. Vergonha / insegurança social — 9 menções explícitas no s2, mas de altíssima intensidade emocional**
A vergonha aparece pouco em volume e muito em carga: é o gatilho narrado da decisão de aprender.
- "Estava com uns amigos tomando um vinho, e eles não paravam de comentar sobre a safra, o tipo de uva e os detalhes do sabor. Eu, sem entender nada, fiquei perdido na conversa e percebi que precisava aprender pelo menos o básico." [S2435, 8 likes]
- "Já me aconteceu de amigo abrir vinho caro pra mim eu não sabia onde enfiar a cara" [S2571, 7 likes]
- "Estou aprendendo aqui tudo o que eu sempre quis saber sobre vinhos e nunca tive coragem de perguntar." [S2267, 8 likes]
- "Sou iniciante, bem iniciante mesmo. Uma dúvida, talvez até meio 'boba'..." [S2226] / "Desculpa a ignorância mas vai a pergunta..." [S2236]
- "E o preconceito que sofre quem gosta de vinho suave? kkkkk" [S2442, 18 likes]
- "Pelos comentários vejo que ainda sou um bebê em questão de vinhos....RS" [S2096]

**A3. Jargão como barreira (e como desejo) — ~74/676 no s2**
O iniciante pergunta o significado de palavras que o mercado trata como óbvias. Não rejeita o jargão: quer ser alfabetizado nele.
- "Tanino? Que gosto tem isso? Amargo? Azedo? Adstringente? Sempre ouço falar nisso...a que se assemelha esse sabor?" [S2544]
- "Oque é um vinho reservado?" [S2099] / "Oque são vinhos do velho mundo" [S2349] / "o q seria vinho complexo e não complexo?" [S2058]
- "Quando a pessoa fala que o vinho é amanteigado está querendo dizer oque?" [S2403]
- "Aqui em casa tem um vinho com nome gigantesco 'vinho tinto de mesa seco'. Oque significa?" [S2137]
- "O tanino séria o que aqui no nordeste chamamos de 'ranço'? Tipo, ranço do caju?" [S2197] — tradução espontânea para repertório próprio; ouro para a copy.

**A4. Suave vs. seco — o eixo real do iniciante BR — ~82/676 no s2 (tema nº1 em volume)**
A taxonomia nativa do iniciante não é casta/região: é suave–meio seco–seco. E há vergonha de gostar de suave.
- "Conheço dois tipos de vinho: seco e suave! Kkkk" [S2138]
- "Tô saindo dos suaves de mesa pros secos...pedi indicação pro dono da liquor store, pq eu ia pegar um Pinot Noir mas ele me indicou Merlot. Fiquei na dúvida..." [S2122, 5 likes]
- "A Evino deveria informar no app/site se o vinho é seco, meio seco ou doce/suave" [S2417, 15 likes]
- "Sempre que eu vou no mercado a maioria das garrafas n dizem se o vinho é suave, seco ou meio seco. Tem alguma outra forma de descobrir isso?" [S2139]
- "Eu não gosto de vinho seco e nem doce qual o vinho é meio termo..o meio seco as vezes é seco demais :(" [S2325]

**A5. Preço / custo-benefício — ~67/676 no s2, ~20/264 no YT**
Faixa mental do iniciante: R$30–60 de mercado; R$100+ é "especial"; R$200 é "fora do comum".
- "faz um vídeos indicando vinhos que vc gosta mas que não custa 200 reais kkkkk se é que é possível 🥴🤣" [S2664]
- "Tô muito triste pq meu paladar está se tornando apurado, os vinhos de $40 não me fazem mais feliz kkkkk ódio!" [S2661, **210 likes**]
- "vinho tinto em temperatura ambiente? sou pobre mesmo pq só gosto dele bem gelado e ainda tomo num copo de requeijão 😭" [S2354]
- "Mas por falta de grana não peguei nenhum dos dois... Passou-se uma semana voltei lá. Já estava com grana 😄kkkk... os dois estavam em promoção." [YT231]
- "Era um vinho com excelente custo benefício. Com o passar do tempo, ele foi aumentando de valor e fui deixando de tomar" [YT159]

**A6. Aprender como prazer + devoção ao "professor" — ~70/676 no s2; elogio didático é o tema nº1 do YT (94/264)**
A relação com o criador é de aluno grato, com maratona de conteúdo ("binge de aula").
- "Cada vídeo é uma aula" [YT003] / "Esse assunto vinho nao e assunto, e aula." [YT221]
- "didática impecável, ensino primoroso... tudo o que eu sempre quis saber sobre vinhos" [S2267]
- "Comecei no mundo do vinho fino no meio do ano passado... logo maratonei a playlist de uvas... já experimentei vinhos de 20 uvas tintas, 6 brancas... a Tannat ganhou meu coração." [YT030]
- "Sou iniciante no mundo dos vinhos e estou seguindo seu canal para me ajudar nas escolhas!" [YT041]
- "sou professora e observo a necessidade de tentar enfiar algo na cabeça de alguém kkkkk, eu no caso nesse mundo dos vinhos tentando entender." [S2254, 5 likes]

**A7. Status, "chique", performance social — ~16 menções diretas no s2, mas com os maiores likes do corpus**
O vinho como capital social é dito com ironia afetuosa — o público SABE que é performático e quer mesmo assim.
- "não existe nada mais performático do que entender coisas sobre vinhos" [S2626, **1.304 likes — comentário mais curtido de todo o material**]
- "eu aqui só pq acho chique mulheres que bebem vinho, além de curiosidade" [S2441, 21 likes]
- "Acho tão chique quem sabe sobre os vinhos!" [S2632] / "afinal entender de vinho é charmoso! HAHAHA" [S2539]
- "eu me sinto a protagonista quando eu escolho um vinho, vou pra casa e tomo ouvindo jazz... com um vestido longo preto e batom vermelho KAKAKA (e ainda posto no insta as fotos e me elogiam sempre)" [S2669]
- "eu louco pra um dia dizer isso na mesa: Por favor, traga um vinho 1950 pra bebermos com esse prato" [S2671]

**A8. Ritual prático (etiqueta de uso) — ~77/676 no s2**
Dúvidas de "como se faz": taça, temperatura, girar, guardar aberto, gelo.
- "Eu sempre enchia a taça, porque nunca mexi o vinho e nunca cheirei...agora aprendi" [S2294, 6 likes]
- "queria saber tb se o tinto toma na temperatura ambiente o o branco mais gelado?" [S2100]
- "Devo girar a taça (aerar) a cada gole ou basta girar no primeiro gole?" [S2291]
- "Após aberto, como armazenar e por quanto tempo é sugerido consumir o vinho?" [S2203]
- "Tem pessoas que insistem em colocar gelo no vinho, meu Deus é o fim." [S2063] — o policiamento do ritual também vem de cima.

**A9. Harmonização por ocasião real (não por gastronomia de revista) — ~37/676 no s2**
As ocasiões citadas são: macarrão, queijo de mercado, churrasco, pizza, sagu, primeiro encontro, sogra, Natal, casamento.
- "qual vinho casa mais com macarrão?" [S2627, 116 likes]
- "Ganhei ontem um malbec e nao sei muito bem com qual queijo harmonizar... Help!" [S2234]
- "estou querendo fazer um passeio super romântico... piquenique com vinho e queijo... pf, diga o nome especifico do vinho pois não entendo nada." [S2235]
- "Oi…me dá uma dica de vinho tinto para primeiro encontro? Suave" [S2062]
- "Sou vegetariano e estou entrando no universo do vinho... você apresenta poucas harmonizações e a maioria com carne." [S2524, 8 likes]

**A10. Paladar em formação / sensações ruins sem nome — recorrente**
- "Já bebo vinho há anos, mas só sinto presença do gosto de álcool. Não consigo separar os outros sabores" [S2161]
- "não consigo espalhar a bebida na boca, pois sinto uma sensacao nada agradevel. Parece ser muito ácido... Isso é normal pra quem está começando ou é que não consigo gostar da bebida?" [S2171/S2231 — pergunta repetida por 2 autores]
- "Rapaz, de vinho eu simplesmente aceitei que não consigo gostar... pra mim todos eles tem um gosto horrível lol alguns parecem só puro alcool" [S2009]
- "Tinha dúvidas do porquê o cabernet Sauvignon tinha um sabor mais forte, encorporado. Agora sei que é o Tanino." [S2144, 15 likes] — o "aha moment" que o produto deve fabricar em série.

**A11. Progressão / treinar o paladar como jornada ("ladder") — ~37/676 no s2**
Existe linguagem espontânea de progresso, nível e meta — o terreno onde "Treine seu Paladar" pisa.
- "comecei no que eu podia pagar, depois eu fui evoluindo de 40 reais num vinho até 100 ah 200 pra cima. ^^" [S2372]
- "Tenho 85 invernos... Aprendi o ofício marca a marca; garrafa a garrafa, treinando o olfato e o paladar, degustando. Isto aprende-se com os anos, praticando todos os dias..." [S2073, 15 likes]
- "Fico chateada de não ter elevado meu paladar antes, já comprei vinho de mais de 200 reais... e não sinto ter aproveitado" [S2655]
- "Já tenho 17 vinhos e quero chegar em 100 e manter esse numero. Estou buscando conhecimento" [S2158]
- "Vou colocar os outros na minha lista de futuras aquisições." [YT237]

**A12. Aprender para trabalhar (motivação profissional inesperada) — ~10 casos fortes**
- "Vou trabalhar como atendente de vinhos segunda em um empório e estou aqui adquirindo conhecimento, obrigado pelo conteúdo." [S2436, **56 likes**]
- "Comecei essa semana como garçom em um Wine bar, estou tendo que aprender sobre vinhos... é um universo complexo e gigantesco" [S2298, 12 likes]
- "Estou trabalhando numa adega e por conta própria me interessei por estudar" [S2512]
- "Cursos de sommelier de vinho, vale a pena?? Minha formação de curso superior não tá dando muito certo e estou um pouco desesperada" [S2001, 8 likes]

### Bloco B — A voz do ENTENDIDO BR (YouTube Extração)

**B1. Sugerir pauta e exibir repertório — 40/264 pedem pauta; 38/264 recomendam rótulos espontaneamente**
O entendido comenta para CONTRIBUIR e ser visto contribuindo ("faltou o X", "experimente o Y", listas inteiras).
- "Faltou o Iride da Miolo" [YT100/YT137/YT140 — 3 autores diferentes cobram o mesmo rótulo]
- "Recomendo visitar as vinícolas Peculiare, Quinta Don Bonifácio e a Vinha Solo. Me agradeçam depois." [YT066]
- "Sugiro os pinots nacionais fora do radar como os dos produtores Arte Viva, Cata, Brocardo, Suzin..." [YT156]
- "Valmarino Prestige Nature é o melhor espumante do Brasil, disparado!" [YT133]

**B2. Desafio, teste cego, jogo — 18/264**
A audiência pede mecânica de jogo aos criadores: às cegas, ranking, adivinhar preço, errar em público.
- "Continuo achando que uma tasting às cegas de teroldego e Marselan nacionais pode ser uma boa" [YT157]
- "Também poderiam inverter. O Júlio organiza o teste cego e a Tati tenta adivinhar em ordem qual o vinho mais caro e o mais barato" [YT158]
- "Parabéns pelo teste, errar faz parte 👏 Não esqueça do teste do melhor Pinot Noir das Américas do Sul" [YT236] / "Parabéns! Erraste lindamente!" [YT238]
- "Existe um 'Viés de Simpatia' na degustação de vinhos... Já aconteceu comigo mais de uma vez..." [YT215]
- "Dei boas risadas com teus erros, mas me coloco no teu lugar e fecho a cara, pois sou um iniciante." [YT214] — iniciante e entendido convivem no mesmo jogo.

**B3. Orgulho do vinho nacional — 36/264**
- "Muito legal!!!! Nosso Brasuca vencendo o desafio! Kkkk" [YT199]
- "Belo resultado! Para os detratores do vinho nacional!!!" [YT200]
- "O melhor vinho Merlot é nosso! É da Pizzato!" [YT214]
- Contraponto raivoso existe: "duvido que o br consiga produzir vinho bom... a posilga" [S2079] — tema identitário, mobiliza os dois lados.

**B4. Comunidade / confraria / família — 17/264**
- "Eu estava nessa confraria e assino embaixo!! Eu sou iniciante no mundo do vinho e me lembro que era realmente muito marcante a ameixa" [YT008]
- "Gostei, marinheiro de 1ª viagem, tenho que ir com um grupo que vão só para essa finalidade. E eu como aprendiz" [YT083]
- "Minhas filhas... Kkk Pai chega! Você já falou umas 350mil vezes desse vinho kkkk." [YT231]
- "Estou esperando meu chamado 🙏🏻 alguém me chamar pra tomar vinho 😅😅" [S2593]

### Bloco C — A voz do ENTENDIDO global (Reddit, inglês)

**C1. Preço/QPR é a obsessão nº1 — 126/536**
- "You are paying for the name. There are so many incredible Cabernets under $500 (heck, under $300) that are so much better!" [RD078]
- "I wouldn't pay $160, but for $100, it's a nice wine." [RD463]
- "ask yourself was that a $1500 experience you want to repeat" [RD084]

**C2. Guerra civil pretensão × anti-pretensão — 9 menções diretas, transversal a tudo**
O r/wine se policia: snobs desprezam "crowd pleasers", e a reação anti-esnobe é violenta e celebrada.
- "The amount of pretentious BS in this thread is gross... every single person who is shitting on it would be excited to be served it at a party. F*** them, buy all of it." [RD383]
- "It is a great wine for people that like wine but are not so into wine. A perfect crowd pleaser... I would bet money if you served it blind... a lot of people here would get it wrong." [RD392]
- "It's a wine for people who use the word smooth to describe wine they like" [RD378] — o desprezo pelo vocabulário do iniciante.
- "You are asking wine nerds. For normies Pinot Noir and Riesling can be undesirable." [RD196]
- "Good Wine is not made in Paso Robles." [RD426]

**C3. Rejeição explícita a IA e a "atalhos de tecnologia" — 14/536, sempre hostil**
- Post "US Wineries" (gerado por IA): "AI is ruining our world. Go away." [RD022]
- Rótulo feito com IA: "Instead of AI slop, pay an artist" [RD450] / "The one that's not AI" [RD448]
- Lançamento "WineCrafter AI": "Clanker" [RD533] / "gross, honestly" [RD534]
- App de adega: "Holy shit you're making this too complicated. Just use CellarTracker like any other sane person." [RD056]

**C4. Ansiedade de iniciante existe até lá — 11/536**
- Post: "Is it still good even though it hasn't been refrigerated?" → "yeah its fine lol" [RD010]; "You aren't going to get sick." [RD016]
- "Did I ruin my very first batch?" → "This isn't winemaking. This is watching something rot." [RD527] — humilhação pública do novato.
- "Moscato d'Asti... I think the easiest access ramp for a wine virgin" [RD275] — o conceito de "rampa de acesso" dito por eles.

### Bloco D — Quem é a audiência IG (s3/s5, n=73)

- 64/73 têm bio; **23/64 têm sinal de vinho na bio; 15 têm credencial formal** (WSET, sommelier, ABS, enologia). Ou seja: ~1 em cada 4 comentadores ativos de criadores de vinho já é semi-profissional — ex.: "WSET 3 🍷 Vinhos que valem à pena", "Sommeliere de 🍷🍾🥂 e jantares harmonizados", "Apaixonado por vinho / WSET2 / Compartilhando as garrafas que eu provo".
- O resto é gente comum sem vínculo com vinho: maquiadora, psicóloga, dentista, artesã, oficina de motos. A bio mais reveladora do público 35-54 real: "Casada com [...] / Mãe do [...] e [...] / Dentista / **Enófila 🍷🥂** / Deus, família, viagem, momentos" — vinho como UM dos badges de identidade, ao lado de família e fé (12/64 bios citam fé/Deus; 6 citam mãe/casada/família).
- **Gamificação já existe nesse nicho**: "Autor e criador do jogo @mestre_dos_vinhos 'WSET®3", "Dinâmica e jogo ♟️ para experiências e degustações de vinhos. Aprenda e divirta-se", "🥇1° @vivino 🏅3° 🇧🇷 Blind tasting". Sinal de demanda por mecânica de desafio — e de concorrência informal.
- Demografia inferida por IA (vision_*): pico 25-44 (34/57 com idade inferida), F 38 × M 15. Tensiona a tese 35-54, com a ressalva de viés (quem comenta é mais jovem que quem assiste).

### Achado lateral de linguagem (TikTok)
**29 das 118 menções pt no TikTok a "Malbec" são sobre o perfume Malbec do O Boticário** ("Malbec Noir o MELHOR de todos", "nem sabia que existia esse tanto de malbec kkkkkk" — 10.467 likes). Em criativo de mídia pt-BR popular, a palavra "Malbec" sozinha evoca perfume masculino antes de vinho. Cuidado com copy/segmentação que dependa do termo.

---

## 2. JTBD e dores — ranking ancorado em citações

Formato: "Quando eu [situação], quero [motivação], para [resultado]". Frequência = soma aproximada de ocorrências codificadas nos corpora pt (s2+YT), salvo indicação.

| # | JTBD | Quem | Evidência (freq. aprox.) | Âncoras |
|---|------|------|--------------------------|---------|
| 1 | Quando estou diante da prateleira do supermercado, quero um critério simples que eu consiga aplicar sozinho, para escolher sem desperdiçar dinheiro num vinho que não vou gostar. | **Iniciante** | ~50 | S2093, S2217, S2344, S2370, S2139 |
| 2 | Quando esbarro em palavras que todo mundo usa (tanino, reservado, complexo, velho mundo), quero que alguém traduza para o meu repertório, para parar de me sentir analfabeto no assunto. | **Iniciante** | ~74 | S2544, S2099, S2403, S2197 |
| 3 | Quando bebo e "só sinto gosto de álcool", quero aprender a perceber o que dizem que existe ali, para saber se o problema sou eu ou o vinho — e descobrir o que eu gosto. | **Iniciante** | ~37 | S2161, S2171, S2144, S2009 |
| 4 | Quando tenho uma ocasião com nome (encontro, presente pra sogra, ceia, casamento, macarrão de domingo), quero UMA indicação certeira e barata, para acertar sem virar estudioso. | **Iniciante** | ~32 | S2062, S2342, S2100, S2627, S2235 |
| 5 | Quando amigos/colegas falam de vinho e eu fico mudo, quero o básico rápido e sem julgamento, para nunca mais ficar perdido na conversa (e nunca ser zoado por gostar de suave). | **Iniciante** | ~10 explícitas, alta carga | S2435, S2571, S2442, S2267 |
| 6 | Quando aprendo algo, quero testar provando e registrar meu progresso (faixa de preço, lista, contagem de uvas), para sentir que estou evoluindo de nível. | Iniciante→intermediário | ~37 | S2372, S2158, S2655, YT030, YT237 |
| 7 | Quando começo a trabalhar com vinho (garçom, empório, adega), quero aprender rápido e barato, para não passar vergonha no emprego. | **Iniciante (profissional)** | ~10 fortes, alto engajamento | S2436 (56 likes), S2298, S2512, S2001 |
| 8 | Quando compro online/clube, quero informação confiável (seco/suave, açúcar) antes de pagar, para não me sentir enganado. | Iniciante→intermediário | ~35 | S2417 (15 likes), S2456, S2459, S2653 |
| 9 | Quando já domino o básico, quero descobrir uvas/regiões/produtores fora do radar, para não tomar sempre o mesmo vinho. | **Entendido** | ~17 (YT) | YT029-034 ("amo garimpar"), YT156, YT207 |
| 10 | Quando acompanho um especialista, quero vê-lo (e a mim) testado às cegas, para provar que paladar é habilidade e não pose. | **Entendido** | 18 (YT) | YT157, YT158, YT215, YT236 |
| 11 | Quando o vinho brasileiro vence, quero celebrar e defender, para afirmar pertencimento à cena nacional. | **Entendido BR** | 36 (YT) | YT199, YT200, YT214 |
| 12 | Quando avalio qualquer garrafa, quero saber se o preço se justifica (QPR), para nunca pagar pelo nome. | **Entendido** | 126 (RD) + ~20 (YT) | RD078, RD282, RD463, YT150 |
| 13 | (Motor transversal) Quero que saber de vinho me posicione como pessoa sofisticada/interessante, para colher o status social — dito com autoironia. | Todos, sobretudo iniciante | likes desproporcionais | S2626 (1.304 likes), S2441, S2669 |

**Dores ranqueadas (síntese):** 1) jargão indecifrável e rótulo que não informa (suave/seco ausente); 2) medo de errar a compra na faixa R$30–80; 3) vergonha social — na conversa, no restaurante, no gosto por suave; 4) não conseguir sentir o que os outros sentem ("só gosto de álcool"); 5) sensação de ser enganado (marketing, clube de assinatura ruim, "meio seco" que é doce); 6) gatekeeping dos entendidos ("vinho doce não é vinho", ser chamado de idiota por criador [S2163→S2167: "não é de bom tom vc chamar uma pessoa de idiota... humildade é bom"]).

---

## 3. Linguagem do público (para copy de LP)

### Palavras e frames que ELES usam (usar na copy)
- **"mundo do vinho" / "universo do vinho"** — o frame dominante de entrada: "estou entrando neste mundo MARAVILHOSO dos vinhos" [S2030]; "iniciando no mundo dos vinhos" (dezenas de ocorrências). Entrar no vinho é entrar num LUGAR.
- **"iniciante", "aprendiz", "leigo", "marinheiro de 1ª viagem", "sou um bebê em questão de vinhos"** — autoidentificação sem constrangimento, muitas vezes com kkkk.
- **"errar/acertar"** — o vocabulário de risco da compra: "sem medo de errar", "pouco risco de errar", "erros e acertos", "fiz boa compra?". (Validação direta de que falar de "errar" tem tração.)
- **"treinar o paladar" existe espontaneamente**: "treinando o olfato e o paladar, degustando" [S2073]; "meu paladar está se tornando apurado" [S2661]; "elevar meu paladar" [S2655]; "para meu paladar iniciante" [S2217].
- **Eixo "suave / meio seco / seco"** — classificar por doçura percebida, não por casta. E "docinho", "geladinho", "leve", "fraco/aguado", "forte", "encorpado", "redondo" (= equilibrado, sem nome técnico).
- **"custo-benefício", "em conta", "cabe no bolso", "vinho de mercado/supermercado"** — a faixa R$30–60 é o playground real.
- **"aula", "didático", "maratonar"** — elogio máximo a conteúdo. "Cada vídeo é uma aula" é o padrão-ouro.
- **"dica", "indica um vinho", "qual combina/casa com"** — pedem "dica", não "curadoria"; dizem "combinar/casar", não "harmonizar" (harmonizar aparece, mas como palavra aprendida).
- **"garimpar", "diferentões", "fora do radar"** — vocabulário de descoberta do entendido BR.
- **"chique", "charmoso", "elegante", "performático", "protagonista"** — o frame de status, sempre dito com humor cúmplice. A copy pode brincar com isso ("performático e sem vergonha de ser").
- Registro geral: oralidade, kkkk/rs, emoji 🍷, autodepreciação afetuosa. Frases curtas. Perguntas diretas.

### Termos/abordagens que geram rejeição (evitar ou usar com tradução)
- **Jargão sem tradução**: tanino, retrogosto, pirazina, terroir, "complexo", "amanteigado", "varietal", "bouquet" — cada um deles aparece no corpus como PERGUNTA. Usar só com explicação de uma linha no estilo deles ("tanino = aquela sensação de caju/banana verde que seca a boca" [S2197/S2546]).
- **Tom professoral arrogante / humilhação**: o caso S2163→S2167 ("não é de bom tom chamar uma pessoa de idiota por não saber degustar... humildade é bom") e o massacre do novato no r/winemaking [RD527] mostram o anti-modelo.
- **Gatekeeping de gosto**: "vinho doce não é vinho" [S2576], "vinho seco é um lixo papo reto" [S2579] — os dois lados se agridem; a marca não pode tomar partido contra o suave (é onde o público está).
- **"Vinho é tudo igual / é só marketing"**: enfurece o entusiasta ("É de uma ignorância tão absurda..." [S2140]) e não consola o iniciante. Cinismo não converte.
- **IA como argumento de venda**: no Reddit a reação a produtos "AI" é imediata e visceral ("Clanker", "AI slop", "Go away"). No corpus pt isso ainda não aparece — mas para o público entendido/criador, vender o app como "IA do vinho" é risco; vender como "treino" é seguro.
- **"Malbec" sozinho em mídia popular** = perfume O Boticário (29/118 menções TikTok). Contextualizar sempre ("uva Malbec", "vinho Malbec").

---

## 4. Sinais sobre Provocação vs. Ensinar

**Como os entendidos falam de apps/atalhos:**
- Hostilidade a atalhos tecnológicos: app de adega → "Just use CellarTracker like any other sane person" [RD056] / "Don't overcomplicate" [RD055]; ferramenta "WineCrafter AI" → "Clanker", "gross, honestly" [RD533-534]; conteúdo gerado por IA → "AI is ruining our world. Go away." [RD022]. Para o entendido, o valor do vinho é exatamente o que NÃO tem atalho: anos de garrafa a garrafa ("Aprendi o ofício marca a marca; garrafa a garrafa... praticando todos os dias" [S2073]).
- MAS o mesmo entendido adora ser desafiado: pede teste cego [YT157-158], celebra o erro do especialista ("Erraste lindamente!" [YT238], "errar faz parte" [YT236]), teoriza contra o próprio viés ("Viés de Simpatia" [YT215]) e aposta que os esnobes errariam às cegas ("I would bet money if you served it blind a lot of people here would get it wrong" [RD392]).
- **Leitura**: a provocação que funciona com o entendido é a do PALADAR ("você acertaria às cegas?"), não a da tecnologia ("a IA sabe mais que você"). Posicionar o produto como arena de prova, nunca como substituto do percurso.

**Como os iniciantes falam de vergonha/insegurança:**
- A vergonha é o gatilho de origem ("fiquei perdido na conversa e percebi que precisava aprender" [S2435]; "não sabia onde enfiar a cara" [S2571]) — mas o que pedem é ACOLHIMENTO, não choque: "tudo o que eu sempre quis saber e **nunca tive coragem de perguntar**" [S2267]; perguntas precedidas de "desculpa a ignorância", "pergunta meio boba". Quando um criador humilha, a audiência reage em defesa do humilde [S2167].
- O iniciante aceita ser provocado pela ASPIRAÇÃO (status): os comentários de maior like do corpus são autoironia aspiracional ("não existe nada mais performático do que entender coisas sobre vinhos", 1.304 likes [S2626]; "acho chique quem entende" [S2441/S2631-33]). Ele quer SE TORNAR a pessoa performática — ri disso, mas quer.
- **Leitura**: com o iniciante, "provocar a vergonha" (ex.: "você passa vergonha na adega?") é arriscado — ele já se pune sozinho e procura quem NÃO o julga. O frame vencedor é aspiração + segurança: "aprenda o que você sempre quis saber e nunca teve coragem de perguntar" (frase deles, literal) / "escolha sem medo de errar" / "vire a pessoa que entende da mesa". A provocação-desafio (quiz, teste cego, "será que você acerta?") funciona para os DOIS públicos quando o erro é tratado como parte do jogo — exatamente como os criadores YT fazem ("errar faz parte").

---

## 5. Honestidade metodológica

1. **Tamanho e origem do corpus**: 264 comentários YouTube BR (Extração-Vinhos, out/2025, 18 vídeos de 5 canais — 7% do catálogo de 250 vídeos); 536 comentários Reddit (r/wine + r/winemaking, inglês); 676 comentários pt da pipeline s2 (13/05/2026; YouTube 544, TikTok 118, Reddit 12 — **corpus complementar que NÃO constava do inventário 00; proveniência: mesma pipeline auditada dos perfis IG, mas sem auditoria própria de coleta**); 73 perfis IG (s3/s5). Total lido: 1.549 textos. Sem timestamps nos comentários (exceto s2 parcial); sem dados demográficos declarados em nenhum corpus.
2. **Vieses de seleção, por corpus**:
   - *YouTube Extração*: quem comenta em canal de vinho é fã engajado — superrepresenta o entusiasta e o "aluno dedicado"; o iniciante silencioso 35-54 (maioria do TAM declarado) quase não comenta. Os elogios massivos aos criadores (94/264) também refletem dinâmica parassocial, não só demanda por educação.
   - *Reddit*: anglófono, hemisfério norte, cultura r/wine — NÃO é o público 35-54 BR. Usado aqui apenas como retrato do "entendido" global e dos códigos anti-pretensão/anti-IA. Inclui 6 mensagens automáticas de moderação contadas fora dos temas.
   - *s2 pipeline*: curadoria da própria pipeline (keywords), mistura vídeos "para iniciantes" (enviesa A FAVOR de achar iniciantes), vídeos de vinho caseiro (40 comentários de fabricação artesanal, pouco relevantes para o app) e TikTok lifestyle (skew jovem/feminino). Likes do TikTok inflacionam temas de status.
   - *Instagram*: n=73, só quem interage publicamente; demografia (gênero/idade) é inferência de IA sobre foto com 22% de nulos — proxy com erro, não medição.
3. **Limites da codificação**: codificador único (sem confiabilidade inter-codificadores); frequências por regex são tetos aproximados (um comentário pontua em vários temas; sinônimos fora do dicionário escapam); temas de baixa frequência mas alta carga (vergonha: 9 menções) foram promovidos por julgamento qualitativo explícito — isso é interpretação, não medição.
4. **O que este material NÃO autoriza**: nenhuma estimativa de tamanho de segmento ("X% do público sente vergonha"), nenhuma comparação estatística entre personas, nenhuma inferência sobre o público que não comenta. Autoriza: hipóteses de dor/JTBD, dicionário de linguagem para copy, e direcionamento de tom (Ensinar com acolhimento + Provocar como jogo) — todas testáveis em LP/anúncio com dados próprios.
5. **Convergência que aumenta confiança**: os mesmos temas (medo de errar, suave vs seco, jargão, preço R$30-80, status "chique") emergem em DOIS corpora pt independentes (Extração out/2025 e pipeline mai/2026), com plataformas e épocas distintas — é triangulação real, não eco de uma coleta só. A divergência relevante: o desejo de desafio/teste cego aparece quase só no público YT engajado (entendidos), não no TikTok iniciante.

---

*Arquivos-fonte: `C:\Users\camargo\Downloads\Extração - Vinhos(Comentarios).csv`, `C:\Users\camargo\Downloads\Extração - Vinhos(Reddit).csv`, `C:\Users\camargo\Downloads\Extração - Vinhos(Canais).csv`, `...\tchin-pipeline-v2\data\output\s2_community_comments.csv`, `s3_instagram_personas.csv`, `s5_personas_visual.csv`. Limpeza: cp1252+";", remoção de padding e duplicatas exatas, conforme inventário 00.*
