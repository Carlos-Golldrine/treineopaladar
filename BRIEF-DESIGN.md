# BRIEF DE DESIGN — Treine seu Paladar (standalone, by Tchin Tchin)
## Autoguia obrigatório. Ler antes de QUALQUER tela. Nenhuma lacuna é preenchida com "default de IA".

> Síntese das práticas da skill oficial `frontend-design` (anthropics/skills), Web Interface Guidelines (Vercel/Rauno Freiberg), Emil Kowalski (animations.dev), design.duolingo.com e checklist PWA (web.dev). Fontes detalhadas na pesquisa de 11/jun/2026.

---

## 1. PROIBIÇÕES ABSOLUTAS (verbatim, sem exceção)

**Na UI:**
- Emoji em qualquer texto de interface
- **Ícone de estoque (Material Symbols, Font Awesome, qualquer biblioteca)**: todo ícone é SVG proprietário do set do app, traço grosso arredondado, duotone vinho/dourado (revisão de 12/jun: Material Symbols denunciava template e foi banido da UI final)
- Gradiente roxo/índigo; qualquer roxo como acento
- Glassmorphism sem função; sombras grandes difusas em tudo
- Hero centralizado + 3 cards com iconezinho; layout tudo-centralizado
- Border-radius uniforme em todos os elementos (definir 3 raios distintos e usar com intenção)
- Inter/Roboto como fonte display (Inter só como UI/corpo, papel definido)
- Fade-in genérico em todos os elementos; animação espalhada sem hierarquia
- Os "novos defaults" de IA: creme #F4F1EA + serifada + terracota; dark + verde-ácido; layout broadsheet com hairlines

**Na copy:**
- Travessão (em dash e en dash). Vírgula, ponto e dois-pontos resolvem.
- Fórmulas de IA: "não é X, é Y", tricolons retóricos, "e isso importa"
- Jargão enológico sem tradução; tom professor/enciclopédia
- Vocabulário proibido da marca: usuário, consumidor, premium, expert (rótulo), "última chance", "para verdadeiros conhecedores", "erro de iniciante"
- Terminologia de IA: nada de "gerado por IA", "assistente", "inteligente/smart", interfaces de chat/prompt

**Nunca aceitar a primeira geração de uma tela.** Toda tela passa por: gerar → screenshot (412×892 e 360×800) → autocrítica contra este brief → revisar.

---

## 2. IDENTIDADE (herdada do Tchin Tchin, elevada)

**Cores (hex travados, papéis fixos):**
- `wine-900 #4A1F24` (texto display, fundos profundos) · `wine-700 #722F37` (ação primária, seleção)
- `gold-500 #D4A574` (recompensa, destaque, cristais) · `gold-700 #B8894A` (tier médio de match)
- `bg #FAFAF8` (fundo base, quente, nunca branco puro)
- Semânticas: verde acerto `s700`, erro em tom terroso `#A0522D` (nunca vermelho agressivo: errar faz parte)
- Neutros quentes próprios (não cinza azulado de framework)
- Cor de XP/energia: derivar do gold; cor de streak: âmbar/fogo próprio. NUNCA introduzir cor nova sem nomear papel.

**Tipografia (papéis fixos):**
- **Fraunces** (display, 600, itálica em momentos de celebração) — carrega a personalidade
- **Inter** (UI/corpo, 14-16px; inputs SEMPRE ≥ 16px para não dar zoom no iOS)
- **JetBrains Mono** (números: XP, streak, cristais, cronômetro) — dados têm voz própria
- Escala modular definida: 13 / 15 / 17 / 22 / 28 / 36

**Elemento-assinatura (gastar ousadia AQUI, sobriedade no resto):**
O mascote Tchin (duas taças brindando) + o nó da trilha como taça que se preenche de vinho conforme o progresso. Ilustração proprietária flat com shape language consistente (padrão Duolingo: personalidade vem da ilustração, não de gradiente).

**Grid e espaço:** 8pt (4/8/12/16/24/32). Raios: 8 (inputs/chips), 16 (cards), pill (botões de ação). Sombras: 2 níveis, tingidas de vinho (`rgba(74,31,36,…)`), nunca preto puro.

**Voz:** Mago 70% + Sábio 30%. "Esse vinho lembra…" e nunca "apresenta notas de…". "Que tal experimentar?" e nunca "você deveria". Frases curtas, calor humano, celebra descoberta. Teste do amigo: soa como um amigo apaixonado por vinho, não como sommelier de filme.

---

## 3. MOTION (regras de Emil Kowalski + Duolingo)

- Default `ease-out`; interações 150-250ms; nada acima de 300ms em resposta a toque
- Animar SÓ `transform` e `opacity` (60fps em Android mid-range)
- Animações interruptíveis; nunca bloquear input esperando animação
- **Celebração concentrada em marcos**: confete/festa SÓ em fim de lição perfeita, marco de streak (7/14/30), subida de liga, badge. No dia a dia: feedback discreto (cor + micro-escala 0.98 + vibração 15ms no Android)
- Resposta certa: pop sutil 180ms. Errada: shake curto 280ms + tom terroso (nunca punitivo)
- Stagger de entrada de opções: 45-55ms entre itens, uma vez só (não re-animar em re-render)
- Anel de meta diária: stroke-dashoffset 500ms ease-out
- View Transitions API para navegação push/pop entre telas (fallback: sem animação, nunca animação JS pesada)

---

## 4. PARECER APP NATIVO (PWA, checklist técnico)

1. Manifest: `display: standalone`, `theme_color #722F37`, `background_color #FAFAF8`, ícone maskable, screenshots
2. iOS: `apple-mobile-web-app-capable`, `status-bar-style`, `apple-touch-icon`, startup images; testar em iOS real (regressões de fullscreen no iOS 26)
3. `viewport-fit=cover` + `env(safe-area-inset-*)` no header e na tab bar (com `max()` e fallback)
4. `overscroll-behavior: none` em standalone (mata pull-to-refresh e bounce)
5. `-webkit-tap-highlight-color: transparent` + estado `:active` DESENHADO em 100% dos tocáveis (< 100ms)
6. `touch-action: manipulation` global; `user-select: none` no chrome do app (conteúdo continua selecionável)
7. `@media (hover: hover)` para não vazar hover em touch
8. Alvos de toque ≥ 44pt; tab bar fixa inferior
9. `navigator.vibrate(15)` em acerto/erro (Android only, progressive enhancement; iOS não suporta)
10. Service worker + precache do app shell: abertura instantânea, offline básico
11. Prompt de instalação PWA com primer próprio, disparado após a 1ª lição completa (nunca no load)
12. Skeletons só após ~300ms (não piscar loading em conexão boa)

---

## 5. ORÇAMENTO DE PERFORMANCE (público 82% Android)

- INP < 200ms e LCP < 2,5s medidos com CPU 4x throttle (Moto G class)
- JS mínimo no caminho crítico; code-splitting por rota; tarefas longas < 50ms
- Imagens AVIF/WebP responsivas; fontes com subset + `font-display: swap`
- Testar toda feature em 360×800 além de 412×892

---

## 6. WORKFLOW DE QUALIDADE

1. Skills: usar os princípios da `frontend-design` (anthropics/skills) como processo: definir tokens e wireframe ASCII ANTES do código de cada tela nova; crítica; código; autocrítica via screenshot
2. Gate de review por tela: checar contra as Web Interface Guidelines (Vercel) e contra a seção 1 deste brief
3. Screenshot loop: Playwright (já existe `render.mjs` no padrão dos protótipos) em 412×892 e 360×800
4. Estados obrigatórios por tela: padrão, vazio, carregando, erro, offline. Caminho triste tem o mesmo capricho do feliz ("Garrafa não encontrada" acolhedor, nunca 404)
5. Toda decisão visual nova entra neste brief; o brief é a fonte da verdade, não a memória da conversa

---

## 7. DELIGHT CHECKLIST (gate obrigatório por tela, desde 12/jun)

A lição da F2: conformidade não é alma. Screenshot estática não enxerga vida. Regras:

1. **Mascote vivo**: o Tchin é um boneco rigado em camadas SVG com máquina de estados (idle respira e pisca, feliz pula com o vinho balançando, lamenta com gentileza, ensina apontando, celebra brindando). Presente na J1, no feedback de erro/acerto e em toda celebração. Nunca estático em cena de emoção.
2. **Toda interação responde em menos de 100ms com motion físico** (spring/ease-out), não fade genérico.
3. **Botões de ação no padrão 3D de jogo**: borda inferior grossa que afunda no toque (translateY + sombra), o sinal mais barato de "jogo, não site".
4. **Todo marco tem coreografia própria**: chama do streak acende com partículas; taça da trilha enche com onda; XP roda em odômetro; baú abre; coroa cai com bounce. Celebração concentrada nos marcos, dia a dia discreto (regra antiga mantida).
5. **Nenhuma tela sem pelo menos uma peça de arte proprietária** (mascote, emblema de unidade, ilustração de cena ou ícone do set).
6. **Som de jogo** (acerto, erro, conclusão, marco): sintetizado em runtime via Web Audio (zero assets), com toggle de mudo no Perfil, desbloqueado na primeira interação.
7. **Review de motion por rajada de frames**: toda verificação visual captura 4-6 frames durante as animações (não só o estado final); se os frames são idênticos, a tela está morta e reprova.
8. **Marca-mãe sempre presente**: lockup "by Tchin Tchin" + selo Beta no splash e no Perfil; linha de ecossistema na soft wall. Logo oficial em `app/src/icones/LogoTchin.tsx` (slot único; asset provisório até a logo real do Gabriel entrar).
