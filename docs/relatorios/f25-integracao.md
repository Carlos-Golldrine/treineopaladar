## Alma integrada ao app — build limpo

**Verificação final:** `npm run build` (inclui `tsc --noEmit`) passa, `npx tsc --noEmit` isolado passa, `npm run test` 58/58. Bundle inicial: **91,3 KB JS + 7,5 KB CSS gzip ≈ 99 KB** (orçamento 150 KB). Grep final: **zero "material-symbols"** em src, package.json e package-lock (pacote desinstalado via npm).

### Arquivos novos
- `app\src\som\som.ts` — paleta sonora sintetizada em runtime (Web Audio, zero assets): acerto (2 notas subindo E5/B5), erro (thud grave com queda de tom + lowpass, nunca buzzer), conclusão (acorde A maior em triangle), marco (arpejo C5/E5/G5 + brilho agudo), moeda (blip B5/E6). Master gain 0,12; desbloqueio no primeiro pointerdown; toggle persistido em `tp.som.v1`.
- `app\src\coreografia\Coreografias.tsx` + `coreografia.css` — ChamaStreak, Odometro, ConfeteFisica, BauRecompensa, TchinObservador.

### Arquivos alterados (principais)
`components\TabBar.tsx`, `components\Taca.tsx` (prop `enche`), `licao\Player.tsx`, `licao\Feedback.tsx`, `licao\Conclusao.tsx`, `licao\tipos.ts` (handshake `tp.anim.v1` player→trilha), `licao\Ex*.tsx`, `routes\Trilha.tsx`, `routes\Pratica.tsx`, `routes\Desafio.tsx`, `routes\Mesa.tsx`, `routes\Perfil.tsx` (toggle som + selo Beta), `onboarding\{Splash,Licao1,Cartas,Conclusao1,SoftWall,RevelacoesTrilha,ExVisual,conteudo.ts}`, `main.tsx` (rota do player virou lazy de rota para a View Transition capturar a tela pronta; `/mascote` só em DEV), CSS: `design\base.css`, `app.css`, `trilha.css`, `player.css`, `onboarding.css`, `perfil.css`. Deletado: `components\Icon.tsx`. `shots.mjs` ganhou modo RAJADA (5 frames, 250ms) e seed próprio para a taça.

### O que cada coreografia faz
- **Chama acende**: na conclusão que garante o dia (`streakEmRisco` antes vs depois de finalizar) e no dia 1 do FTUE, o glifo troca de chama-apagada para chama-streak com squash & stretch do pé da chama e 6 partículas âmbar/ouro subindo escalonadas.
- **Taça enche**: o player grava `tp.anim.v1`; a Trilha consome na montagem e o grupo do vinho do nó sobe de baixo do bojo com overshoot de mola enquanto a superfície ondula (scaleX/scaleY), clip parado, só transform.
- **Coroa cai**: a coroa nova entra com queda + bounce duplo, atrasada 1,25s para aterrissar DEPOIS da taça encher (sequência legível).
- **Odômetro de XP**: cada dígito é uma fita vertical; unidades dão até 2 voltas completas, dezenas sobem devagar, mesmo easing (cubic-bezier 0.16,1,0.3,1). Em Conclusao, Conclusao1 e resultado da prática.
- **Baú abre**: na revelação de cristais, o baú balança 2x (antecipação), abre com pop (cristal salta com overshoot) + 4 faíscas, e toca o blip de moeda no instante do pop.
- **Confete física**: canvas, 40 peças, gravidade 880px/s², rotação, fade nos últimos 240ms, para em 1,2s e limpa.
- **Botão 3D**: `.btn-jogo` com sombra dura 0 4px 0 derivada por papel (wine-900, ok escuro, warm escuro, gold-700) que afunda para 0 1px 0 + translateY(3px) no :active; disabled sem sombra.
- **View Transition**: o círculo do nó tocado recebe `view-transition-name: licao-zoom` e vira a tela do player (morph 300ms); rota lazy de router garante snapshot sem fallback vazio; fallback sem animação e `prefers-reduced-motion` desliga.

### Autocrítica das rajadas (olhei todas, nenhum frame idêntico por hash nem por olho)
- **Reprovado e corrigido (iteração 1)**: a rajada da taça capturou a animação FORA da tela (seed com U1 completa auto-scrollava para a U2); novo seed com 2 lições deixa o nó na viewport e os frames mostram vinho a meio bojo → cheio → coroa aterrissando. O TchinObservador nascia escondido atrás do botão Conferir (e vazava através dos botões outline do deck); subiu para o respiro acima do CTA, onde agora aparece inteiro observando.
- **Aprovado**: botão 3D mostra claramente borda erguida em f0 e afundada com sombra de 1px em f2; odômetro pega +00 → +23 (dígito no meio do rolo) → +25; chama passa de apagada a acesa com confete físico em queda em frames distintos; conclusão tem o celebra com a segunda taça brindando.
- **Limites honestos**: o mascote do toast do FTUE (36px) transmite pouco da pose lamenta nesse tamanho, vive mais pela onda do vinho; as partículas da chama a 20px são sutis em screenshot (legíveis ao vivo); o morph da View Transition não é capturável pelo shots.mjs (verificado só por código e fallback); e o frame 0 da conclusão pega o mascote ainda em opacity baixa da entrada, o que é o transiente esperado, não um bug.
