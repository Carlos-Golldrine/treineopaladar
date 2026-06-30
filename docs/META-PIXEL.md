# Meta Pixel — Treine seu Paladar

Pixel ID: **1666225634676067** (marketing).

## Como funciona
- **Base**: snippet do Meta no `app/index.html`, **gated pelo domínio de produção**
  (`paladar.tchintchin.com.br`). Em dev/preview/pages.dev o pixel não carrega — não
  polui os dados de anúncio. Dispara o `PageView` inicial.
- **Camada fina**: `app/src/lib/pixel.ts` — wrapper guarded sobre o `fbq` global
  (sem fbq = no-op). Expõe `pixelPageView` / `pixelTrack` / `pixelTrackCustom`.
- **Mapeamento**: `app/src/lib/analytics.ts` (`espelharNoPixel`) é chamado por **todo**
  `track()` do app, e `telaVista()` dispara `PageView` a cada troca de tela na SPA.
  Não há `fbq` espalhado pelo código.

## Eventos
| Evento do app | Vai pro Meta como | |
|---|---|---|
| `ftue_concluido` *(default)* ou `conta_criada` | **CompleteRegistration** | conversão (otimização) |
| o outro dos dois | **Lead** | qualificação |
| `pwa_instalado` | **Subscribe** | instalou o PWA |
| `ftue_iniciado` | `IniciouOnboarding` (custom) | |
| `licao_concluida` | `LicaoConcluida` (custom) | |
| `desafio_concluido` | `DesafioConcluido` (custom) | |
| `pratica_concluida` | `PraticaConcluida` (custom) | |
| `lente_quiz_concluido` | `UsouLente` (custom) | |
| `mesa_entrou` | `EntrouNaMesa` (custom) | |
| todos os outros (~15) | mesmo nome, como custom | "trackeia tudo" |

A conversão (CompleteRegistration) **conta no máximo 1x por navegador** (flag
`tp.pixel.creg`), pra não inflar a métrica.

## Conversão principal (decisão de marketing)
Toggle `CONVERSAO` no topo de `analytics.ts` (ou env `VITE_META_CONVERSAO`):
- `'ftue_concluido'` **(default, escolha do marketing)** — converte ao terminar a 1ª lição.
- `'conta_criada'` — converte ao criar a conta real.

Os dois ficam sempre mapeados; o toggle só decide qual é `CompleteRegistration` e qual é
`Lead`. Trocar exige rebuild/redeploy.

`ftue_concluido` dispara **uma vez só**, no momento real de concluir o onboarding
(`Licao1.tsx`), mesmo se a tela de conclusão for pulada — e **não** na `Conclusao1`
(que reaparece no replay/softwall).

## Testar antes de rodar a campanha
**Meta Pixel Helper** (extensão do Chrome) ou **Eventos de Teste** no Gerenciador de
Eventos, abrindo `paladar.tchintchin.com.br` (em dev/preview o pixel fica desligado).
