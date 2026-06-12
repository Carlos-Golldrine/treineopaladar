All screenshots reviewed. The verification is complete — final report:

---

## Verificação independente F2 — Treine seu Paladar

Builders NÃO foram confiados: build do zero (`rm -rf dist node_modules` + `npm ci`), greps próprios, e2e novo escrito do zero (`C:\Users\camargo\Downloads\treino-paladar-app\app\e2e-f2.mjs`), 12 screenshots inspecionados como imagem.

### Tabela PASS/FAIL

| # | Checagem | Resultado |
|---|---|---|
| 1a | Build do zero (`npm ci` + `npm run build`) | PASS (limpo, 2.75s) |
| 1b | `npx tsc --noEmit` | PASS |
| 1c | `npm run test` | PASS (58/58, 7 suites) |
| 1d | Bundle inicial < 150KB gzip | PASS (~92.5KB: index.js 86.4 + css 6.1; zero import estático de outro chunk) |
| 1e | banco-pratica/desafios fora do chunk inicial | PASS (chunks lazy próprios, import dinâmico nas rotas) |
| 1f | banco-pratica/desafios fora do **precache** | **FAIL** (ambos estão no `sw.js`: `assets/banco-pratica-CUNhnFgS.js` 281KB e `assets/desafios-Bt3fTp52.js` 70KB) |
| 2a | Grep emoji pictográfico em src/ | PASS (0) |
| 2b | Grep travessão/en-dash | PASS (0, inclusive nos 30 JSONs de conteúdo) |
| 2c | Grep roxo/índigo | PASS (0; "violeta" achado é aroma de vinho) |
| 2d | Vocabulário proibido | PASS ("consumidores" só em comentário de código do engine, não em copy) |
| 3a | Seed tp.v1 pós-onboarding abre direto na Trilha | PASS |
| 3b | Trilha com 6 unidades, 2-6 bloqueadas | PASS |
| 3c | Unidade 1 completa injetada abre a unidade 2 | PASS |
| 3d | Lição u2-l1 jogada de verdade (9 exercícios: mc, swipe, slider, duas verdades, intruso, calibração) | PASS |
| 3e | Prática livre: cartão visível, 8/8 respondidas lendo DOM, rótulo real de /rotulos/ carregado | PASS |
| 3f | Desafio do Dia: 4/4, grade ■■■■, +30 XP no store, 2ª visita não rejoga | PASS |
| 3g | xpTotal 60→125, cristais 60→77, tudo sobrevive a reload | PASS |
| 3h | 0 erros de console no fluxo inteiro | PASS |

### Problemas por gravidade

**MÉDIO**
1. **Precache do SW inclui o banco da prática e os desafios** (`vite.config.ts:43`): `globPatterns: ['**/*.{js,css,html,png,svg,woff2}']` captura os chunks lazy `banco-pratica-*.js` e `desafios-*.js`; o `globIgnores` só exclui `/rotulos/**`. Precache total: 1.055KB / 37 entradas. Contraria o requisito explícito; todo Android de entrada baixa ~351KB raw a mais na instalação do SW. Fix de 1 linha: somar `'**/banco-pratica-*.js', '**/desafios-*.js'` ao `globIgnores` (eles já têm hash e cairiam bem em runtime caching).

**BAIXO**
2. As 30 lições inteiras viajam num chunk único de 191KB raw / 57KB gzip (`flag-fill-D4ZbLrcy.js`, o barrel `src/content/index.ts`) carregado junto com a Trilha. Não fere o orçamento (é lazy), mas com unidades 7+ vai inchar; split por unidade seria o próximo passo.
3. Telas do player têm faixa morta vertical grande em 892px (opções no topo, Conferir colado embaixo). Defensável como thumb-reach, mas o deck do swipe flutua sozinho no meio de muito vazio.

**INFO**
4. Os dois primeiros flakes do e2e foram do meu script (screenshot durante animação de entrada; foco adaptativo da rodada fugindo de "rótulo"), não do app. Corrigidos com wait pós-animação e seed de scorePaladar; 3 execuções verdes consecutivas.

### Avaliação visual (12 shots em `app\_shots\e2e-f2\`)

1. A trilha com 6 unidades é legível e tem hierarquia de verdade: card da unidade aberta em wine com Fraunces, bloqueadas como cartões discretos tracejados com "Abre quando a unidade N estiver completa", zero cara de template de IA.
2. O elemento-assinatura funciona: taça que se enche de vinho ao concluir, coroa ganha, pill "Começar" no nó atual; é o melhor momento do produto.
3. O Desafio do Dia é a tela mais bonita: rótulo real (Luigi Bosca) sobre card vinho, CTA gold, grade de 4 quadrados, vinho revelado com uva/país/faixa de preço e contagem regressiva em mono. Parece produto lançado.
4. A prática com garrafa real (Brunello em garrafa escura sobre card branco) convence; copy "seu próximo ponto forte" é a voz Mago no ponto.
5. Senões honestos: o card bloqueado da unidade 2 fica apertado com o botão "Abrir antes" ao lado do título em 2 linhas; e o swipe tem um vazio grande entre a carta e os botões "Não é / É assim".

### Veredito

**APROVADO COM RESSALVA.** Código, conteúdo, engine e fluxo F2 estão sólidos: build/typecheck/testes limpos, todos os 9 passos do e2e passam com 0 erros de console, persistência correta, brief respeitado na copy e no visual. A única falha objetiva contra a spec é o precache do service worker carregando os dois chunks de conteúdo lazy (item MÉDIO acima), correção trivial em `vite.config.ts` antes de fechar a fase.
