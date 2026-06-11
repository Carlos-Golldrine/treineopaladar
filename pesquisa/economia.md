# Redesenho da economia de pontos do Treine seu Paladar

Relatório de economia comportamental aplicada. Base: 7 frentes de evidência pesquisadas na web, com URL por claim, seguidas de proposta numérica concreta para XP, cristais, loja e catálogo de recompensas reais.

## 1. O que a evidência diz

### 1.1 Pontos como medium (Hsee et al. 2003)
O estudo "Medium Maximization" (Journal of Consumer Research, 2003) define medium como um token sem valor próprio que as pessoas recebem como recompensa imediata do esforço e que pode ser trocado por um resultado desejado. A presença do medium altera escolhas porque cria três ilusões: ilusão de vantagem, ilusão de certeza e ilusão de linearidade entre esforço e retorno ([Hsee, Yu, Zhang & Zhang, JCR 2003](https://academic.oup.com/jcr/article-abstract/30/1/1/1801715); [PDF](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/hsee-medium-jcr2003.pdf)).

Implicação direta: pessoas maximizam o medium mesmo quando ele não maximiza o resultado final, MAS isso só funciona se a troca for visível. Ponto sem loja clara e sem taxa de conversão percebida deixa de ser medium e vira ruído. O fundador está certo: a explicação de valor é condição de existência da moeda, não um detalhe de UX.

### 1.2 Numerosity / face value (percepção de magnitude)
Programas de fidelidade exploram a heurística de numerosidade: 100 pontos parecem muito mais que R$ 1, ainda que valham o mesmo. Receber 100 pontos por uma compra de 100 parece generoso; receber 1 ponto pela mesma compra parece mesquinho ([Loyalty & Reward Co](https://loyaltyrewardco.com/100-loyalty-points-sounds-like-a-lot-more-than-1-why-loyalty-psychology-tells-us/)). O benchmark de mercado para valor de face é 0,5 a 1 centavo por ponto, escolhido justamente para inflar a numerosidade mantendo contas simples ([LoyaltyLion](https://loyaltylion.com/blog/calculating-loyalty-point-value); [Yotpo](https://www.yotpo.com/blog/how-are-loyalty-points-calculated/)).

Implicação: a granularidade certa para o nosso público (35-54, iniciante) é dezenas por sessão e centenas por semana. Unidades demais (milhares) criam sensação de moeda desvalorizada e facilidade; unidades de menos (1 a 2 por lição) criam sensação de impossibilidade.

### 1.3 Goal gradient e points pressure (Kivetz, Urminsky & Zheng 2006)
Em campo real (cartão fidelidade de café com 948 membros), os clientes aceleram as compras cerca de 20% conforme se aproximam da recompensa, e usuários de um site de avaliação de músicas visitam mais e avaliam mais perto da meta ([Kivetz, Urminsky & Zheng, JMR 2006, PDF](https://home.uchicago.edu/ourminsky/Goal-Gradient_Illusionary_Goal_Progress.pdf); [Columbia Business School](https://business.columbia.edu/insights/chazen-global-insights/goal-gradient-hypothesis-resurrected-purchase-acceleration)).

### 1.4 Endowed progress (Nunes & Drèze 2006, cartão de lavagem de carro)
Cartões de lava-jato com 10 espaços e 2 selos já carimbados (mesmo esforço real: 8 lavagens) tiveram 34% de conclusão contra 19% do cartão de 8 espaços vazio, e conclusão mais rápida. Progresso artificial inicial aumenta persistência porque a tarefa parece já começada ([Nunes & Drèze, JCR 2006](https://www.researchgate.net/publication/23547282_The_Endowed_Progress_Effect_How_Artificial_Advancement_Increases_Effort); [resumo aplicado](https://loyaltyrewardco.com/loyalty-psychology-series-endowed-progress-effect/)).

Implicação: todo objetivo de cristais deve nascer com progresso dotado (bônus de boas-vindas que já preenche parte da barra) e toda barra de progresso deve ser visível e próxima.

### 1.5 Resgate: points pressure antes, rewarded behavior depois
Taylor & Neslin separaram dois efeitos: points pressure (aceleração antes do resgate) e rewarded behavior (nas 4 semanas após o resgate, quem resgatou aumentou o gasto semanal ~17,5% acima da linha de base) ([Taylor & Neslin 2005, Semantic Scholar](https://www.semanticscholar.org/paper/The-Current-and-Future-Sales-Impact-of-a-Retail-Taylor-Neslin/3b415374ea65dcab9fffd81d5d368f27a7640f95)). Em programa onde o cliente escolhe quando e quanto resgatar, a FREQUÊNCIA de resgate é o que mais influencia o comportamento subsequente, mais que recência e que o volume resgatado; resgates periódicos sustentam engajamento e existe um efeito de "redemption momentum" presente em ~70% dos resgates observados ([Dorotic et al., IJRM 2014](https://www.sciencedirect.com/science/article/abs/pii/S0167811614000457)). Dados de indústria reforçam: membros que resgatam compram 2,7x mais e retêm ~10% melhor que não resgatadores ([Switchfly](https://www.switchfly.com/blog/customer-retention-metrics-loyalty-programs); [Rivo](https://www.rivo.io/blog/tiered-loyalty-program-statistics)).

Implicação central para o teste de 3 meses: resgatar não quebra o hábito, resgatar ACELERA o hábito. O design deve forçar um primeiro resgate barato na semana 1 e resgates pequenos recorrentes toda semana, com um objetivo de poupança de médio prazo por cima.

### 1.6 Economia dual em F2P: soft vs hard currency, sinks e inflação
O modelo canônico F2P usa moeda soft (abundante, ganha jogando) e hard (escassa, premium). Toda torneira (faucet) precisa de ralo (sink); sem sinks recorrentes o saldo acumula, os preços perdem significado e a moeda inflaciona ([Machinations.io](https://machinations.io/articles/game-economy-design-free-to-play-games); [Mobile Free To Play](https://mobilefreetoplay.com/bible/building-lasting-free-play-economy/); [Unity Gaming Services](https://unity.com/how-to/building-game-economy-guide-part-2)). Referência Duolingo para calibração: ~10 XP por lição, streak freeze 200 gems, recarga de 5 corações 350 gems, boost de XP 20 gems, ganho diário típico de 20-40 gems via quests ([duoplanet](https://duoplanet.com/duolingo-gems-and-lingots/); [Happily Ever Travels](https://happilyevertravels.com/duolingo-gems-lingots/)). Ou seja, no Duolingo o freeze custa ~5 a 7 dias de ganho e a recarga ~1 a 2 dias considerando bônus. Para um teste de 90 dias com gate de D30, propomos preços relativos mais curtos que o Duolingo (resgate mais frequente), pela evidência da seção 1.5.

### 1.7 Recompensa tangível vs virtual, escassez e loteria
Recompensas tangíveis não monetárias motivam mais esforço que dinheiro equivalente em vários contextos: são avaliadas hedonicamente, separadas da conta mental de renda, mais fáceis de justificar e lembradas por mais tempo (Jeffrey 2009; [Choi & Presslee, AOS 2022](https://www.sciencedirect.com/science/article/abs/pii/S0361368222000563); [Incentive Research Foundation](https://theirf.org/research_post/the-benefits-of-tangible-non-monetary-incentives/)). Além disso, o motivating-uncertainty effect mostra que recompensas incertas (50% de chance de prêmio maior ou menor) geram mais investimento de esforço que recompensa certa de valor esperado maior, desde que o foco esteja no processo ([Shen, Fishbach & Hsee, JCR 2015, PDF](https://static1.squarespace.com/static/5466fcd7e4b0d83293697c8b/t/595679ce9f745699c67567ec/1498839503095/2015_ShenFishbachHsee_Uncertainty_GoalPersuit_JCR.pdf); [Chicago Booth Review](https://www.chicagobooth.edu/review/uncertainty-can-improve-motivation)). Esquemas de razão variável (sorteio) são os mais resistentes à extinção do comportamento ([revisão aplicada](https://www.adinaaba.com/post/variable-ratio-schedule-examples)).

### 1.8 O freio: overjustification
A meta-análise de Deci, Koestner & Ryan (128 experimentos) mostra que recompensas TANGÍVEIS e ESPERADAS, contingentes a engajamento, conclusão ou desempenho, minam a motivação intrínseca de forma robusta; recompensas verbais e inesperadas não minam ([Deci, Koestner & Ryan, Psychological Bulletin 1999, PDF](https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf); [versão 2001](https://journals.sagepub.com/doi/10.3102/00346543071001001)).

Regra de ouro derivada: vinho e desconto NUNCA podem ser o pagamento previsível por estudar ("faça 10 lições e ganhe vinho" destrói a motivação intrínseca de aprender). Eles devem ser raros, parcialmente imprevisíveis (loteria/marco), e enquadrados como celebração de maestria, não como salário. A economia do dia a dia fica com moedas virtuais; o tangível fica no topo, escasso.

## 2. Princípios de design (síntese)
1. Duas moedas com papéis separados: XP é placar (status, liga, nível, nunca se gasta); cristal é carteira (sempre se gasta). Misturar os dois destrói tanto o status quanto o medium.
2. Toda tela de cristal mostra para que ele serve e quanto custa em dias de treino, nunca em reais (denominar em esforço evita ancorar o aprendizado em dinheiro e evita passivo contábil).
3. Primeira troca na semana 1, troca pequena toda semana, uma poupança de 10-14 dias como meta de médio prazo.
4. Progresso dotado em tudo: bônus inicial que já preenche barras, níveis iniciais curtos.
5. Recompensa real escassa, por marco ou sorteio, jamais comprável diretamente com a moeda do dia a dia.

## 3. Proposta numérica

### 3.1 XP (placar, não gastável)
- Lição padrão: 20 XP. Lição perfeita (sem erros): 25 XP.
- Prática/revisão de unidade antiga: 10 XP.
- Desafio do dia: 30 XP.
- Checkpoint de unidade: 50 XP.
- Meta diária sugerida: 50 XP (2 a 3 lições, ~10 min).
- Liga semanal: usuário engajado fecha a semana com 350 a 500 XP; zona de promoção calibrada para ~400 XP. Centenas por semana exploram numerosidade sem virar milhares vazios.
- Curva de nível do paladar (cumulativo): N1 0, N2 50, N3 120, N4 220, N5 350, depois degraus crescendo ~25% ao nível. O primeiro nível sobe ainda no dia 1 (endowed progress).

### 3.2 Cristais (moeda soft): torneiras
- Lição concluída: 5 cristais. Perfeita: +2.
- Meta diária batida: +10.
- Quests diárias (3 por dia): 5 a 15 no total.
- Marcos de streak: 7 dias +30, 30 dias +100.
- Liga: 1º/2º/3º = 100/60/40; zona de promoção +30.
- Bônus de boas-vindas: 60 cristais no onboarding, apresentado como barra já preenchida do primeiro item da loja.
- Ganho esperado do usuário ativo: 25 a 35 por dia, ~200 por semana.

### 3.3 Loja (ralos): preços
- Proteção de sequência (freeze): 60 cristais (~2-3 dias de treino). Limite de 2 equipadas. É o primeiro resgate guiado: o bônus de boas-vindas paga exatamente 1 freeze, e o app sugere a compra no dia 2 ou 3.
- Recarga de 5 vidas: 50 cristais. Vida avulsa: 15.
- Dobro de XP por 15 min: 30 cristais (sink barato e recorrente, alimenta a liga).
- Desbloqueio antecipado de unidade da trilha: 200 cristais.
- Desbloqueio de modo novo (ex.: Modo Harmonização, Quiz de Rótulo): 300 cristais (~10-14 dias de saldo líquido). É a meta de poupança que gera goal gradient: barra fixa na home, "faltam X cristais para abrir o Modo Harmonização".
- Distintivo/flair de perfil para a liga: 75 a 150 (opcional, cosmético).
- Razão alvo torneira/ralo: gasto recorrente absorvendo 60 a 90% do ganho semanal. Guardrail de inflação: se o saldo mediano passar de 2x o preço do maior item (600), adicionar sink novo ou cortar torneira de liga. Novo modo desbloqueável a cada 2-3 semanas durante o teste.

### 3.4 Catálogo escasso de recompensas reais (fora da moeda)
- Camada 1, marco de conclusão: ao terminar a Trilha 1 (~3-4 semanas), cupom de 10 a 15% em 1 garrafa de parceiro local (Brasília/Goiânia), uso único, validade 14 dias. Custo bancado pelo parceiro (aquisição de cliente para ele). Contingente a conclusão, mas único e celebratório, o que minimiza overjustification.
- Camada 2, sorteio mensal de razão variável: cada semana com 5 dias ativos = 1 entrada no sorteio do mês de 1 a 2 garrafas (custo total R$ 160 a 300/mês para o app inteiro). Escassez real, imprevisibilidade motivadora, custo fixo e previsível.
- Camada 3, vinho grátis raríssimo: somente para marcos de prestígio (streak de 100 dias, trilha completa), cota fixa de até 10 garrafas por trimestre, comunicado como edição limitada. Nunca comprável com cristais.
- Regras anti-overjustification: nada de recompensa real por lição ou por XP; copy celebra a habilidade ("seu paladar evoluiu, hora de provar no copo"), não o prêmio; sempre 18+, com mensagem de consumo moderado.
- Nota regulatória Brasil: distribuição gratuita de prêmios via sorteio exige autorização da SPA/ME (Lei 5.768/71). Alternativas: estruturar como concurso de mérito/assiduidade ou operar o prêmio via parceiro autorizado. Validar com jurídico antes do lançamento da Camada 2.

### 3.5 Explicação de valor exibida ao usuário (copy, sem emoji, sem travessão)
- Cabeçalho da loja: "Cristais valem treino. Você ganha estudando e gasta para proteger sua sequência, recuperar vidas e abrir novos modos."
- Em cada item, preço em esforço: "60 cristais, cerca de 3 dias de treino."
- Tooltip de XP: "XP mostra quanto seu paladar treinou. Ele define seu nível e sua posição na liga da semana."
- Recompensas reais: "Prêmios de verdade existem e são raros de propósito. Quem treina toda semana entra na disputa do mês."

### 3.6 Métricas de acompanhamento do teste
- % de usuários com primeiro resgate até D7 (alvo: acima de 60%).
- Resgates por usuário ativo por semana (alvo: 1+).
- Saldo mediano de cristais vs preço do maior sink (alarme de inflação em 2x).
- D30 por coorte: resgatadores vs não resgatadores (a evidência prevê gap de retenção a favor dos resgatadores; se não aparecer, os preços estão errados).

## 4. Riscos principais
1. Recompensa real previsível demais vira pagamento e mina a motivação intrínseca de aprender (Deci et al. 1999). Mitigação: camadas por marco e sorteio, nunca por lição.
2. Sem sinks novos, cristais inflacionam em 4-6 semanas. Mitigação: pipeline de modos desbloqueáveis e guardrail de saldo.
3. Sorteio sem autorização legal. Mitigação: revisar formato com jurídico (concurso de mérito ou parceiro autorizado).
