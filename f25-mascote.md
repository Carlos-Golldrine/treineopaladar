Mascote vivo entregue, build limpo. Resposta final:

---

## Mascote vivo "Tchin" — entregue em `C:\Users\camargo\Downloads\treino-paladar-app\app\src\mascote\`

**Nenhum arquivo fora da pasta foi tocado.** `npm run build` e `npx tsc --noEmit` passam limpos.

### API exportada (`index.ts`)

```ts
import { Tchin, MascoteBalao, MascoteToast, CenaMascote, TchinDuo,
         type EstadoTchin, type PassoCena, type PropCenaId, PROPS_CENA } from '../mascote';

<Tchin estado="feliz" tamanho={96} alvoX={x} alvoY={y} segueToque rotulo="Tchin comemora" />
<CenaMascote roteiro={[{ estado: 'ensina', fala: 'Já sentiu a boca amarrar?', prop: 'taca-cha', duracaoMs: 2600 }]} aoTerminar={fechar} />
```

### Estados (máquina em `Tchin.tsx`)
- **idle**: respira em loop (scaleY 1↔1.018), pisca a cada 3–5s com jitter (18% piscada dupla), vinho ondula devagar (onda SVG em translateX infinito)
- **feliz**: pulinho com squash & stretch, slosh do vinho (mola sub-amortecida ±9°), faísca dourada
- **lamenta**: inclina 6° gentil, sobrancelhas tristes, vinho baixa 8px, mola sem overshoot. Nunca dramático
- **ensina**: inclina 7° para frente, bracinho aponta, pupilas olham para o conteúdo
- **celebra**: braços para cima, vinho sobe e transborda 3 gotas douradas, **segunda taça entra em cena e brinda** com faísca no toque
- **surpreso**: olhos arregalam 1.3x (mola rápida), recuo curto, vinho treme (onda a 6x)

Tudo via **WAAPI com molas amortecidas resolvidas analiticamente** (`springs.ts`, zero dependências), só `transform`/`opacity`, um canal de animação por parte do rig (postura, braços, sobrancelhas, nível/slosh do vinho, pupilas, pálpebras). Transições **interrompíveis**: trocar de estado substitui o canal a partir da pose corrente. Olhos seguem `alvoX/alvoY` ou o toque mais recente, limite 2.5px, com retorno após 2.4s. `prefers-reduced-motion` cai para poses estáticas.

### Como o integrador troca o mascote antigo
1. Nos arquivos `onboarding/Cartas.tsx`, `onboarding/Licao1.tsx`, `routes/Trilha.tsx`, `onboarding/Splash.tsx`, `onboarding/Conclusao1.tsx`: trocar `from './Mascote'` / `'../onboarding/Mascote'` por `'../mascote'`. **Contrato idêntico** (`MascoteBalao {texto}`, `MascoteToast {texto, inline, fixo, onFechar}` + `estado` opcional novo); `TchinDuo` (logo da marca, não o personagem) é re-exportado para o swap não quebrar Splash/Conclusao1.
2. Rota demo: montar `DemoMascote.tsx` (default export, sem dependência de router) em `/mascote` no `main.tsx` sob `import.meta.env.DEV` — não adicionei a rota porque main.tsx está fora da pasta permitida. Hoje já funciona via vite dev: `/src/mascote/demo.html?estado=celebra` (e `&rajada=1` para capturar a transição, `?cena=1` para a micro-aula).
3. Cenas no `shots.mjs`: fica com o integrador; o script de rajada próprio é `src/mascote/capturas.mjs`.

### Autocrítica das rajadas (36 frames em `app\_shots\mascote\`)
- **Iteração 1 reprovada por mim**: vinho em y=50 colava nos olhos (cara de máscara), braços do celebra a ±142° enterravam as mãos dentro do bojo (tocos escuros), sobrancelhas erguidas colidiam com a borda virando "dentes", e a segunda taça **sumia** (keyframe final sem `opacity: 1`, o fill interpolava de volta a 0).
- **Iteração 2 aprovada**: nenhum burst tem frames idênticos. Idle vive pela onda do vinho + respiração; feliz mostra antecipação/ar/aterrissagem distintos com faísca; celebra tem taça 2 entrando, clink com faísca e gotas em frames diferentes; cena troca passo, fala e prop entre frames.
- **Limites honestos**: a piscada (130ms) raramente cai num frame de 300ms (confirmada ao vivo, não na rajada); o overshoot da mola dos braços cruza o bojo por ~150ms no feliz (transiente aceitável, pose final limpa); a xícara de chá lê como "café" em tamanho pequeno; e o seguir-olhar só é verificável interativamente, não em screenshot.

Arquivos: `Tchin.tsx`, `springs.ts`, `Balao.tsx`, `CenaMascote.tsx`, `PropsCena.tsx` (garrafa, taça de chá, limão, sol, frio, uva), `DemoMascote.tsx`, `demo.html`, `demo-main.tsx`, `capturas.mjs`, `mascote.css`, `index.ts`.
