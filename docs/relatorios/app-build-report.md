## Scaffold da PWA Treine seu Paladar: concluído

### Árvore de arquivos criada (`C:\Users\camargo\Downloads\treino-paladar-app\app\`)

```
app/
├── index.html                  (viewport-fit=cover, theme-color, apple-* metas, lang pt-BR)
├── package.json                (scripts: dev, build, preview, typecheck, icons, shots)
├── tsconfig.json               (strict + noUnusedLocals/Parameters)
├── vite.config.ts              (vite-plugin-pwa autoUpdate, manifest completo)
├── shots.mjs                   (playwright via path absoluto do tchin-tchin-app)
├── .gitignore
├── scripts/
│   └── gen-icons.py            (PIL: taça geométrica wine-700 sobre bg)
├── public/icons/
│   ├── icon-192.png / icon-512.png
│   ├── icon-maskable-192.png / icon-maskable-512.png   (conteúdo na zona segura de 70%)
│   └── apple-touch-icon.png
└── src/
    ├── main.tsx                (router, React.lazy por rota, registerSW, fontes latin subset)
    ├── vite-env.d.ts           (tipos p/ *.svg?raw e virtual:pwa-register)
    ├── app.css                 (shell, coluna 480px desktop, tab bar, skeleton, botões pill)
    ├── design/
    │   ├── tokens.css          (cores travadas do brief + neutros quentes 8 passos + escala 13-36 + raios 8/16/999 + 2 sombras de vinho)
    │   ├── tokens.ts           (mesmos valores tipados, as const)
    │   └── base.css            (reset, overscroll standalone, tap-highlight, touch-action, .tap :active 0.98/150ms, @media hover, reduced-motion)
    ├── components/
    │   ├── Shell.tsx / TabBar.tsx / Icon.tsx / DelayedSkeleton.tsx (skeleton só após 300ms)
    └── routes/
        ├── Trilha.tsx + trilha.css    (HUD streak/vidas/cristais, cartão Unidade 1, 5 nós: 1 concluído, 1 atual pulsando só com transform/opacity, 3 bloqueados)
        ├── Desafio.tsx + desafio.css  (cartão fechado + countdown mono estático + como funciona)
        ├── Mesa.tsx + mesa.css        (vazio acolhedor + convite desabilitado)
        └── Perfil.tsx + perfil.css    (avatar "V", Visitante, Score de Paladar 5 dimensões zeradas)
```

### Build (limpo, `tsc --noEmit` incluso no build)
- **JS inicial: ~76,2 KB gzip** (alvo < 150 KB): index 71,48 + workbox-window 2,34 + chunk Trilha 1,52 + ícones ~0,9
- CSS inicial: 3,0 KB gzip (index 2,01 + trilha 1,00); chunks por rota: Desafio 1,01 / Perfil 0,79 / Mesa 0,48 KB gzip
- Fontes woff2 latin: Fraunces 600 18,1 + itálica 23,0 / Inter 400/500/600 ~24 cada / JetBrains Mono 500 21,8 KB (font-display swap, carregam fora do caminho crítico de JS)
- SW gerado: precache 31 entradas (395,9 KiB)

### Screenshots (Playwright funcionou)
8 arquivos em `C:\Users\camargo\Downloads\treino-paladar-app\app\_shots\`: `{trilha,desafio,mesa,perfil}-412x892.png` e `-360x800.png`, todos verificados visualmente nos dois tamanhos.

### Ciclo de autocrítica (regra do brief: nunca aceitar a 1ª geração)
1ª geração reprovada: a tab bar sticky sumia na Trilha (conteúdo alto). Causa raiz: `overflow-x: hidden` no `body` cria scroll container e quebra `position: sticky`. Corrigido para `overflow-x: clip` (mantém "sem scroll horizontal" sem quebrar sticky), rebuild + re-screenshot confirmados.

### Desvios do prompt, com justificativa
1. **Ícones**: usei `@material-symbols/svg-500` (mesmo projeto oficial Material Symbols, variante rounded) com SVG por ícone inlined via `?raw` + `fill: currentColor`, em vez do pacote `material-symbols` (fonte com ~3.800 glifos, centenas de KB). É a única forma de cumprir "só os usados" e o orçamento de performance ao mesmo tempo.
2. **Cores derivadas nomeadas** (permitido pelo brief que exige nomear papel): `--warm-100` (fundo de erro), `--ember-500` (âmbar de streak, exigido pelo brief), `--xp` (alias de gold-500). Ícone de cristal usa `--gold-700` sobre fundos claros por contraste; gold-500 segue como cor de recompensa/cristais.
3. **PNGs de ícone são placeholder de marca** (anotado no docstring de `gen-icons.py`): substituir pela ilustração proprietária do mascote Tchin.
4. Valores estáticos do HUD escolhidos como estado plausível de dia 1 (streak 1, vidas 5, cristais 65 = 60 boas-vindas + 5 da lição, 80 XP do FTUE), coerentes com a economia da seção 6 do DECISOES-PRODUTO-V2.
