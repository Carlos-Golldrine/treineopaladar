Tudo verde. Resultado final:

## Arquivos criados (src/onboarding/, pasta nova)

- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\conteudo.ts` (Lição 1 como objeto Licao real do engine com fichaCanonica revisada; mapa das 7 jogadas: J1 impossível de errar, J2 sensorial, J4 pegadinha honesta dos 20 minutos de geladeira, J5 em 3 variantes trocadas pelo objetivo, J7 consolidação padrão Portal; cartas de objetivo e nível; todas as falas do mascote com teto de 8 palavras)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Licao1.tsx` (rota `/licao-1`: fluxo real rodando sobre o store REAL via iniciarLicao/responder/finalizarLicao, com grace de vida, reinserção de erro fechando o ciclo acertando e barra que nunca regride; J3 e J6 como interstitials entre jogadas do engine; J6 cortada e nível inferido como iniciante com 2+ tropeços; modo demo `?cena=j1|j3|erro|conclusao|softwall`)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Mascote.tsx` (TchinDuo portado e redesenhado do legacy como SVG próprio em tokens da marca, com faísca dourada e brilhos-olhinhos; MascoteBalao inline e MascoteToast com variantes inline/fixa)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Ilustracoes.tsx` (taça de branco suada com gotas e faísca de gelo + taça de tinto, shape language da Taca da trilha)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\ExVisual.tsx` (J1 com cartas ilustradas, mesmo contrato fase/onResolver e mesmo loop tocar+Conferir do player)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Cartas.tsx` (cartas de 1 toque com ícone ou pontinhos de nível, reação do mascote e Continuar)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Conclusao1.tsx` (aha: XP nomeado pela primeira vez em count-up, tooltip de streak "Dia 1... volte amanhã pelo dia 2", micro-compromisso Leve/Firme em 1 toque gravando definirMetaDiaria(20|40))
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\SoftWall.tsx` ("Salve seu progresso" com o que já existe: XP, dia 1, trilha; "Criar conta" abre stub elegante do beta; "Depois" discreto; zero palavras punitivas)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Splash.tsx` (logo TchinDuo, "Aprenda a confiar no seu paladar.", 1 botão, footer 18+ acolhedor "Beba com moderação: o paladar agradece")
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\Portao.tsx` (1ª visita vai ao splash; depois Trilha direto)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\flags.ts` (chave `tp.ftue.v1`: cristaisColetados e lojaVista, fora do engine)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\RevelacoesTrilha.tsx` (coleta padrão moeda-com-seta do PvZ: cartão com seta saltando, cristal, total e 1 toque)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\onboarding\onboarding.css` (só transform/opacity, 150-250ms ease-out)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\_teste-ftue.mjs` (e2e descartável do fluxo real: 14 passos)

## Arquivos alterados

- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\main.tsx` (rotas `/comecar` e `/licao-1` estáticas no bundle principal para o toque-até-jogada em menos de 10s; Shell embrulhado no PortaoOnboarding)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\Trilha.tsx` (chip de cristais oculto até a coleta e surgindo com pop; overlay de coleta após a primeira lição da trilha; tooltip de loja do mascote só ao zerar vidas, 1 vez)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\shots.mjs` (6 cenas novas + grupos de seed de localStorage: ftue limpo, app concluído, coleta pendente)

`src/engine` e `src/licao` intocados (Player, ExMC, PainelReveal e player.css apenas importados).

## Build e testes

- `npm run build`: limpo. Bundle principal 261,67 kB (gzip 85,64) absorvendo o FTUE inteiro pré-carregado; Player code-split caiu para 22,66 kB (gzip 7,52) porque ExMC/Feedback migraram para o chunk comum; precache PWA 519 kB.
- `npm test`: 51/51 verdes (engine intacto).
- `node shots.mjs`: 38 screenshots (19 cenas x 2 viewports) em `app/_shots/`.
- `node _teste-ftue.mjs`: 14/14 passos verdes no fluxo real (splash, 7 jogadas com engine, tooltip único de vidas, J5 personalizada, J6 com 1 erro, hipercorreção da J4 no fim, meta gravada 20, objetivo mercado, nível iniciante, soft wall, Trilha sem chip de cristais, persistência pós-reload).
- Auditoria de copy: zero travessão, zero emoji, zero vocabulário proibido, zero fórmula "não é X, é Y", nenhuma fala do mascote acima de 8 palavras.

## Autocrítica das screenshots e iteração feita

Olhando as imagens contra o brief, três achados. O grave: o toast do mascote (tooltip de vidas e celebração da J1) flutuava sobre o miolo e, na cena de erro, cobria a pergunta E a opção correta pintada de verde, sabotando o reveal no exato momento da hipercorreção e violando a regra do ruído. Iterei criando uma faixa reservada do mascote entre a barra de progresso e o miolo: o balão entra em fluxo, nunca cobre conteúdo e não empurra nada (altura fixa). O segundo: o splash tinha um vazio desproporcional entre a marca e a frase; o bloco da marca desceu para 16vh e a composição equilibrou (marca no terço superior, frase em Fraunces itálica com filete dourado ancorada embaixo). O terceiro: o número 67 do cartão de coleta ficava solto; ganhou o rótulo "cristais". Resíduos conhecidos e aceitos: a faixa do mascote vazia vira respiro fixo abaixo da barra (deliberado, reserva o palco do mascote), e a faísca de gelo da taça branca na J1 é discreta em 360px mas as gotas de condensação seguram a leitura de "gelado".
