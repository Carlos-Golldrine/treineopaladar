# Notificações estilo Duolingo no PWA — estratégia, limites e biblioteca de copy

> Pesquisa + síntese, jun/2026. Fontes: Apple Developer (web push em PWA), MDN (Push/Notifications API), Lenny's Newsletter / Jorge Mazal (sistema do Duolingo), WSJ e r/duolingo (persona e copy), guias de re-engajamento (DynamicYield, Airship, WebEngage). Cruza com a pesquisa de retenção já feita em `DIAGNOSTICO-E-PLANO.md` e a DD de público em `dd-publico/`.

## 1. A realidade do PWA (o que dá e o que NÃO dá)

Notificação no PWA usa o trio padrão: **Push API + Notifications API + Service Worker**, autenticado por **VAPID**. Mas tem restrições duras que definem a arquitetura:

| Capacidade | Android (Chrome) | iOS/iPadOS (Safari) |
|---|---|---|
| Web Push (app fechado, via SW) | **Sim, pleno** | Só **iOS 16.4+** E só com o PWA **adicionado à Tela de Início** (instalado). Em aba do Safari: não existe push |
| Permissão | prompt em aba ou instalado, sempre a partir de gesto | só depois de instalar, a partir de gesto |
| Badge no ícone (`navigator.setAppBadge`) | sim (instalado) | sim (16.4+ instalado) |
| Botões de ação na notificação | sim | limitado/ausente |
| **Notificação local agendada** ("lembrar amanhã às 20h") | **NÃO existe no web** (a Notification Triggers API nunca shipou) | **NÃO existe** |

**A consequência que manda em tudo:** como não há agendamento local, **todo lembrete temporizado tem que sair de um servidor de push** (um cron que calcula quem precisa e dispara Web Push). Não dá pra "agendar no aparelho" como app nativo. Logo, precisamos de um backend de push (Supabase + Edge Function cron + VAPID).

**Implicação de público (nossa DD):** 82% Android (origem: GA4/Firebase do app) = Web Push pleno para a maioria. iOS exige instalar o PWA (atrito real); para quem não instala, o **e-mail é o canal de reengajamento** (já estava no plano). Resumo da estratégia de canais, em ordem:
1. **Web Push (Android)** — o motor, igual ao Duolingo.
2. **Badge no ícone** — o "1" quando a ofensiva está em risco (instalado, Android + iOS).
3. **E-mail (Resend)** — recap semanal, recuperação de streak, e o canal de quem está no iOS sem instalar.
4. **WhatsApp das duplas** — convite/lembrete de Dupla de Degustação (loop de aquisição + social accountability).

Regra de ouro técnica do Chrome: **mostre uma notificação visível a cada push** (push silencioso recorrente é penalizado). E peça permissão sempre depois de um **primer próprio** (decisão C-N da pesquisa), nunca o prompt nativo no load.

## 2. A anatomia do sistema Duolingo (todos os estilos)

O poder do Duolingo não é emoji, é **persona + timing + aversão à perda**. Os estilos:

1. **Streak-saver (o motor).** Aviso noturno de que a ofensiva vai zerar. Foi o **primeiro grande win** do vetor de notificações deles. É aversão à perda pura: você não quer perder os N dias.
2. **Timing otimizado por bandit.** Eles não aumentam volume ("protect the channel"), otimizam **quando** e **como** com um algoritmo. O horário campeão deles: **~23,5h após o último uso** (te pega no mesmo horário do dia seguinte).
3. **Persona do mascote (Duo) passivo-agressivo.** Virou meme e ativo de marca: o mascote "cobra" com humor. As pessoas tiram print e compartilham.
4. **A linha da desistência (psicologia reversa).** A famosa: *"esses lembretes não parecem estar funcionando, vamos parar de enviar por enquanto"*. Paradoxalmente reativa, porque a pessoa não quer ser "desistida". Arma de última instância, usar pouco.
5. **Marcos e elogio.** Comemora 7/30/100 dias, subida de nível, coroa. Reforço positivo, não só pressão.
6. **Liga/leaderboard.** "Você subiu de divisão", "última hora pra segurar a posição". Competição com prazo.
7. **Social (Friend Streak).** "Fulano está te esperando", a dupla trava se um some. No Duolingo, ter ao menos 1 friend streak deu **+22% de conclusão da lição diária**.
8. **Win-back escalonado.** D1, D3, D7, D14 com tom diferente: lembrete leve → saudade → "ainda dá pra voltar, sem cobrança".
9. **Valor/curiosidade.** Às vezes ensina algo na própria notificação (não só "volte"), reengajando por conteúdo.

## 3. Mapeamento para o Treine seu Paladar (gatilho → estilo → canal)

| Gatilho | Estilo Duolingo | Quando | Canal |
|---|---|---|---|
| Ofensiva em risco | Streak-saver | 20h local se a meta do dia não foi batida | Push + badge |
| Meta diária quase batida | Nudge leve | ~19h se começou e parou | Push |
| Sumiço D1/D3/D7/D14 | Win-back escalonado | ~23,5h após último uso, depois espaçado | Push (D1-D7), e-mail (D7+) |
| Ignorou N lembretes | "Desistência" reversa | após 4-5 ignorados | Push (1x, raríssimo) |
| Marco de streak (7/30/100) | Elogio | na hora da conquista | Push + tela in-app |
| Liga: subiu / última hora | Competição | fim de semana da liga | Push |
| Tchin! recebido na Mesa | Social | na hora (com cap) | Push |
| Dupla de Degustação em risco | Friend Streak | 20h se o parceiro não treinou | Push + WhatsApp |
| Degustação da Semana no ar | Social/conteúdo | abertura semanal | Push |
| Desafio do Dia novo | Hábito diário | manhã (horário do usuário) | Push |
| Recap semanal | Valor/progresso | domingo | E-mail |
| Curiosidade/valor | Conteúdo | reengajamento ocasional | Push/e-mail |

Guarda-corpos da marca (não negociáveis): **NUNCA gamificar volume consumido** (CONAR); win-back nunca culpa ("sem cobrança"); horário noturno respeita o fuso de Brasília; frequência com teto (máx. ~1 push/dia fora de social com cap); primer antes do prompt.

## 4. Biblioteca de copy (na voz do Tchin: Mago+Sábio, anti-elitista)

Decisão de voz: copiamos a **persona e a aversão à perda** do Duolingo, mas mantemos a lei da marca: **sem emoji, sem travessão**, frases curtas, calor humano, cutucada gentil (nunca mesquinha). Título ~30-40 caracteres, corpo ~100-120 visíveis. `{N}`, `{nome}`, `{X}`, `{unidade}` são variáveis.

> Esta biblioteca está versionada como dado tipado em [`app/src/notificacoes/copy.ts`](../app/src/notificacoes/copy.ts) (`COPY_NOTIF`, com 2-3 variantes por categoria e `resolverCopy()` para as variáveis). A Edge Function de cron lê de lá. As linhas abaixo são o espelho legível.

### Ofensiva em risco (o motor)
- "Sua ofensiva vence à meia-noite" · "Falta uma lição pra manter os {N} dias. São 2 minutos."
- "Tchin aqui, rapidinho" · "Seu paladar treinou {N} dias seguidos. Não deixa zerar hoje."
- "O relógio tá correndo" · "Uma lição agora e a ofensiva de {N} dias continua viva."

### Meta diária quase batida
- "Faltou pouco hoje" · "Sua meta do dia tá quase fechando. Uma lição resolve."
- "Você começou e parou" · "Tá a uma lição de bater a meta de hoje. Bora fechar?"

### Marco de streak / elogio
- "{N} dias. Olha você." · "Seu paladar tá ficando afiado de verdade. Amanhã tem mais."
- "Uma semana inteira" · "7 dias de treino. Quem chega aqui costuma não parar mais."
- "100 dias de paladar" · "Isso aqui é coisa de quem leva vinho a sério. Respeito."

### Win-back escalonado
- D1 "O vinho perguntou de você" · "Bora destravar mais um eixo do paladar hoje?"
- D1 "Cadê você, ein" · "Ficou faltando o treino de ontem. A gente recomeça leve."
- D3 "Cadê você?" · "Faz três dias. A gente recomeça leve, do ponto onde parou."
- D3 "Três dias sem treino" · "Seu progresso tá guardado. Volta no seu ritmo, sem corre."
- D7 "Seu paladar sente falta de treino" · "Uma semana parado. Volta quando quiser, sem pressa."
- D7 "Faz uma semana" · "O treino fica do jeito que você deixou. Só tocar pra seguir."
- D14 "Ainda dá pra retomar" · "Seu progresso tá guardado. Sem cobrança, no seu tempo."
- D14 "Duas semanas, e tudo bem" · "Seu paladar não esquece o que aprendeu. Quando der, a gente continua."

### A "desistência" (psicologia reversa, raríssima)
- "Tudo bem, eu paro" · "Esses lembretes não parecem ajudar. Vou sossegar por uns dias."

### Liga
- "Você subiu pra Reserva" · "Boa semana de treino. A divisão nova começa agora."
- "Última hora na liga" · "Faltam {X} XP pra segurar sua posição. A semana fecha hoje."

### Mesa e social
- "Alguém deu um Tchin pra você" · "{nome} curtiu seu progresso na mesa. Dá uma olhada."
- "{nome} tá te esperando" · "A dupla trava se um dos dois some. Não deixa cair hoje."
- "Degustação da semana no ar" · "Um rótulo novo na mesa. Qual seu palpite de paladar?"

### Desafio do Dia
- "Rótulo do dia chegou" · "Quatro perguntas, um rótulo. Será que você acerta hoje?"
- "A mesa já encarou o desafio" · "Seu desafio de hoje ainda tá aberto. Topa?"

### Conquista / coroa / nível
- "Coroa nova no bolso" · "Você dominou {unidade}. Tá lendo vinho que nem gente grande."
- "Subiu de nível" · "Seu Score de Paladar deu um salto. Olha só onde você chegou."

### Valor / curiosidade (reengaja sem cobrar)
- "Tanino em uma frase" · "É aquela secura na boca do tinto. Treina isso em 2 minutos?"
- "Sabia disso?" · "Espumante seco é mais doce que o brut. Vem entender o porquê."

### Recompensa
- "Seus cristais renderam" · "Já dá pra abrir um modo novo. Vem ver o que destravou."
- "Cofre cheio de cristais" · "Você juntou o bastante pra proteger a ofensiva. Dá uma espiada."

Toda linha já está em dado versionado com 2-3 variantes por gatilho, pra rodar o "bandit pobre" depois (escolher a variante com mais clique). Nada de "última chance" (vocabulário banido da marca).

## 5. Arquitetura técnica (o que construir)

**Frontend — FEITO neste branch (client):**
- Handler de `push` e `notificationclick` no service worker: [`app/public/notif-sw.js`](../app/public/notif-sw.js), injetado via `workbox.importScripts` no `generateSW` do vite-plugin-pwa (preserva intacto o caching tunado do app shell: rótulos, avatares, conteúdo-lazy).
- Primer próprio ("Quer que o Tchin te lembre da ofensiva?") antes do `Notification.requestPermission()`, com gate de **1x, pós-onboarding, só onde push existe**: [`PrimerNotificacao.tsx`](../app/src/notificacoes/PrimerNotificacao.tsx) + [`GatePrimer.tsx`](../app/src/notificacoes/GatePrimer.tsx) (montado no Início).
- `navigator.setAppBadge(1)` quando a ofensiva entra em risco; `clearAppBadge()` ao treinar: [`badge.ts`](../app/src/notificacoes/badge.ts), já ligado no Início via `streakEmRisco`.
- Intenção de subscrever guardada localmente; o `pushManager.subscribe` real é um **stub marcado `// TODO F3-backend`** ([`push.ts`](../app/src/notificacoes/push.ts)) porque depende da VAPID.

**Backend — FALTA (precisa de VAPID; o Supabase de produção já existe):**
- Tabelas: `push_subscriptions` (user, endpoint, keys, plataforma), `notif_log` (idempotência e frequência). A copy + variantes já vivem em `copy.ts`.
- Geração do par de chaves **VAPID** (`npx web-push generate-vapid-keys`). Pública → `VITE_VAPID_PUBLIC_KEY`; privada → secret da Edge Function.
- **Edge Function em cron** (pg_cron / scheduled) rodando a cada ~15 min: calcula gatilhos (ofensiva em risco às 20h local, win-back ~23,5h, liga, dupla, desafio do dia), aplica teto de frequência, escolhe a copy (`copy.ts`/`resolverCopy`) e dispara Web Push (lib `web-push` com VAPID).
- E-mail (Resend) nos mesmos gatilhos para quem não tem push (iOS sem instalar) + recap semanal.

**Timing v1 (simples, evolui depois):** ofensiva 20h local; win-back 23,5h após último uso; desafio na manhã do usuário; recap domingo. v2: send-time optimization por usuário (aprende o melhor horário) e bandit de copy.

## 6. Estado e dependências

Construído agora (client, sem bloqueio): SW push handler + primer UI com gate + badge + a biblioteca de copy como dado tipado + a especificação da Edge Function. Tudo verde (build, tsc, testes).

Bloqueado por: **par de chaves VAPID** + **Edge Function cron** (o servidor que efetivamente dispara). O projeto Supabase de produção, as contas, o sync e o social **já existem em produção** (não fazem parte desta pendência).

Decisão de marca (já tomada): **sem emoji** nas notificações. Copiamos do Duolingo a persona e a aversão à perda, que é o que de fato move retenção, dentro da lei da marca.
