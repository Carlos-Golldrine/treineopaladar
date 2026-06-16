All checks complete. Both edited .mjs files are free of em-dash, en-dash, ellipsis-char, and emoji. Final verification summary below.

---

## VERIFICAÇÃO INDEPENDENTE — Treine seu Paladar

### Tabela PASS/FAIL

| # | Check | Resultado |
|---|-------|-----------|
| 1a | `npm run build` (tsc --noEmit && vite build) | **PASS** — 167 módulos, built in 2.97s, PWA 41 entries |
| 1b | `npx tsc --noEmit` | **PASS** — exit 0, zero erros |
| 1c | `npm run test` (vitest) | **PASS** — 9 arquivos, 78 testes, todos verdes |
| 2a | `node e2e-f1.mjs` | **PASS** — exit 0 (após conserto de assertion) |
| 2b | `node e2e-f2.mjs` | **PASS** — exit 0, estável 3/3 (após conserto de assertion) |
| 4 | Zero travessão/emoji nos arquivos tocados | **PASS** — limpo |
| 5 | Amostra de 10 correções do PLANO aplicadas no disco | **PASS** — 10/10 aplicadas |

### Consertos de assertion (regressões de TESTE, não do app)
Os dois e2e quebraram por copy/feature mudada no app, não por bug do app. Consertei só as asserções dos `.mjs` e re-rodei:

1. **e2e-f1.mjs (c) J3** — o card de objetivo "mercado" teve a copy trocada para benefício; o componente `Cartas.tsx` renderiza só o rótulo (não o sub). Filtro `hasText: 'No mercado'` → trocado para `'Comprar sem medo de errar'`.
2. **e2e-f2.mjs (e) e (e2)** — strict-mode violation: `.pratica-card` agora casa 2 elementos (a feature F2.5 "Revisar com cartas" adicionou um segundo card). Mirei pelo `aria-label` estável (`"Abrir a prática livre"` e `"Revisar com cartas..."`); em (e2) removi o clique ambíguo redundante (o card de cartas navega direto para `/pratica?ir=cartas`).
3. **e2e-f2.mjs (f)** — assertion de imagem flaky: checava `img.complete` no mesmo tick em que `.daily-card` aparece (antes do decode). O arquivo `/rotulos/0986e69d-...webp` existe no disco e carrega. Troquei por `waitForFunction` (mesmo padrão do passo (e)). Passou 3/3.

### SOBRAS — números que AINDA divergem do canon
Canon: tinto = **12 a 18 graus**. O PLANO corrigiu só 4 campos de `u4-l5` (itens 22–25), mas **4 campos irmãos da MESMA lição continuam "14 a 18"**, contradizendo a própria ficha canônica da lição (que já diz 12 a 18):

- `src/content/unidade-4/licao-05.json:41` — exercicios[1].erroMsg: `"faixa ideal de 14 a 18 graus"`
- `src/content/unidade-4/licao-05.json:66` — exercicios[3] (slider).porque: `"entre 14 e 18 graus"`
- `src/content/unidade-4/licao-05.json:89` — exercicios[5] (swipe) carta[0].porque: `"faixa dos 14 a 18 graus"`
- `src/content/unidade-4/licao-05.json:139` — exercicios[7] (duasverdades).porque: `"faixa dos 14 a 18 graus"`

Esses 4 NÃO constam no PLANO-CORRECOES.md — são resíduos que o plano não mapeou. Devem virar "12 a 18" para harmonizar a lição.

**g/L:** zero divergências. Vinho tranquilo (até 4 / 4 a 25 / >25), espumante (nature até 3, brut 8–15, seco 15–20) — todos batem com a IN MAPA 14/2018. Temperaturas restantes OK: espumante 6 a 8, branco 8 a 12 (leves a 7 em u3-l1), tinto leve 12 a 16 (u2-l4), salão europeu "16 a 18" (contexto histórico, correto). FTUE em `conteudo.ts` limpo.

### VEREDITO
**APROVADO COM 1 RESSALVA.** Build, tsc, testes e ambos os e2e passam (exit 0). As correções do PLANO amostradas estão 100% no disco; zero travessão/emoji nos arquivos tocados. Pendência única: **4 ocorrências residuais de "14 a 18" do tinto em `unidade-4/licao-05.json`** (linhas 41, 66, 89, 139) que ainda divergem do canon (12 a 18) e tornam a própria lição internamente contraditória — fora do escopo do PLANO, precisam de uma rodada extra de correção de conteúdo. Não toquei nelas por ser verificador independente.

Arquivos editados (asserções de teste):
- `C:\Users\camargo\Downloads\treino-paladar-app\app\e2e-f1.mjs`
- `C:\Users\camargo\Downloads\treino-paladar-app\app\e2e-f2.mjs`
