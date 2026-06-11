# Treine seu Paladar — Standalone Web App
## Diagnóstico, crítica das metas e plano de produto

> ATENÇÃO: as seções 3 (gates), 5 (regras de negócio, social, conteúdo) e o banco de vinhos foram REVISADOS em 11/jun/2026 após decisões do Gabriel. A fonte da verdade atual é DECISOES-PRODUTO-V2.md. Este documento permanece válido como diagnóstico e contexto.

> Documento de fundação. Atualizado em 11/jun/2026. PM-AI: Claude.
> Fontes primárias: `tchin-tchin-app/src/legacy/screens-treino-paladar.jsx` (spec completa auditada), `tchin-social-v2/_pesquisa/` (6 digests), `auditoria-bancos-vinho.md`, pesquisa web com fontes citadas inline.

---

## 1. O que existe hoje (auditado no código)

A feature "Treine seu Paladar" no app real (`tc.treino.v3` no localStorage) já tem uma fundação sólida de regras de negócio:

- **4 rotas**: trilha (home), lição, liga, "Aprenda bebendo" (2 portas: scan / tema)
- **9 lições em 3 unidades** (Fundamentos do Paladar, Uvas que você vai amar, Comprar sem errar), com hook, conceito, exercícios, aplicação, recap, curiosidade e teaser
- **6 tipos de exercício**: múltipla escolha, verdadeiro/falso, associação, completar frase, montar frase com banco de palavras, digitar
- **Economia fechada**: XP `(1ª vez? 20 : 8) + acertos×5 + (perfeito? 10) + baú surpresa (18%: 15 ou 25)`; cristais `(1ª vez? 5 : 1) + (perfeito? 5)`; 5 níveis (Curioso → Mestre do Paladar, 0/200/600/1500/3000 XP)
- **Vidas**: 5 max, perde 1 por erro, regen 1/20min; **streak** diário com freeze a 200 cristais; metas diárias 20/40/60/100 XP; 6 badges; liga semanal com bots determinísticos
- **Onboarding conversacional** de 9 passos com mascote Tchin (objetivo, meta diária, meta de ofensiva, bônus de cristais)
- **Copy anti-elitista** consolidada ("sem decoreba e sem frescura", "aqui ninguém trava por errar")

### Gaps críticos para virar produto standalone
1. **Conteúdo total ≈ 20 minutos** (9 lições × 2-3 exercícios). Um teste de D30 exige 30+ dias de conteúdo. É o maior bloqueador.
2. Liga é fake (bots), scanner é placeholder, vídeos são placeholder, zero imagens reais.
3. localStorage puro: sem contas, sem servidor, **sem como medir retenção**. Sem analytics não há teste válido.
4. Objetivo escolhido no onboarding (comprar/vergonha/harmonizar/curtir) é armazenado mas nunca usado para personalizar.
5. Sem canal de reengajamento (nudges hardcoded sem entrega).
6. Contradição de UX: copy diz "ninguém trava por errar" mas 5 erros travam a sessão.

---

## 2. Veredito sobre os bancos de vinho (fato importante)

**A base "gigante" de 15.000 vinhos é sintética e factualmente errada — não pode ser usada.** Auditoria encontrou: 39,5% das uvas brancas rotuladas como "Tinto", Chardonnay classificado como tinto 500 vezes, produtores reais em regiões erradas ("Au Bon Climat em Oregon", "Château Margaux Pinot Meunier Branco"), harmonizações aleatórias (espumante + comida indiana como padrão). Perguntas geradas dela teriam ~35-40% de chance de resposta errada na fonte. Detalhe completo em `Downloads/auditoria-bancos-vinho.md`.

**A base correta é o seed curado: `tchintchin_vinhos_seed` (1.227 vinhos reais)** — Catena, Quinta do Crasto, Aurora, Guaspari, Flor de Pingus etc. 100% preenchido em nome/uva/país/região/tipo/preço/harmonização (taxonomia controlada de slugs, perfeita para gerar distratores plausíveis), perfil sensorial 0-5 compatível com o radar do app. Brasil é o país nº 1 (201 vinhos).

O que falta no seed: **imagens (0%)**, EAN (0%), descrições textuais, dedup de ~37 linhas, validação de preços. O SIPEAGRO (30.725 linhas) só serve como tabela auxiliar de produtores BR e curiosidades regionais.

---

## 3. Crítica das metas (com fontes)

Metas propostas: 2.000 usuários +10% D30 → entra no app · 3.500 +15% → vira core · 5.000 +30% → app apartado.

| Benchmark | Número | Fonte |
|---|---|---|
| Média geral consumer D30 | 6-7% (mediana 4%) | adjust.com/resources/guides/user-retention · uxcam.com/blog/mobile-app-retention-benchmarks |
| **Apps de EDUCAÇÃO D30** | **2-7% (a pior vertical)** | businessofapps.com/data/education-app-benchmarks |
| LATAM D30 | 5% | Adjust (idem) |
| "Great" para apps SOCIAIS (a régua mais alta que existe) | D30 30% | a16z.com/do-you-have-lightning-in-a-bottle |
| Duolingo DAU/MAU após uma DÉCADA de otimização | ~37% | investors.duolingo.com (Q3 2025: 50,5M DAU) |
| Web app vs nativo | Web retém pior; 80-90% dos minutos mobile são em apps; sem push nativo nem widget | adjust.com/blog/native-app-vs-progressive-web-app |

**Leitura honesta:**
- **10% D30 (gate 1): agressiva mas defensável.** É 2-5x a mediana de educação e acima do P75 geral. Alcançável com streak + liga + reengajamento bem executados.
- **15% D30 (gate 2): stretch de elite.** Patamar de apps sociais/produtividade fortes. Plausível só se a camada social engatar de verdade.
- **30% D30 (gate 3): sem precedente público.** É o teto "great" da a16z para apps SOCIAIS maduros, num web app de EDUCAÇÃO novo. Nem o Duolingo nasceu aí. Se mantida, o gate 3 nunca dispara e a decisão "app apartado" fica órfã.

**Proposta de gates revisados** (mantém os volumes, corrige a régua e adiciona métrica de hábito, que é o que o Duolingo de fato gerencia — eles usam CURR, não D30; fonte: blog.duolingo.com/growth-model-duolingo):

| Gate | Volume | Retenção | Hábito | Decisão |
|---|---|---|---|---|
| G1 | 2.000 cadastros | D30 ≥ 10% | — | Entra no app Tchin Tchin |
| G2 | 3.500 | D30 ≥ 15% | DAU/MAU ≥ 20% | Vira core (bottom nav) |
| G3 | 5.000 | **D30 ≥ 20%** | DAU/MAU ≥ 25% **+ ≥25% dos cadastros vindos de share orgânico** | App apartado do ecossistema |

Justificativa do G3: 20% D30 já é "OK-bom" para social pela a16z e seria top 1% de educação; a condição de viralidade orgânica é o que de fato justifica um app próprio (demanda própria, não comprada). **Decisão final é do Gabriel — recomendo, não imponho.**

**Implicação operacional:** medir coorte D30 exige janela mínima de teste de 8-10 semanas e analytics desde o dia 1 (PostHog ou Amplitude, eventos: signup, lesson_start, lesson_complete, streak_day, dX_return).

---

## 4. Estratégia de canal de reengajamento (discordância com dados)

A premissa "como será web, GTM via e-mail" deixa dinheiro na mesa. **82% do público é Android, e Chrome/Android suporta Web Push plenamente em PWA instalada.** As duas alavancas com maior evidência causal de retenção no Duolingo são push e widget (lennysnewsletter.com/p/how-duolingo-reignited-user-growth). Widget não existe em web; push existe no Android.

**Stack de reengajamento recomendada:**
1. **Web Push (Android/Chrome)** — streak em risco, meta diária, liga. Primer próprio antes do prompt nativo (decisão C-N já travada na pesquisa).
2. **E-mail** — recap semanal (estilo Duolingo), recuperação de streak quebrado, marcos. Resend ou Brevo.
3. **Prompt de instalação PWA** no momento certo (após 1ª lição completa, não no load).

---

## 5. O produto standalone

### Posicionamento
- App web standalone, **claramente "parte do ecossistema Tchin Tchin", selo Beta** visível mas elegante (padrão "by Tchin Tchin" no splash e na navegação, badge Beta no perfil).
- Tagline derivada do reposicionamento validado na pesquisa: variações de **"Nunca mais erre no vinho"** / "Aprenda vinho em 2 minutos por dia".
- Voz Mago+Sábio anti-elitista. Sem emoji na UI, sem travessão em copy, sem cara de IA (ver BRIEF-DESIGN.md).
- Age gate 18+ acolhedor + "beba com moderação" no footer. NÃO gamificar volume consumido (CONAR).

### Motor de conteúdo (resolve "as lições não podem morrer")
Duas camadas:
1. **Trilha autoral (unidades × lições)** — expandir das 3 unidades atuais para **6 unidades × 5 lições = 30 lições** no lançamento (Fundamentos · Uvas tintas · Uvas brancas e espumantes · Comprar sem errar · Harmonização · Brasil e vizinhos). Conteúdo escrito por nós, fatos checados contra o seed e fontes enológicas.
2. **Prática infinita orientada a dados** — exercícios gerados do seed (1.227 vinhos, 112 uvas, 18 países, taxonomia de harmonização): "qual uva", "de onde vem", "harmoniza com o quê", "qual é mais encorpado", com distratores plausíveis por proximidade taxonômica (uvas parecidas, regiões vizinhas). É o que dá replay diário depois da trilha e mantém o streak vivo.

### Regras de negócio (mudanças vs v1, com justificativa)
- **Vidas: regen 1/4h em vez de 1/20min** (decisão C-T1 da pesquisa; 20min anula o gate). Sem vidas → pode revisar lições concluídas (caminho triste vira caminho de estudo, resolve a contradição de copy).
- **Streak com proteção generosa**: 1 freeze grátis no onboarding + freeze a 200 cristais; aviso às 20h se meta não batida (push/e-mail).
- **Liga real** (coortes de até 20 por engajamento semelhante, estilo Duolingo: +17% tempo de estudo, 3x usuários altamente engajados) com 6 divisões nomeadas por vinho (Frisante → Gran Reserva). Enquanto a base for pequena: coortes preenchidas com perfis-fantasma honestamente rotulados ou ligas menores, nunca bots disfarçados.
- **Objetivo do onboarding passa a personalizar de verdade**: ordena unidades e exemplos (quem escolhe "harmonizar" vê comida nos exemplos primeiro).
- Cálculo de XP/cristais/níveis/badges: manter o canônico v1 (já balanceado e validado em pesquisa).

### Camada social (estilo Strava, calibrada pela pesquisa)
A pesquisa do Tchin é taxativa: social com DESCONHECIDOS foi rejeitado em 100% das entrevistas. Mas o efeito social é o multiplicador de retenção (kudos aumentam frequência de corrida — estudo *Social Networks* 2023; streaks visíveis socialmente são 34% mais longos — trophy.so/blog/strava-gamification-case-study; Friend Streak Duolingo: +22% conclusão de lição diária). Síntese:
1. **Liga por coorte** (social sem grafo de amigos, dia 1)
2. **Tchin! como kudos** — reação de 1 toque em conquistas dos colegas de liga (só positivas, anti-Instagram)
3. **Friend Streak / Dupla de Degustação** — convite por link WhatsApp (também é loop de aquisição)
4. **Card de progresso compartilhável** (estilo Strava/Wrapped: "21 dias de ofensiva, 14 uvas dominadas") — gera o ≥25% orgânico do G3
5. SEM feed, SEM seguidores, SEM DM no standalone.

### Imagens (regra: nada de mock)
- **Ilustração proprietária** com shape language consistente (mascote Tchin, taças, uvas, garrafas SVG) para a trilha e exercícios — gerada e refinada, estilo flat com personalidade (padrão Duolingo).
- **Fotos reais de rótulos/garrafas**: pipeline de scraping (Firecrawl/Apify) priorizando fontes com direito de uso (press kits de vinícolas, Wikimedia, parceiros), com download local e crédito. Para o que não tiver fonte limpa: foto produzida por IA generativa de alta qualidade (nano banana/gpt-image), sem rótulos de marcas reais inventados.

### Stack técnica
- **Vite + React + TypeScript** (mesma família do app real, reaproveita lógica do v1), mobile-first 412px, **PWA completa** (manifest standalone, service worker, View Transitions, safe areas, overscroll none, active states, vibration API no Android).
- **Supabase**: auth (e-mail + Google), Postgres (usuários, progresso, ligas, eventos), edge functions para liga semanal.
- **PostHog** (analytics de coorte, gratuito até 1M eventos) — D1/D7/D30, DAU/MAU, funil de lição.
- **Resend/Brevo** (e-mail) + **Web Push API** (Android).
- Deploy **Vercel** (mesma conta do protótipo atual).
- Orçamento de performance: INP < 200ms e LCP < 2,5s em CPU 4x throttle (Android mid-range é 82% do público).

### Fases de build
1. **F0 — Fundação** (brief de design aplicado, tokens, scaffold PWA, banco seed limpo e importado, schema Supabase, analytics)
2. **F1 — Core loop** (trilha, player de lição com 6 tipos de exercício, XP/vidas/cristais/streak/badges, onboarding com mascote)
3. **F2 — Conteúdo** (30 lições autorais + motor de prática infinita do seed + imagens)
4. **F3 — Retenção & social** (liga real, Tchin!, duplas, card compartilhável, push + e-mail)
5. **F4 — Polish & GTM** (microinterações, estados vazio/erro, age gate, landing, instrumentação final, beta fechado → aberto)

---

## 6. Riscos honestos
1. **Mercado possivelmente nichado**: os "Duolingos do vinho" que existem (Sommy, WineMind, Winology, True Wine) são todos 2024-2025, sem tração pública relevante. Não há player consolidado em pt-BR (lacuna real), mas o tamanho pequeno dos incumbentes é um alerta. O teste serve exatamente para responder isso.
2. **Web penaliza as 2 maiores alavancas de retenção** (push nativo pleno e widget). Mitigação: PWA instalável + Web Push Android + e-mail + WhatsApp de duplas.
3. **Conteúdo é o gargalo de D30**, não código. Se as 30 lições + prática infinita não estiverem prontas no lançamento, o teste mede falta de conteúdo, não demanda.
4. **Aquisição não está no plano ainda**: 2.000-5.000 cadastros precisam de canais (parceiros mapeados na pesquisa: @fleury_sommelier, @confrariavinhonegro, @abelladovinho; e-commerce como Evino faz educação como marketing — possível parceria). Definir verba/canais antes do F4.
