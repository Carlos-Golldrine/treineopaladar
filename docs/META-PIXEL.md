# Meta Pixel — Treine seu Paladar

Pixel ID: **1666225634676067** (enviado pelo marketing).

## Como funciona
O Pixel é carregado em `app/src/lib/pixel.ts` (gated por produção: dev/preview não
mandam nada pro pixel real, pra não poluir os dados de anúncio). A instrumentação
**reaproveita a telemetria que já existe**: todo `track(evento)` do app é espelhado no
Pixel por `app/src/lib/analytics.ts` (`espelharNoPixel`), e cada navegação (`telaVista`)
vira um `PageView`. Não há `fbq` espalhado pelo código.

- **PageView** — no load (snippet base) e a cada troca de tela na SPA.
- **Eventos padrão do Meta** (otimização/medição) — ver tabela abaixo.
- **Eventos custom** — todos os outros ~25 eventos da telemetria vão como `trackCustom`
  com o nome em pt-BR (ex.: `licao_concluida`, `mesa_entrou`, `desafio_concluido`,
  `pratica_concluida`). Servem pra montar Conversões Personalizadas no Gerenciador.

## Eventos padrão (mapa em `analytics.ts`)
| Evento do app | Evento Meta | O que é |
|---|---|---|
| `conta_criada` **ou** `ftue_concluido` | **CompleteRegistration** | a CONVERSÃO principal (otimização) |
| o outro dos dois | **Lead** | qualificação |
| `pwa_instalado` | **Subscribe** | instalou o PWA |

## Conversão principal (decisão de marketing)
Qual evento o anúncio otimiza fica no toggle `CONVERSAO` no topo de `analytics.ts`:

- `'conta_criada'` (default) — a conversão é criar a conta real.
- `'ftue_concluido'` — a conversão é terminar o onboarding (1ª lição).

Os dois ficam sempre mapeados; o toggle só decide qual vira `CompleteRegistration` e qual
vira `Lead`. Pode trocar pela env `VITE_META_CONVERSAO` (precisa rebuild/redeploy).

## Testar antes de rodar a campanha
Use o **Meta Pixel Helper** (extensão do Chrome) ou **Eventos de Teste** no Gerenciador
de Eventos, abrindo o site de produção (`paladar.tchintchin.com.br`). Em dev/preview o
pixel fica desligado de propósito.
