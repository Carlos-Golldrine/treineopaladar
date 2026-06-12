# Treine seu Paladar — by Tchin Tchin (Beta)

Web app PWA standalone do "Duolingo do vinho" do ecossistema Tchin Tchin. Produto de teste de mercado (GTM) com duração de 3 meses e gates de decisão:

| Gate | Cadastros | Retenção D30 | Decisão |
|---|---|---|---|
| G1 | 2.000 | ≥ 10% | A feature entra no app Tchin Tchin |
| G2 | 3.500 | ≥ 15% | Vira core (bottom nav do app) |
| G3 | 5.000 | ≥ 30% | Vira app apartado do ecossistema |

Público-alvo: 35-54 anos, maioria iniciante em vinho (52-65% do público observável), 82% Android, Brasília/Goiânia. Voz anti-elitista. Tudo em pt-BR.

## Como rodar

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção (tsc + vite + PWA) — deve passar limpo
npm run test       # 75 testes do engine (vitest)
node e2e-f1.mjs    # E2E do FTUE + lição da trilha (36 passos)
node e2e-f2.mjs    # E2E de trilha 6 unidades, prática e Desafio do Dia
node shots.mjs     # screenshots de todas as telas em _shots/
```

Os E2E usam o Playwright instalado em `C:\Users\camargo\tchin-tchin-app\node_modules` (ajuste o caminho no topo dos `.mjs` se necessário). Pipeline de dados e LPs não precisam de nada para o app rodar: o conteúdo já está versionado.

## Mapa do repositório

| Caminho | O que é |
|---|---|
| `DECISOES-PRODUTO-V2.md` | **A fonte da verdade do produto.** Todas as regras de negócio: trilha e matriz nível×objetivo, pacing (Desafio do Dia, soft cap, vidas), formatos de exercício, economia (XP/cristais/loja/recompensas reais), onboarding FTUE, a Mesa (social), fábrica de questões, telemetria |
| `BRIEF-DESIGN.md` | **A fonte da verdade do design.** Tokens, proibições verbatim (sem emoji, sem travessão, sem ícone de estoque), motion, checklist PWA nativa, seção 7 = delight checklist (mascote vivo, botões 3D, rajada de frames) |
| `DIAGNOSTICO-E-PLANO.md` | Diagnóstico original, crítica das metas com fontes e plano de fases (seções marcadas como superadas pelo V2) |
| `CLAUDE.md` | Guia para sessões de IA (regras inegociáveis, comandos, fontes de dados) |
| `app/` | O produto. Vite + React 18 + TS strict, PWA completa. Detalhe abaixo |
| `lp/` | As 6 landing pages de aquisição (estáticas, zero JS), uma por JTBD, com headlines A/B comentadas no HTML |
| `data/` | Pipeline do banco de vinhos: `vinhos_clean.csv` (12,6 mil; view estrita 10,7 mil), manifest de imagens, QA |
| `scripts/` | `pipeline_f0.py` (limpeza do seed), `fabrica_questoes.py` (gera exercícios do banco, determinística), `preparar_rotulos.py`, `processar_logo.py`, `_check_c3.py` |
| `supabase/migrations/` | Schema SQL completo (vinhos + quarentena + 12 tabelas do app) pronto para aplicar; instruções em `scripts/IMPORT-SUPABASE.md` |
| `pesquisa/` | Pesquisas fundadoras com fontes: pacing/saciedade, aprender vs sensação de aprender, formatos, economia comportamental, FTUE de jogos |
| `dd-publico/` | Due diligence estatística dos estudos de público (verificada adversarialmente) + mapa de mensagens das LPs |
| `docs/` | Auditorias dos bancos de vinho e relatórios de construção/verificação de cada fase |
| `logo/` | Logo oficial fonte (processada para `app/public/marca/`) |

### Dentro de `app/src/`

| Pasta | Responsabilidade |
|---|---|
| `engine/` | **Regras de negócio em código, 100% testadas**: `economia.ts` (XP 20/25/10, cristais, soft cap 100/50/25%, preços da loja), `vidas.ts` (5 max, regen 4h, perdão do 1º erro), `streak.ts` (freeze, risco às 20h), `revisao.ts` (D+1/3/7/21), `sessao.ts` (fila, reinserção de erros, Score de Paladar), `store.ts` (persistência `tp.v1` com migração) |
| `content/` | 30 lições autorais em 6 unidades (JSON com ficha canônica de fatos verificados) + `pratica/` (480 exercícios gerados + 40 Desafios do Dia) |
| `onboarding/` | FTUE: splash, Lição 1 com 7 jogadas (tutorial invisível), soft wall, revelação progressiva |
| `licao/` | Player com os 6 formatos de exercício, feedback com mascote, dica por cristais, ficha de bolso |
| `mascote/` | O Tchin rigado: máquina de estados, molas WAAPI, micro-cenas (`demo.html?estado=` para ver cada estado) |
| `icones/` | Set proprietário de 40 ícones + 6 emblemas + slot da logo (ícones de estoque são proibidos) |
| `trilha/` | Ordenação por objetivo, desbloqueios, micro-aulas animadas |
| `pratica/` | Prática livre + flashcards com repetição espaçada |
| `coreografia/`, `som/` | Animações de marco (taça enchendo, chama, odômetro, confete) e som sintetizado em runtime |

## Fluxo do produto (caminho feliz)

`/comecar` (splash, marca + Beta) → Lição 1 = tutorial invisível (J1 impossível de errar → objetivo como jogada → pegadinha com perdão de vida → conclusão com XP e streak) → soft wall ("Depois" sempre disponível) → Trilha (6 unidades na ordem do objetivo, taças que se enchem) → lições, Prática livre, flashcards, Desafio do Dia (1/dia, grade compartilhável) → Perfil (Score de Paladar, som, objetivo).

Caminhos tristes são parte do design: sem vidas → revisão recupera; erro → explicação + reinserção; tudo offline-first (localStorage até a F3).

## Estado e o que falta (jun/2026)

Feito e verificado (E2E + auditorias independentes por fase, relatórios em `docs/relatorios/`): F0 fundação · F1 core loop · F2 conteúdo + fábrica + Desafio · F2.5 alma (mascote/ícones/motion/som) · correções da DD de público · LPs.

Em aberto:
1. **F3 (bloqueada por credenciais Supabase)**: contas reais, importação do banco, liga semanal real, a Mesa, Web Push + e-mail, PostHog. Migrações prontas em `supabase/`.
2. As 5.219 fotos de rótulo ficam fora do git (`data/imagens/`, ~324MB): reproduza com `python data/download_imagens.py` ou aguarde o upload para o Supabase Storage na F3.
3. Backlog conhecido: split do chunk de lições por unidade, cena própria para a aba Mesa, avatar do Perfil, recaptura de 119 imagens com falha permanente.

## Regras para contribuir

1. Leia `DECISOES-PRODUTO-V2.md` e `BRIEF-DESIGN.md` antes de qualquer mudança de produto ou UI. Eles vencem qualquer opinião, inclusive a sua e a desta IA.
2. Fatos de vinho vêm SEMPRE do banco ou de ficha canônica verificada. Ninguém inventa fato, humano ou modelo.
3. `npm run build`, `npm run test` e os dois E2E precisam passar antes de qualquer merge.
4. Toda tela nova passa pelo loop do brief: screenshot em 412×892 e 360×800, rajada de frames nas animações, autocrítica contra a seção 7.
