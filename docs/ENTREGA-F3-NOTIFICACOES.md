# Entrega — Notificações push (F3, camada client) sobre o main

> **Para mandar pro dev.** Branch: `f3-notificacoes` (a partir do `main` de produção, sem reescrever nada do que já está lá). É um arquivo único e auto-contido: lê de cima a baixo e tem tudo — o que foi feito, o que falta, o texto das notificações e os links de cada parte do repo.

## 0. O contexto honesto (leia primeiro)

A F3 "grande" — **contas, sincronização, social/Mesa, telemetria e Supabase** — **já está em produção no `main`** (foi construída em paralelo). Em particular:

- **Contas/sessão**: `app/src/lib/conta.ts` (funcionando, não é stub).
- **Sync e o bug do "volta pro onboarding": JÁ RESOLVIDO** em produção. A causa era o estado viver só em `localStorage` (despejado sob pressão / apagado pelo ITP do iOS após ~7 dias sem instalar). O fix está em `app/src/lib/sync.ts` + `app/src/engine/merge.ts` (merge **local-first** em vez de sobrescrever) com teste em `app/src/engine/__tests__/merge.test.ts`. **Não há nada a fazer aqui** — só registrar que está coberto.
- **Supabase**: migrations `0003`–`0011` aplicadas em produção; Mesa social, avatares, liga, perfil.
- **Telemetria**: `app/src/lib/analytics.ts` (PostHog).

**Esta entrega adiciona a ÚNICA peça da F3 que faltava: a camada de NOTIFICAÇÕES push no client.** Produção não tinha nada de notificação. Foi tudo construído em cima do main, religado à estrutura `app/src/lib/` existente, sem trazer código redundante.

## 1. Resumo executivo

O que entra com este branch:
- **Service worker com push**: handlers de `push` e `notificationclick` adicionados ao SW **sem mexer no caching tunado de produção** (decisão técnica na §3).
- **Primer próprio de permissão** (estilo Duolingo, sem emoji, sem travessão), com gate de **1x, pós-onboarding, só onde push existe**.
- **Badge no ícone** (`setAppBadge`) ligado à ofensiva em risco.
- **Biblioteca de copy tipada** (14 categorias, 2-3 variantes) que a Edge Function de cron vai consumir.
- Verde: **build, tsc e 92 testes** passando.

O que **falta** (backend, escopo de notificação apenas): par de chaves **VAPID**, tabela `push_subscriptions`, ligar o `subscribe` real (1 stub marcado) e a **Edge Function de cron** que dispara. Detalhe na §4.

## 2. Decisões travadas nesta fase

1. **Sem emoji** nas notificações (lei da marca). Copiamos do Duolingo a **persona + timing + aversão à perda**, não o emoji. Sem travessão também.
2. **SW: mantido o `generateSW` de produção**, push entra por `importScripts` (§3). NÃO migramos para injectManifest — isso teria regredido o cache de avatares que produção adicionou.
3. **Sem trazer redundância**: o branch antigo `f3-backend` tinha uma segunda versão de contas/dados/telemetria/persistência e uma migration `0003_f3.sql` que **colidia** com a `0003_rls.sql` de produção. Nada disso veio — só as notificações.
4. **Android 82%** (origem: GA4/Firebase do app) = Web Push pleno pra maioria; iOS exige PWA instalado, e quem não instala cai no e-mail (canal já previsto).
5. Limites de PWA que mandam na arquitetura: **não existe notificação local agendada** no web → todo lembrete temporizado sai de um **servidor (cron)**. O Chrome exige **mostrar uma notificação a cada push**.

## 3. O que foi CONSTRUÍDO (client)

| Peça | Arquivo | Estado |
|---|---|---|
| Handlers de push/click no SW | `app/public/notif-sw.js` | pronto, injetado via `importScripts` |
| Wiring do SW na build | `app/vite.config.ts` (`workbox.importScripts`) | pronto, caching de produção intacto |
| Primer de permissão (UI) | `app/src/notificacoes/PrimerNotificacao.tsx` | pronto, acento pt-BR, sem emoji |
| Gate do primer (1x, pós-onboarding) | `app/src/notificacoes/GatePrimer.tsx` | pronto, montado no Início |
| Permissão + intenção + subscribe(stub) | `app/src/notificacoes/push.ts` | pronto; `subscribe` real = TODO backend |
| Badge no ícone | `app/src/notificacoes/badge.ts` | pronto, ligado em `Inicio.tsx` via `streakEmRisco` |
| Biblioteca de copy tipada | `app/src/notificacoes/copy.ts` | pronto, 14 categorias, `resolverCopy()` |
| Ícone `sino` | `app/src/icones/Icones.tsx` | adicionado ao set proprietário |
| Flag `primerNotifRespondido` | `app/src/onboarding/flags.ts` | adicionada ao `FtueFlags` (store `tp.ftue.v1`) |
| Testes da copy | `app/src/notificacoes/__tests__/copy.test.ts` | 6 testes (sem emoji/travessão, limites de tamanho) |

### 3.1 Por que `importScripts` e não injectManifest (a decisão de SW)

Produção usa `VitePWA` em **`generateSW`** com workbox tunado à mão (precache + runtime caching de `rotulos-v1`, **`avatares-v1`** e `conteudo-lazy-v1`, `registerType: 'autoUpdate'`). Para adicionar push há dois caminhos:

- **injectManifest** (reescrever o SW em TS): exigiria portar todo esse caching pra dentro do `sw.ts` — e o `sw.ts` herdado **não conhecia o cache de avatares** (produção adicionou depois), então regrediria. Além de instalar 5 deps `workbox-*` e mudar o script de build.
- **importScripts (escolhido)**: o `generateSW` gerado importa `app/public/notif-sw.js` no topo, que registra só os listeners de `push`/`notificationclick`. **O caching de produção fica 100% intacto, zero deps novas.** Confirmado na build: o `dist/sw.js` traz `importScripts("/notif-sw.js")` e mantém as três rotas de cache.

## 4. O que está PENDENTE (backend — só notificação)

A peça que falta é **só o disparo real**. O resto da F3 já está em produção.

1. **VAPID**: `npx web-push generate-vapid-keys`. Pública → `VITE_VAPID_PUBLIC_KEY` (client). Privada → secret da Edge Function.
2. **Tabela** `push_subscriptions` (user_id, endpoint, p256dh, auth, plataforma) + `notif_log` (idempotência / teto de frequência). Migration nova na sequência de produção (a próxima é `0012_*`).
3. **Ligar o subscribe**: em `app/src/notificacoes/push.ts` (marcado `// TODO F3-backend`, ~linha 105), trocar o stub por `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: <VAPID pública> })` e gravar a subscription via o client Supabase de produção (`app/src/lib/supabase.ts`). O payload que o SW espera está documentado em `app/public/notif-sw.js` (`{ title, body, icon, badge, tag, url }`).
4. **Edge Function cron** (`supabase/functions/enviar-push/`, a criar) rodando a cada ~15 min: calcula gatilhos, aplica teto de frequência, escolhe a copy de `copy.ts`/`resolverCopy` e envia Web Push (lib `web-push` com VAPID). Gatilhos e horários: tabela em `docs/NOTIFICACOES.md` §3.
5. (Opcional, mesmo canal) e-mail Resend para win-back de quem não tem push + recap semanal.

## 5. As notificações (texto completo, embutido)

Todas as 14 categorias com as variantes (título · corpo). É o espelho legível de `app/src/notificacoes/copy.ts`. `{N}` dias, `{nome}` da pessoa, `{X}` XP, `{unidade}` — variáveis resolvidas pelo backend.

**Ofensiva em risco** (o motor — streak-saver)
- "Sua ofensiva vence à meia-noite" · "Falta uma lição pra manter os {N} dias. São 2 minutos."
- "Tchin aqui, rapidinho" · "Seu paladar treinou {N} dias seguidos. Não deixa zerar hoje."
- "O relógio tá correndo" · "Uma lição agora e a ofensiva de {N} dias continua viva."

**Meta diária quase batida**
- "Faltou pouco hoje" · "Sua meta do dia tá quase fechando. Uma lição resolve."
- "Você começou e parou" · "Tá a uma lição de bater a meta de hoje. Bora fechar?"

**Marco de streak / elogio**
- "{N} dias. Olha você." · "Seu paladar tá ficando afiado de verdade. Amanhã tem mais."
- "Uma semana inteira" · "7 dias de treino. Quem chega aqui costuma não parar mais."
- "100 dias de paladar" · "Isso aqui é coisa de quem leva vinho a sério. Respeito."

**Win-back D1**
- "O vinho perguntou de você" · "Bora destravar mais um eixo do paladar hoje?"
- "Cadê você, ein" · "Ficou faltando o treino de ontem. A gente recomeça leve."

**Win-back D3**
- "Cadê você?" · "Faz três dias. A gente recomeça leve, do ponto onde parou."
- "Três dias sem treino" · "Seu progresso tá guardado. Volta no seu ritmo, sem corre."

**Win-back D7**
- "Seu paladar sente falta de treino" · "Uma semana parado. Volta quando quiser, sem pressa."
- "Faz uma semana" · "O treino fica do jeito que você deixou. Só tocar pra seguir."

**Win-back D14**
- "Ainda dá pra retomar" · "Seu progresso tá guardado. Sem cobrança, no seu tempo."
- "Duas semanas, e tudo bem" · "Seu paladar não esquece o que aprendeu. Quando der, a gente continua."

**Desistência** (psicologia reversa, raríssima)
- "Tudo bem, eu paro" · "Esses lembretes não parecem ajudar. Vou sossegar por uns dias."

**Liga**
- "Você subiu pra Reserva" · "Boa semana de treino. A divisão nova começa agora."
- "Última hora na liga" · "Faltam {X} XP pra segurar sua posição. A semana fecha hoje."

**Mesa e social**
- "Alguém deu um Tchin pra você" · "{nome} curtiu seu progresso na mesa. Dá uma olhada."
- "{nome} tá te esperando" · "A dupla trava se um dos dois some. Não deixa cair hoje."
- "Degustação da semana no ar" · "Um rótulo novo na mesa. Qual seu palpite de paladar?"

**Desafio do Dia**
- "Rótulo do dia chegou" · "Quatro perguntas, um rótulo. Será que você acerta hoje?"
- "A mesa já encarou o desafio" · "Seu desafio de hoje ainda tá aberto. Topa?"

**Conquista / coroa / nível**
- "Coroa nova no bolso" · "Você dominou {unidade}. Tá lendo vinho que nem gente grande."
- "Subiu de nível" · "Seu Score de Paladar deu um salto. Olha só onde você chegou."

**Curiosidade / valor** (reengaja sem cobrar)
- "Tanino em uma frase" · "É aquela secura na boca do tinto. Treina isso em 2 minutos?"
- "Sabia disso?" · "Espumante seco é mais doce que o brut. Vem entender o porquê."

**Recompensa**
- "Seus cristais renderam" · "Já dá pra abrir um modo novo. Vem ver o que destravou."
- "Cofre cheio de cristais" · "Você juntou o bastante pra proteger a ofensiva. Dá uma espiada."

> Regras embutidas e testadas (`copy.test.ts`): sem emoji, sem travessão, sem "última chance", título ≤44 e corpo ≤125 caracteres.

## 6. Changelog deste branch

- `f3-notificacoes` (a partir do `main`): camada de notificações push no client — SW push via `importScripts`, primer + gate, badge, copy tipada, ícone `sino`, flag `primerNotifRespondido`. Build/tsc/92 testes verdes.

## 7. Como rodar

```
cd app
npm install
npm run dev        # dev server
npm run build      # build de produção (gera dist/sw.js com o importScripts)
npx tsc --noEmit   # type-check
npm run test       # 92 testes
```
Testar sempre no alias estável `treino-paladar.vercel.app` (URLs de deploy efêmero têm `localStorage` por origem, zerado a cada deploy). Push real só funciona depois da VAPID + Edge Function (§4); até lá o primer grava a intenção e o resto é no-op seguro.

## 8. Navegação no repositório (links diretos)

Base: `github.com/GabrielCamargo00000001/treino-paladar-app`, branch **`f3-notificacoes`**.

**Código desta entrega (notificações)**
- [app/src/notificacoes/](https://github.com/GabrielCamargo00000001/treino-paladar-app/tree/f3-notificacoes/app/src/notificacoes) — [copy.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/notificacoes/copy.ts) · [push.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/notificacoes/push.ts) · [PrimerNotificacao.tsx](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/notificacoes/PrimerNotificacao.tsx) · [GatePrimer.tsx](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/notificacoes/GatePrimer.tsx) · [badge.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/notificacoes/badge.ts)
- [app/public/notif-sw.js](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/public/notif-sw.js) — handlers de push/click do SW
- [app/vite.config.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/vite.config.ts) — `workbox.importScripts`
- [app/src/routes/Inicio.tsx](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/routes/Inicio.tsx) — monta o `GatePrimer` + badge
- [app/src/onboarding/flags.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/onboarding/flags.ts) · [app/src/icones/Icones.tsx](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/app/src/icones/Icones.tsx)

**Documentos**
- [docs/NOTIFICACOES.md](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/docs/NOTIFICACOES.md) — estratégia Duolingo + limites PWA + mapa gatilho→canal + copy
- [README.md](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/README.md) · [DECISOES-PRODUTO-V2.md](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/DECISOES-PRODUTO-V2.md) · [CLAUDE.md](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/f3-notificacoes/CLAUDE.md)

**O que JÁ está em produção (main) — contexto, não é desta entrega**
- F3 backend: [app/src/lib/](https://github.com/GabrielCamargo00000001/treino-paladar-app/tree/main/app/src/lib) (conta, supabase, sync, analytics, cloud, mesa) · [app/src/engine/merge.ts](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/main/app/src/engine/merge.ts) (fix do onboarding) · [supabase/migrations/](https://github.com/GabrielCamargo00000001/treino-paladar-app/tree/main/supabase/migrations) (0003–0011) · [docs/F3-ARQUITETURA.md](https://github.com/GabrielCamargo00000001/treino-paladar-app/blob/main/docs/F3-ARQUITETURA.md)
