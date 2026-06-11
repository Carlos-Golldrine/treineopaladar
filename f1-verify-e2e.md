Everything verified. Final consolidated report:

---

## VERIFICACAO INDEPENDENTE F1, Treine seu Paladar

### Tabela PASS/FAIL

| # | Item | Resultado | Evidencia |
|---|------|-----------|-----------|
| 1a | `npm run build` do zero (dist apagado) | PASS | 122 modulos, built in 1.47s, PWA precache 32 entries, zero warnings |
| 1b | `npx tsc --noEmit` | PASS | exit 0, sem saida |
| 1c | `npm run test` (engine) | PASS | 6 arquivos, 51 testes, 0 falhas (vidas, revisao, economia, streak, sessao, store) |
| 1d | Bundle inicial < 150KB gzip | PASS | JS inicial: so `index-smvq3hqa.js` no index.html = **85,6 KB gzip**. Chunks por rota (gzip): Player 7,5 / Trilha 4,0 / Desafio 1,4 / Perfil 0,8 / Mesa 0,5 / shared 9,9 / workbox-window 2,3 (async). CSS 6,0 + por rota. Fontes woff2 subset 18-25 KB cada |
| 2a | Grep emoji em src/ | PASS | 0 ocorrencias (ranges U+1F300-1FAFF, U+2600-27BF, FE0F etc.) |
| 2b | Grep travessao/en-dash em src/ | PASS | 0 ocorrencias de U+2014 e U+2013 (inclusive em comentarios) |
| 2c | Cores proibidas (roxo/indigo/violet + hexes) | PASS | 0 ocorrencias |
| 2d | Vocabulario proibido (usuario, consumidor, premium, expert, ultima chance, erro de iniciante, verdadeiros conhecedores) | PASS | 0 ocorrencias case-insensitive |
| 3a | 1a visita em `/` cai no splash | PASS | redireciona a `/comecar`, splash com botao Começar |
| 3b | Começar abre J1 em ate 3s | PASS | **65ms** ate a pergunta da J1 |
| 3c | Licao 1 completa respondendo de verdade, 1 erro na J4 | PASS | J1 visual, J2, J3 objetivo (payoff: J5 virou "No mercado..."), J4 errada de proposito mostra toast "Errou? Tranquilo. Você tem 5 vidas." + chip de vidas surge (grace: segue 5), J6 nivel, J7, J4 reaparece e e corrigida |
| 3d | Conclusao com XP e streak dia 1 | PASS | "+20 XP" (JetBrains Mono, count-up) + "Dia 1 da sua sequência" |
| 3e | Escolher meta | PASS | carta "Leve" grava `metaDiaria: 20` no store |
| 3f | Soft wall + "Depois" leva a Trilha | PASS | "Salve seu progresso" e Depois navega a `/` |
| 3g | Trilha: no 1 preenchido, no 2 disponivel | PASS* | *Apos a 2a licao do dia: o FTUE e a "Lição 1" e NAO e no da trilha (id `ftue-l1`). Logo apos o soft wall o no 1 (Tanino) esta "Começar" e o resto bloqueado; depois de concluir Tanino, no 1 = taca cheia de vinho + 1 coroa, no 2 (Acidez) = "Começar", no 3 bloqueado. Verificado por classes/SVG no DOM e screenshot. Coerente com a copy do soft wall ("Lição 2 esperando") |
| 3h | Licao 2: errar 2x o mesmo exercicio, ele reaparece antes do fim | PASS | ex0 errado (grace, vidas 5), reaparece com tag "De novo essa, agora vai", errado de novo (vidas 5 para 4), **reaparece pela 2a vez antes do fim** e e corrigido. Todos os 6 tipos jogados de verdade: MC, swipe (5 cartas via botoes), slider (alvo 85), duas verdades + "Certeza ou chute?", intruso + calibracao |
| 3i | localStorage `tp.v1` | PASS | `xpTotal: 40 (>0)`, `streak: 1`, `licoesHoje: 2`, `vidas: 4 (<=5)`, `onboardingCompleto: true`, cristais 70 |
| 3j | Reload persiste e abre na Trilha | PASS | URL `/`, sem splash, xpTotal/streak identicos, HUD streak = 1 |
| 3+ | Console errors durante todo o E2E | PASS | **0 erros** (3 execucoes completas) |
| 5a | Alvos >= 44px nos exercicios | PASS | opcoes MC ~56-100px, cartas visuais 185x172, deck 184x52, slider input 48, Conferir/Cravar 48, fechar 44x44, tab bar 49. **Excecao fora dos exercicios: chips do HUD 57x32 e 64x31** |
| 5b | Foco visivel | PASS | Tab move foco com outline 2px solid #722F37 offset 2 (verificado em runtime) |
| 5c | Contraste sobre wine-700/900 | PASS | texto rgb(250,250,248) sobre #722F37 = ~9,7:1; sobre #4A1F24 = ~12:1 (AAA) |

E2E: 33/33 passos PASS, exit 0. Script: `C:\Users\camargo\Downloads\treino-paladar-app\app\e2e-f1.mjs`. Screenshots (19 + 1 extra): `C:\Users\camargo\Downloads\treino-paladar-app\app\_shots\e2e\` (log completo em `run-log.txt`).

### Problemas por gravidade

**Bloqueantes:** nenhum.

**Importantes:**
1. **Chips do HUD da Trilha com 31-32px de altura** (streak/vidas/cristais, `src/routes/trilha.css`). O brief exige alvos >= 44pt em 100% dos tocaveis (secao 4, item 8). Sao botoes que abrem sheets. Os exercicios passam todos.
2. **Tag "De novo essa, agora vai" aparece na PRIMEIRA tentativa no FTUE** (screenshot 05): em `src/onboarding/Licao1.tsx`, `repetida` e calculado com `ativa.sessao.respostas.some((r) => r.exercicio === passo.indice)` DEPOIS de registrar a resposta, entao a tag surge ja no painel de erro da 1a tentativa. No player da trilha (`Player.tsx`) o calculo e feito ao carregar o exercicio e esta correto. Copy fica sem sentido no momento em que aparece.

**Menores:**
3. Screenshots tirados logo apos transicao pegam elementos a meio fade (J1 com 1 carta visivel pelo stagger, overlay de cristais translucido). Verifiquei o estado assentado do overlay de coleta com captura dedicada (`16b-coleta-assentada.png`): cartao solido, veu ok, sem bug de z-index. So registra que as animacoes de entrada nao tem "reduced motion" curto-circuito para captura.
4. A expectativa "(g) no 1 preenchido logo apos o soft wall" nao e literal: o FTUE nao e no da trilha. E decisao de produto coerente, mas vale alinhar com quem escreveu o criterio.

### Avaliacao visual (contra o brief, 6+ telas olhadas como imagem)

A taca-assinatura esta presente e funciona: vazia com contorno vinho no disponivel, cheia de vinho com coroa dourada no concluido, cadeado no bojo quando bloqueada, e o resultado parece produto, nao prototipo. Fraunces carrega o display em todas as telas certas, com italica exatamente nos momentos de celebracao ("Seu paladar acordou.", teasers), e os numeros (XP, cristais, 70) falam em JetBrains Mono como mandado. Celebracao esta concentrada: conclusao imperfeita veio sem confete, erro em tom terroso acolhedor, toast do mascote curto; nada de festa espalhada. A trilha com unit card vinho-900, pill "Começar" e tab bar propria tem cara de app nativo de verdade; nenhum cheiro de "AI slop" (sem roxo, sem hero centralizado, sem cream+serifada default). Critica honesta: as telas de exercicio deixam um vazio vertical grande no meio em 412x892 (conteudo ancorado no topo, botao no rodape), e os chips do HUD sao visualmente miudos perto do resto, os dois unicos pontos onde o capricho cai.

### Veredito geral

**APROVADO com 2 ressalvas importantes e nada bloqueante.** Build, typecheck e 51 testes limpos; bundle inicial 85,6 KB gzip (43% abaixo do teto); todos os greps de proibicoes do brief zerados; o fluxo FTUE completo + licao da trilha funciona de ponta a ponta com engine honesto (grace de vida, reinsercao de erro 2x, persistencia, rollover) e zero erros de console. Corrigir os alvos do HUD e a tag "De novo essa" do FTUE antes de fechar o F1.
