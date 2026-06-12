# DECISÕES DE PRODUTO V2 — Treine seu Paladar (standalone)

> Atualizado em 11/jun/2026, após rodada de respostas do Gabriel + workflow de pesquisa (7 agentes, verificação adversarial: 8 claims confirmados na fonte primária, 3 nuances, 0 refutados).
> Substitui as seções correspondentes do DIAGNOSTICO-E-PLANO.md. Pesquisas completas em `pesquisa/`.

## Decisões travadas pelo Gabriel
- Gates ORIGINAIS mantidos: 2.000 +10% D30 → entra no app · 3.500 +15% → core · 5.000 +30% → app apartado ("vamos atrás do impossível"; análise proporcional na estatística final)
- Web Push + e-mail aprovados · GTM é web · teste de 3 meses · aquisição por conta dele
- Vidas 1/4h, streak protegido, liga real, personalização por objetivo: aprovados
- Economia de pontos: REDESENHADA (abaixo) · Onboarding: vira FTUE de jogo (abaixo)
- CEO exige ao menos 1 mecânica de rede social de verdade (resolvido com "A Mesa", abaixo)
- Banco de questões: gerado por IA enjaulada com auditoria + rotina contínua (abaixo)
- Vinho não encontrado: busca on-demand (Firecrawl/Apify) → retorna ao usuário → salva no banco

---

## 1. Banco de vinhos: v10.5 é a nova base primária

`tchintchin_vinhos_seed_v10_5.xlsx` (OneDrive/ai.vinhos): **14.603 vinhos (11,9x a anterior)**, com pipeline de quarentena/dedup/resgate de preço embutido. Auditoria completa: `auditoria-seed-v10_5.md`.

O que mudou: imagens 0% → **39% (5.692 URLs testadas, 5/5 vivas)**; curiosidade educacional única por vinho em 91,6%; sensorial deixou de ser template (90,6% LLM com rastreabilidade); coerência sensorial excelente (0,07% violação). Brasil nº 1 (3.433), preços medianos R$108, 44% na faixa R$30-120.

**Veredito: APTO para o motor de questões, usando view filtrada** (~11,4k): `is_active` ∧ vinho real ∧ dedup ∧ moderação não-pendente. NÃO apto para scanner por código de barras (0%).

Correções F0 (ordem): (1) aplicar dedup (1.534 excedentes); (2) remover 43 não-vinhos vazados (gin, cachaça, sacola kraft); (3) **baixar e hospedar as 5.692 imagens JÁ (URLs de e-commerce perecíveis)**; (4) normalizar tipo/país/status/confiança; (5) zerar 122 preços inválidos; (6) corrigir 2 Monte Paschoal espumante→tinto.

## 2. Trilha: modelo revisado (resposta à crítica "9 lições é pouco e raso")

Parâmetros da matriz: **nível (3 faixas, auto-declarado no onboarding + ajuste dinâmico) × objetivo (mercado / restaurante / receber em casa / hobby)**. Implementação:

- **Trilha única adaptativa** (path linear pós-2022 do Duolingo: um caminho claro, sem paralisia de escolha), com unidades REORDENADAS pelo objetivo declarado e exemplos personalizados por ele.
- Volume: **6 unidades × 5 lições = 30 lições autorais** + checkpoint por unidade (Fundamentos · Uvas tintas · Uvas brancas/espumantes · Comprar sem errar · Harmonização · Brasil e vizinhos).
- **Mastery por lição (0-3 coroas)**: replay com dificuldade crescente, exercícios gerados pela factory. Multiplica conteúdo sem multiplicar redação autoral. Quem avança rápido sobe coroa, não fura o spacing.
- **Dificuldade adaptativa (Birdbrain-lite)**: alvo de 80-85% de acerto por sessão (regra dos 85%, Wilson et al. 2019 Nat Commun, com a ressalva de escopo confirmada na verificação; converge com a prática do Duolingo). Iniciante absoluto começa a ~90% nas 2 primeiras sessões.
- **Score de Paladar por dimensão** (estilo EPQ do Elevate, 0-1000): Acidez, Tanino, Corpo, Frutado, Doçura + Rótulo & Compra + Harmonização. Sobe com desempenho, decai levemente com inatividade ("memória sensorial enferruja sem treino") — honesto e gera motivo de retorno.
- **Revisão espaçada**: agenda D+1, D+3, D+7, D+21 (gap de Cepeda 2008); itens errados voltam na sessão seguinte; acerto de item antigo é celebrado ("isso você aprendeu há 9 dias e ainda sabe").

## 3. Pacing: SIM, existem estudos, e a resposta é soft cap + ritual (não cap rígido)

Evidência central (verificada): prática distribuída esmaga massificada em retenção (Cepeda 2006, 317 experimentos); overlearning na mesma sessão tem ganho ~zero (Rohrer & Taylor 2006); **"learners who binge... were much more likely to abandon the app" (blog oficial Duolingo)**; saciação hedônica degrada a experiência com repetição alta e recomenda período de recuperação + variedade (Hammedi et al. 2023, J. Service Research); dar folga AUMENTA retorno (Weekend Amulet +4%).

Decisão em 3 camadas (nunca bloquear conteúdo):
1. **Desafio do Dia**: 1 por dia, igual para todos, reset à meia-noite de Brasília, resultado compartilhável sem spoiler (envelope estilo Wordle). Único conteúdo realmente escasso. North star de hábito.
2. **Soft cap de XP**: 100% nas lições 1-3 do dia, 50% nas 4-5, 25% da 6 em diante + mensagem de pacing no tom da marca ("seu cérebro fixa melhor dormindo em cima disso, amanhã tem mais"). D0 é isento (ativação primeiro; pacing começa no dia 2).
3. **Máx. 2 unidades NOVAS por dia; revisão sempre livre com XP integral** (modelo Anki: o limite é de conteúdo novo, não de prática).

Vidas recalibradas para público de maioria iniciante (52-65% observável; correção C1 da DD de jun/2026: o "73%" é mercado total Consevitis, não nosso público): 5 vidas, regen 1/4h, primeiro erro de cada lição não custa vida, **concluir uma sessão de revisão recupera 1 vida**, zero vidas → revisão livre (caminho triste vira estudo). Instrumentar coortes por lições/dia na semana 1 (1 / 2-3 / 4-5 / 6+) e medir D7/D30: previsão de U invertido com pico em 2-3/dia; ajustar o soft cap pelos dados.

## 4. Aprender vs sentir que aprendeu: dois sistemas de design (ambos obrigatórios)

A dissociação é real e medida: aula ativa ensina +0,46 DP e dá sensação -0,56 DP (Deslauriers 2019 PNAS, confirmado); releitura fluida infla confiança e despenca em 1 semana (61% retrieval vs 40% releitura, Roediger & Karpicke 2006, confirmado). Otimizar para facilidade é otimizar CONTRA o D30.

**Motor de aprendizado real** (não negociar): tudo é retrieval (conceito novo nasce como pergunta, nunca tela de leitura); interleaving apresentado como "rodada mista"; espaçamento; 15-20% de erro por sessão.

**Camada de sensação de aprendizado** (custo zero de aprendizado, puro ganho de percepção):
- Arquitetura da sessão (10-12 questões): abre com 2-3 revisões a ~90% (vitória imediata), núcleo a 75-85%, 1 item rotulado "Desafio" (errar desafio não fere autoestima), fecha com 1-2 quase garantidos do recém-aprendido — termina acertando.
- Erro = melhor momento: feedback imediato + explicação de 1 frase + o item volta antes do fim para fechar o ciclo acertando (hipercorreção, Metcalfe).
- "Certeza ou chute?" antes do reveal em itens-chave (alimenta hipercorreção e gera a curva de calibração).
- **Recap "Você agora sabe"** obrigatório no fim: 2-3 frases concretas + comparativo ("8 de 10 em aromas, semana passada era 5").
- Inoculação metacognitiva no onboarding e no primeiro erro: "Errar aqui faz parte do treino. Paladar se aprende errando e corrigindo, igual academia" (a intervenção de 20 min de Deslauriers virou 65%/75% de mudança de percepção; nossa versão de 15 segundos).
- Barra de progresso da lição sempre avança (menos no erro). Score de Paladar visível por habilidade.

## 5. Formatos de exercício: 8 novos + 4 herdados

TOP 8 novos (pesquisa completa em `pesquisa/formatos.md`):
1. **Slider de estimativa** (chute o corpo do Malbec, o preço na gôndola, a temperatura do espumante) — hipercorreção, custo baixo, gerável do banco
2. **Connections do vinho** (16 cartas, 4 grupos com pegadinha: "Rioja parece uva mas é região") — identidade própria
3. **Cenário ramificado** ("Churrasco na casa do amigo, R$80 no mercado", prateleira com 6 garrafas REAIS do banco) — o formato mais "vida real" para a dor do público; finais melhores/piores, nunca um único certo
4. **Swipe harmoniza/não harmoniza** (picanha + este tinto?) — jogável com 1 mão
5. **Hotspot em rótulo real** ("toque na safra", "ache a uva") — ataca diretamente a insegurança na prateleira; usa as 5.692 imagens
6. **Ordenar/rankear** (do mais doce ao mais seco: Moscatel → Nature)
7. **Ache o intruso** ("qual NÃO é aroma de Chardonnay?") — quase grátis de gerar do banco
8. **Rótulo do Dia** (envelope do Desafio do Dia: mesmo rótulo real para todos + 4 perguntas, grade compartilhável no WhatsApp)

Herdados do v1 (continuam bons): múltipla escolha, associação, montar frase, duas-verdades-e-uma-mentira (substitui o V/F seco). Aposentados como formato isolado: digitar (vira variante rara), V/F simples (vira swipe).
Momento "uau" raro: **"Monte seu vinho"** (manipulável estilo Brilliant: sliders de acidez/tanino/corpo/doçura → o app revela qual vinho real do banco mais se parece) em 2-3 pontos da trilha.
Modos extra (pós-MVP, sinks da loja): Blitz de pares cronometrado, Duelo assíncrono de 5 rodadas na liga.
Regra anti-elitista universal: o reveal explica a regra em uma frase de gente, nunca em sommelierês.

## 6. Economia redesenhada (substitui o canônico v1)

Princípios com evidência (pesquisa em `pesquisa/economia.md`): ponto sem loja visível não é medium (Hsee 2003); granularidade certa = dezenas/sessão, centenas/semana (numerosidade); progresso dotado acelera conclusão (34% vs 19%, Nunes & Drèze 2006, confirmado); **resgatar acelera o hábito** (rewarded behavior +17,5%; resgatadores retêm melhor) → forçar 1º resgate barato na semana 1; recompensa tangível previsível MATA motivação intrínseca (Deci 1999) → vinho/desconto nunca como salário, sempre marco ou sorteio.

**XP (placar, nunca se gasta):** lição 20 · perfeita 25 · revisão 10 · Desafio do Dia 30 · checkpoint 50. Meta diária sugerida 50 XP (~10 min). Semana engajada: 350-500 XP; promoção na liga ~400.
**Cristais (carteira, sempre se gasta):** lição 5 (+2 perfeita) · meta diária +10 · quests 5-15/dia · streak 7d +30, 30d +100 · liga 100/60/40 + promoção 30 · boas-vindas 60 (apresentado como barra do 1º item já cheia). Ganho ativo: ~25-35/dia, ~200/semana.
**Loja (ralos):** freeze 60 (o bônus de boas-vindas paga exatamente 1; resgate guiado no dia 2-3) · recarga vidas 50, avulsa 15 · dobro de XP 15min 30 · desbloqueio antecipado de unidade 200 · **desbloqueio de modo novo 300** (meta de poupança visível: "faltam X cristais para o Modo Harmonização") · flair de liga 75-150. Guardrail de inflação: saldo mediano > 2x maior sink (600) → novo ralo ou corte de torneira. Novo modo a cada 2-3 semanas do teste.
**Recompensas reais (fora da moeda, escassas):** C1 marco: cupom 10-15% de parceiro local ao fechar a Trilha 1 (único, celebratório) · C2 sorteio mensal: semana com 5 dias ativos = 1 entrada (1-2 garrafas/mês) · C3 raríssimo: garrafa em marcos de prestígio (streak 100, trilha completa), cota fixa trimestral. **Nota jurídica: sorteio exige autorização (Lei 5.768/71) — validar formato (concurso de mérito ou via parceiro autorizado) antes de lançar C2.**
**Copy de valor (obrigatória na loja):** "Cristais valem treino. Você ganha estudando e gasta para proteger sua sequência, recuperar vidas e abrir novos modos." Preço sempre em esforço ("60 cristais, cerca de 3 dias de treino"), nunca em reais.
Métricas: 1º resgate até D7 ≥ 60% · resgates/usuário ativo/semana ≥ 1 · D30 resgatadores vs não (se não houver gap, os preços estão errados).

## 7. Onboarding: a Lição 1 É o tutorial (blueprint completo em `pesquisa/ftue.md`)

Números que mandam (verificados): deferred signup = **+20% DAU** no Duolingo; soft/hard walls +8,2%; botão de recusa neutro "Depois" (nunca "descartar progresso"); mascote coach com copy growth mindset +7,2% D14; badge bem feito +2,4% DAU.

- **0-10s**: splash de 1 tela, 1 botão "Começar" → pergunta 1 da Lição 1 REAL (pré-carregada no bundle). Usuário anônimo (IndexedDB, migra no cadastro).
- **Lição 1 = 7 jogadas** (princípios George Fan/PvZ: fazer > ler, máx. 8 palavras por fala do mascote, mensagem adaptativa — quem acerta não vê dica): J1 impossível de errar ("qual destes você serviria gelado?" — o Goomba do Mario) · J2 conteúdo real fácil · J3 objetivo disfarçado de jogada (3 cartas; a escolha MUDA a J5 — payoff visível) · J4 pegadinha honesta ~50% erro → primeiro e único tooltip de vidas · J5 personalizada pelo objetivo · J6 nível (cortar se inferível pelas J1-5) · J7 consolidação (padrão Portal: só compõe o já dominado).
- **Aha**: XP nomeado pela primeira vez na celebração ("Você ganhou 80 XP") · tooltip de streak ("Dia 1. Volte amanhã pelo dia 2") · micro-compromisso de meta (1 toque).
- **Soft wall** de cadastro SÓ agora ("Salve seu progresso": mostra o que perderia) · "Depois" discreto · soft wall 2 na Lição 2/liga, 3 na Lição 3, hard wall na Lição 4 · prompt de instalação PWA nunca antes do aha, atrelado ao streak.
- **Revelação progressiva**: cristais no fim da Lição 2 (1 toque para coletar, padrão moeda-com-seta do PvZ) · liga após cadastro · badge só quando conquistado de verdade · loja quando zerar vidas.
- Métrica norte do FTUE: **retorno D1** (não conclusão do tutorial). A/B prioritários: posição da soft wall 1, hard wall L3 vs L4, posição da jogada de objetivo, copy do mascote no erro, notificação às 23,5h citando a meta.
- Proibido: chamar de tutorial na UI, slides de mecânicas, pergunta sem payoff, pedir push/cadastro/instalação antes do aha.

## 8. "A Mesa": a rede social do app (exigência do CEO, desenhada para não violar a pesquisa)

Conceito: **toda semana a liga te senta numa mesa de degustação com ~20 pessoas do seu ritmo** (o pareamento por coorte já existe para a liga; a Mesa é a cara social dela). Feed contextual da Mesa, não global. O grafo não é de amigos nem de desconhecidos aleatórios: são colegas de turma da semana, com contexto compartilhado (mesma liga, mesmo Desafio do Dia, mesma Degustação da Semana). Resolve o cold start (sempre há mesa cheia), o conteúdo se autogera, e respeita a rejeição validada a "rede de desconhecidos para conversar" porque aqui ninguém precisa conversar: joga-se junto.

Conteúdo do feed (4 tipos, todos estruturados):
1. **Cards automáticos de conquista** (fulano fechou a unidade Uvas Tintas; sicrano chegou a 7 dias) → reação **Tchin!** de 1 toque (kudos; evidência: kudos aumentam frequência — Social Networks 2023; streaks socialmente visíveis são 34% mais longos)
2. **Degustação da Semana** (post âncora editorial): 1 vinho real do banco com imagem; cada membro dá o palpite sensorial (chips + slider, formato de exercício!); na quinta o app revela o perfil e quem chegou mais perto leva cristais. É social que É lição.
3. **Resultado do Desafio do Dia** em grade sem spoiler (compara com a mesa, estilo Wordle)
4. **"Provei um vinho"** (post estruturado de 1 toque: vinho do banco + 3 chips sensoriais + foto opcional) — o único conteúdo gerado por iniciativa própria, sem texto livre obrigatório
Regras duras: SEM seguidores, SEM DM, SEM ranking de popularidade; só Tchin! (positivo); perfil privado por padrão. Convite de **Dupla de Degustação** por WhatsApp continua (Friend Streak: +22% conclusão diária) e senta o amigo na sua mesa.
Navegação do app: **Trilha · Desafio · Mesa · Perfil** (4 abas).

## 9. Fábrica de questões com IA enjaulada (pedido do Gabriel)

- **Caixa**: a IA geradora NUNCA inventa fato. Insumos: view filtrada do banco (~11,4k) + fichas canônicas por conceito (fatos enológicos revisados, 1 por lição autoral) + contrato JSON Schema por formato (12) + brief de copy (sem travessão, sem emoji, voz Mago+Sábio) + alvo de dificuldade (P(acerto) por nível). Distratores SEMPRE por proximidade taxonômica do banco (uvas irmãs, regiões vizinhas, harmonizações trocadas) — nunca inventados.
- **Auditoria em 4 camadas**: (1) validação programática (schema, resposta existe no banco, distrator não é acidentalmente correto, dedup de enunciado); (2) verificador IA independente (prompt adversarial: confere fato contra a ficha/banco + copy contra o brief — a "due diligence dos textos"); (3) amostra humana de 10% por lote; (4) telemetria pós-lançamento: questão com acerto < 60% ou > 95% no nível-alvo volta para revisão automática.
- **Rotina de autoaprendizado**: job semanal gera estoque para os buracos (habilidade × nível × formato com menos itens vivos), priorizando o que a telemetria mostra que engaja; tudo passa pelas 4 camadas antes de entrar.
- **Vinho não encontrado** (ideia do Gabriel, aprovada): busca on-demand via Firecrawl/Apify → ficha provisória exibida ao usuário ("encontramos seu vinho") → entra em quarentena no banco com as mesmas flags da v10.5 → vira questão só depois da auditoria.

## 10. Telemetria do teste (3 meses)
Funil FTUE por evento + retorno D1 (norte do onboarding) · coortes de pacing (lições/dia semana 1 × D7/D30) · conclusão do Desafio do Dia (norte de hábito) · 1º resgate D7, resgates/semana, saldo vs sink (inflação) · D30 resgatadores vs não · Tchin! dados/recebidos × retenção · share orgânico (gate 3). Janela de leitura do D30 da última coorte: o teste de 3 meses lê coortes das semanas 1-8.
