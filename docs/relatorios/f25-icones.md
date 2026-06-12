Build passes clean (`npm run build` including `tsc --noEmit`, plus standalone `npx tsc --noEmit`). Final summary:

ENTREGUE — set proprietário em `C:\Users\camargo\Downloads\treino-paladar-app\app\src\icones\` (nada fora dela foi tocado, exceto os PNGs de `app\public\icons\` e os screenshots em `app\_shots\icones\`, ambos pedidos no escopo):

1. `Icones.tsx` — `<Ic nome size label />`, traço currentColor (default wine-900), duotone gold-500/wine-100 (1 área por ícone), grid 24, traço 2.25–2.5 round. 40 ícones exportados (`NomeIcone`, `NOMES_ICONES`):
chama-streak, chama-apagada, coracao-vida, coracao-vazio, cristal, raio-energia, coroa, estrela, presente-bau, cadeado, bandeira-meta, mapa-trilha, alvo-desafio, mesa, perfil-taca, check, x-fechar, seta-voltar, seta-direita, seta-baixo, compartilhar, som-on, som-off, ajuda, livro-flashcard, lampada-dica, play, pausa, relogio, ampulheta, garrafa, taca, saca-rolhas, uvas, regua-slider, balanca-comparar, casa, restaurante, cesta-mercado, arrastar.
Cobre 100% dos usos atuais de Material Symbols (grep: route, target, table_restaurant, fire, favorite, cart, restaurant, home, check, close, diamond, flag, drag_indicator, chevrons/arrow_downward, bolt, wine_bar, hourglass, crown, lock, share) + os das fases seguintes. wine-100 (#F2E3E1) ganhou papel nomeado no arquivo.

2. `Emblemas.tsx` — `<Emblema unidade={1..6} size />`, 64x64 multi-cor em medalhão: U1 língua+lábio+3 gotas de sabor, U2 cacho tinto com folha e gavinha, U3 taça de branco com bolhas, U4 rótulo com faixa vinho e selo de ouro, U5 garfo+taça+prato com faísca, U6 cordilheira com neve, sol e bandeira no cume.

3. `LogoTchin.tsx` — slot único com porte fiel do tt-glasses de `tchin-social-v2\_tchin.js`, comentário destacado "PROVISORIO: substituir pela logo oficial quando o Gabriel anexar a pasta", viewBox 0 0 24 24 e props estáveis para troca sem tocar chamadores.

4. `gen-icone-app.py` — regenerou os 5 PNGs de `app\public\icons\` (192/512/maskable 192-512/apple-touch): taça-personagem do mascote (duas taças brindando, olhinhos, líquido dourado, faísca) em traço cream sobre wine-700, supersample 1024 + LANCZOS, maskable a 74% da zona segura.

5. Folha de contato: `app\_shots\icones\folha-contato.html` + `folha-contato.png` (e `_v2-app-icons.png` com os ícones do app). Gerador reaproveitável: `src\icones\folha-contato.mjs` (renderiza os TSX reais via Vite SSR).

AUTOCRÍTICA da folha (1 iteração feita):
- Reprovados na v1 e corrigidos: mapa-trilha lia como taco de golfe (virou zigue-zague com paradas e chegada de ouro); mesa tinha a faísca colada no tampo (subiu e encolheu); uvas viravam blob (cacho 2-2-1 escalonado, folha maior); emblema U1 lia como escudo (ganhou barra de lábio e língua arredondada).
- Pontos fortes confirmados: peso de traço uniforme nas 3 linhas de teste (40px, chrome escuro wine-700, 24px real); os preenchimentos duotone seguram no escuro; taca/mesa/balanca repetem o pé sorridente do mascote (assinatura de família); nada com cara de Material.
- Resíduos honestos (aceitos nesta rodada): U1 ainda flerta com "sino" sem o contexto das gotas; livro-flashcard a 24px tangencia "copiar"; no ícone do app os pés das taças se cruzam de leve no centro (lê como mesinha ondulada, charmoso mas não intencional); compartilhar com hub de ouro fica sutil a 24px.
