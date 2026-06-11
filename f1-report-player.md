Tudo verde. Resultado final:

## Arquivos criados

- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\Player.tsx` (rota `/licao/:id`: gates de vidas e soft cap, máquina de fases respondendo/aguardando/revelado, snapshot do exercício exibido enquanto o engine avança a fila, modo demo `?cena=` para screenshots, telas de sem-vidas, aviso de pacing e lição não encontrada)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\player.css` (todo o visual do player, só transform/opacity, 150-250ms ease-out)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\tipos.ts` (contrato dos componentes + `vibrar()` 15ms)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\ExMC.tsx`, `ExIntruso.tsx`, `ExDuasVerdades.tsx` (seleção + Conferir, reveal pintado certo/errado, stagger 50ms uma vez por montagem)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\ExSwipe.tsx` (física de arraste com pointer events, rotação proporcional, selos "É assim/Não é" por opacidade, fling 480px, fallback por 2 botões >= 52px, eco de feedback por carta, exercício fecha certo só com deck limpo)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\ExSlider.tsx` (régua 0-100, reveal animado: faixa de tolerância em scaleX + marcador do alvo em pop com delay, distância em pontos na mensagem)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\ExOrdenar.tsx` (arraste vertical com pointer capture e deslocamento das linhas vizinhas, fallback por toque-troca, embaralhado que nunca nasce na ordem correta)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\Feedback.tsx` (PainelCalibrar "Certeza ou chute?", PainelReveal com okMsg/porque, nota de hipercorreção quando certeza+erro ou chute+acerto, "Entenda melhor" expandível com o trecho da fichaCanonica escolhido por sobreposição de palavras com o porquê)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\Conclusao.tsx` (XP em count-up rAF ease-out em JetBrains Mono, cristais, +1 vida em revisão, streak do dia, "Você agora sabe", curiosidade "Para contar na mesa", teaser, confete APENAS em perfeita, aviso de XP reduzido quando o soft cap cortou)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\components\Taca.tsx` (elemento-assinatura: taça SVG própria com clipPath; vazia+cadeado=bloqueada, contorno vinho=disponível, cheia subindo um dedo por coroa=concluída, transbordando dourado com gotas=3 coroas)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\components\Sheet.tsx` (bottom sheet genérico)

## Arquivos alterados

- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\Trilha.tsx` (trilha REAL: content + progresso do engine, taças por estado, pips de coroas, pill "Começar"/"Revisar" por revisão vencida, HUD vivo com sheets de streak/vidas/cristais, contagem regressiva de regeneração ao vivo)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\trilha.css` (nós-taça, pulso do atual, coroas, pill revisar, chama apagada quando streak em risco)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\Desafio.tsx` (countdown REAL até meia-noite de Brasília via Intl/America/Sao_Paulo, tick de 1s, corrige o TODO do F0)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\main.tsx` (rota `/licao/:id` lazy, fora do Shell, sem tab bar)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\app.css` (estilos da folha/bottom sheet)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\shots.mjs` (8 cenas novas: mc, mc-erro, swipe, slider, ordenar, intruso, duasverdades, conclusao)

`src/engine` e `src/content` não foram tocados (só importados).

## Build e testes

- `npm run build` (tsc --noEmit + vite): limpo. Player code-split: `Player.js 27.05 kB (gzip 8.72)`, `Player.css 15.35 kB (gzip 3.17)`, `Trilha.js 8.37 kB (gzip 3.39)`, bundle principal `218.84 kB (gzip 71.75)`, precache PWA 485 kB.
- `npm test`: 51/51 verdes (engine intacto).
- `node shots.mjs`: 24 screenshots (12 cenas x 412x892 e 360x800) em `app/_shots/`.
- Auditoria automática de copy nos arquivos novos: zero travessão, zero emoji, zero vocabulário proibido, zero fórmula "não é X, é Y".

## Autocrítica das screenshots e iteração

Olhando as imagens contra o brief: o conjunto sustenta a identidade (Fraunces nas perguntas, hook em itálico com filete dourado, erro em terroso e nunca vermelho, reveal como folha que sobe, tag Desafio em gold, taças com cadeado sutil); mas três coisas falharam no primeiro passe: o pill "Começar" da trilha colidia com o cartão da unidade, o trilho do slider em neutral-100 praticamente desaparecia sobre o fundo quente, e o confete da lição perfeita caía por cima do texto dos cards "Você agora sabe" e da curiosidade, virando ruído exatamente no momento de leitura do recap. Iterei: padding-top de 64px na trilha (pill agora respira), trilho do slider para neutral-200 com 10px, e o confete passou para trás do conteúdo (z-index 0, rolagem e rodapé elevados) caindo até ~68vh com fade antecipado, o que mantém a celebração nas margens e no topo sem sujar uma única linha de copy. Resíduo conhecido e aceito: a cena estática do swipe mostra a carta de trás espiando embaixo da carta do topo (intencional, dá profundidade ao deck) e a barra de progresso parte de 4% para nunca parecer vazia.
