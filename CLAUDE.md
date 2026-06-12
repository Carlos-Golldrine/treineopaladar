# CLAUDE.md — Treine seu Paladar (standalone)

Web app PWA standalone do "Duolingo do vinho" do ecossistema Tchin Tchin (pt-BR, público-alvo 35-54, maioria iniciante: 52-65% do público observável é iniciante segundo a DD de jun/2026; o "73%" é do mercado total (Consevitis n=1.709) e NÃO descreve nosso público; 82% Android). Teste de mercado de 3 meses com gates: 2.000 usuários +10% D30 → entra no app Tchin Tchin · 3.500 +15% → vira core · 5.000 +30% → app apartado.

## Fontes da verdade (ler nesta ordem antes de mexer em produto ou UI)
1. `DECISOES-PRODUTO-V2.md` — TODAS as decisões de produto vigentes (trilha, pacing, formatos, economia, onboarding FTUE, "A Mesa", fábrica de questões)
2. `BRIEF-DESIGN.md` — design system, proibições verbatim, motion, checklist PWA nativa, workflow de qualidade (ler antes de QUALQUER tela)
3. `DIAGNOSTICO-E-PLANO.md` — diagnóstico e contexto (seções de decisão superadas pelo V2)
4. `auditoria-seed-v10_5.md` e `pesquisa/` — evidências e fontes

## Estrutura
- `app/` — PWA (Vite + React 18 + TS strict). `npm run dev` / `npm run build` (deve passar limpo) / `node shots.mjs` (screenshots 412x892 e 360x800 em `app/_shots/`)
- `data/` — pipeline do banco: `vinhos_clean.csv` (canônico), `imagens_manifest.csv`, `download_imagens.py` (resume; imagens em `data/imagens/`, fora do git), `QA-pipeline.md`
- `supabase/migrations/` — schema SQL (aguardando projeto Supabase ser criado)
- `scripts/` — utilitários e instruções de import

## Regras inegociáveis
- Sem emoji na UI, sem travessão em copy, sem cara de IA (lista completa no brief)
- Voz Mago+Sábio anti-elitista; proibido: usuário, premium, expert (rótulo), "última chance", "erro de iniciante"
- Cores travadas: wine #722F37/#4A1F24, gold #D4A574, bg #FAFAF8; Fraunces (display) + Inter (UI) + JetBrains Mono (dados)
- 18+ com tom acolhedor; NUNCA gamificar volume consumido (CONAR)
- Fatos de vinho vêm SEMPRE do banco ou de ficha canônica revisada; IA nunca inventa fato
- Performance: INP < 200ms e LCP < 2,5s com CPU 4x throttle; testar em 360x800 além de 412x892
- Nunca aceitar a primeira geração de uma tela: gerar → screenshot → autocrítica contra o brief → revisar

## Fonte de dados
Origem: `C:\Users\camargo\OneDrive\Área de Trabalho\Tchin Tchin\ai.vinhos\tchintchin_vinhos_seed_v10_5.xlsx` (NUNCA modificar). O pipeline limpa, deduplica e gera a view estrita (10,7 mil vinhos elegíveis para questões; total catalogado 12,6 mil). App real do ecossistema: `C:\Users\camargo\tchin-tchin-app` (referência de tokens e lógica da feature original em `src/legacy/screens-treino-paladar.jsx`).
