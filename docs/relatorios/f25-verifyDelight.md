VERIFICACAO INDEPENDENTE DE DELIGHT, Treine seu Paladar (evidencias em `C:\Users\camargo\Downloads\treino-paladar-app\app\_verify\`, scripts proprios `_verify-delight.mjs` e `_probe-piscada.mjs`, sem reaproveitar relatorios anteriores)

## Tabela PASS/FAIL (checklist secao 7 + greps + som + performance)

| Item | Veredito | Evidencia |
|---|---|---|
| Grep material-symbols (src + package.json) | PASS | Zero ocorrencias; unica mencao e comentario em `src/icones/Icones.tsx:3` dizendo que foi banido |
| Grep emoji / travessao / vocabulario proibido | PASS | Zero emoji, zero en/em dash, zero "premium/expert/usuario/ultima chance". Unico achado: "consumidores" em comentario de codigo `src/engine/types.ts:5` (nao e UI) |
| 7.1 Mascote vivo (idle, erro, ensina, celebra) | **FAIL parcial** | Idle: pisca de verdade (anims de 140ms detectadas a 3,9s / 8,2s / 11,3s) e segue vivo apos 30s parado (diffs 533-1516px). Erro, ensina (micro-aula) e celebra: vivos. **Acerto comum: mascote AUSENTE e tela congela** (ver rajadas mortas) |
| 7.2 Interacao < 100ms com motion fisico | PASS | Pressed state desenhado ja no frame +120ms; springs amostradas via WAAPI (`springs.ts`), interrompiveis |
| 7.3 Botao 3D que afunda | PASS | `botao3d-f00` (borda inferior grossa) vs `f01-press` segurado (afundado, borda colapsada) |
| 7.4 Coreografia propria por marco | PASS | Chama: apagada em f00, acesa com particulas em f02 (crop). Odometro: +23 rolando para +25 entre frames. Taca enche com onda + coroa aparece (taca-enche f01 vs f04). Bau: verificado so por codigo (balanca + pop + faiscas, `Coreografias.tsx:217`) |
| 7.5 Arte proprietaria em toda tela | PASS | Splash/trilha/licao/conclusao/micro-aula/desafio fortes. Mesa e a mais fraca (so o icone 44px) |
| 7.6 Som de jogo | PASS | `som.ts`: sintese 100% runtime (osciladores + envelopes, zero assets), toggle "Sons do treino" no Perfil persistido em `tp.som.v1`, AudioContext criado so no primeiro pointerdown; `tocar()` antes de gesto fica suspenso e mudo (politica de autoplay respeitada) |
| 7.7 Rajadas de frames | **FAIL em 1 de 9** | 8 rajadas vivas, 1 morta (abaixo) |
| 7.8 Marca-mae | PASS | Splash: lockup "BY TCHIN TCHIN" + chip Beta visiveis; Perfil idem; soft wall tem "Parte do ecossistema Tchin Tchin" (`SoftWall.tsx:50`). Nota: LogoTchin vive em `src/icones/LogoTchin.tsx`, o brief aponta `src/components/` |
| Bundle inicial < 150KB gzip | PASS com alerta | Entry `index-Be9XsUWO.js` = 91,6KB gz (FTUE total com workbox ~94KB). Porem a primeira tela logada (Trilha) baixa 159,1KB gz de JS (entry + chunk compartilhado 56,9 + Trilha 5,1 + MicroAula 3,2), acima do orcamento se lido como "primeira tela" |
| Animacoes so transform/opacity | PASS | Auditados os 28 @keyframes e todos os 14 `el.animate()`: nada alem de transform/opacity. Honra prefers-reduced-motion em todo lugar |
| Canvas do confete limitado | PASS | Max 40 pecas, 1,2s, DPR cap 2, rAF cancelado e canvas limpo (`Coreografias.tsx:138-205`) |

## Rajadas mortas encontradas

**1 rajada morta: acerto comum no player.** Cliquei a opcao correta de verdade em `/licao/u1-l1?cena=mc` e capturei 6 frames a 200ms: diffs = [330205, 0, 0, 0, 0]. O painel verde sobe no primeiro frame e depois a tela fica BYTE-IDENTICA por 800ms+. Causa no codigo: `Feedback.tsx:85`, `mascoteEmCena = comMascote && (!correto || marco)`, ou seja o Tchin so entra no erro ou no ultimo acerto da rodada, e o TchinObservador sai durante o reveal. Ha tensao real entre a secao 3 (dia a dia discreto) e o item 7.1 ("presente no feedback de erro/acerto"); como esta escrito, e FAIL. Todas as outras 8 rajadas (splash idle 30s, erro, conclusao com confete+odometro+chama, taca, botao 3D, flip da carta, micro-aula, olhos densos 50 frames) tem frames distintos.

## Carisma do mascote (avaliacao honesta, olhando de perto)

O Tchin tem carisma genuino e nao e assustador. A anatomia "bojo = cabeca com vinho vivo dentro" e uma ideia propria, nao um template: o vinho balanca em onda continua, os olhos tem brilho e seguem o botao Comecar, e a piscada com jitter (as vezes dupla) vende vida. As sobrancelhas grossas coladas nos olhos dao um ar levemente preocupado/serio no idle de perto; e mais "tio carrancudo simpatico" que "fofo Duolingo", o que ate combina com vinho, mas vale saber que e essa a personalidade. No celebra, a segunda taca entrando para brindar com faisca e o melhor momento do personagem e amarra com a logo da marca. A versao micro (toast de erro "Errou? Tranquilo" e observador no rodape) mantem a silhueta legivel. Os icones do set compartilham o traco 2,25-2,5 arredondado e o duotone ouro/vinho nas 4 telas comparadas (tab bar, desafio, perfil, placar): consistentes e com cara propria, a chama e o cristal nao parecem estoque. Nada aqui grita template de IA; o que mais se aproxima de generico e a tela Mesa (card + icone, sem cena) e o avatar "V" do Perfil.

## Problemas por gravidade

- **ALTO: acerto comum e cena morta.** Sem mascote e sem nenhum motion apos 200ms do reveal (unica rajada reprovada). Corrigir em `src/licao/Feedback.tsx:85` (ex.: Tchin feliz discreto tambem no acerto comum, ou manter o observador reagindo).
- **MEDIO: orcamento JS da primeira tela logada estourado** (159KB gz vs 150). `Trilha.tsx:12` importa `MicroAula` estaticamente, puxando o chunk no load; e o chunk compartilhado de 56,9KB merece auditoria de conteudo.
- **MEDIO: Perfil com dados falsos hardcoded** (`Perfil.tsx:33-43`: streak 1, 65 cristais, 80 XP, "Treinando desde hoje") enquanto a Trilha mostra a carteira real (230 cristais no mesmo seed). Quebra confianca em teste com gente de verdade.
- **BAIXO: chama acesa dourada com streak 0** no header da Trilha (`Trilha.tsx:143` so apaga se "em risco"); chama cheia com "0" ao lado e leitura estranha.
- **BAIXO: LogoTchin fora do caminho documentado** no brief (esta em `icones/`, brief diz `components/`). Atualizar o brief ou mover.
- **BAIXO: "consumidores" em comentario** de `engine/types.ts` (nao e UI, mas o vocabulario vaza para quem mantem).

## Veredito

**APROVADO COM RESSALVA.** O app tem alma de verdade e mensuravel: piscada provada por instrumentacao, 8 de 9 rajadas vivas, coreografias distintas por marco, som sintetizado correto e disciplinado, zero icone de estoque, marca-mae presente nos tres pontos. A unica cena de emocao morta e exatamente a mais frequente do jogo (acerto comum), o que viola o item 1 e o item 7 do proprio checklist e e barata de corrigir. Resolver o acerto + o orcamento da Trilha + o Perfil hardcoded antes de chamar a F2.5 de fechada.
