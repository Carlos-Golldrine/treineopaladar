Audit complete. All checks done: DD fidelity, prohibitions, UTM, independent Playwright run (412/1280, 7 pages, network + fonts + weights), contrast math, and copy review.

## REVISÃO INDEPENDENTE DAS LPs (lp/)

### Tabela PASS/FAIL por página

| Página | Headline (DD) | Citação literal | CTA (DD) | Provas/números | Proibições | UTM | Visual/peso |
|---|---|---|---|---|---|---|---|
| LP1 mercado | PASS | FAIL (elipse suprimida) | PASS | FAIL (12 mil+ / 5.692) | PASS | PASS | PASS |
| LP2 conversa | PASS | FAIL (elipse suprimida) | PASS | FAIL (12 mil+) | PASS | PASS | PASS |
| LP3 ocasiao | PASS | FAIL (citação reescrita) | PASS | FAIL (12 mil+ / "milhares") | PASS | PASS | FAIL leve (ficha sem chip de doçura vs copy) |
| LP4 treino | PASS com conflito registrado | PASS | PASS | FAIL (12 mil+) | FAIL pontual (linha 71) | PASS | PASS |
| LP5 desafio | PASS (não envergonha; provocação só do paladar; zero IA) | PASS (1.304 curtidas confere) | PASS | FAIL (12 mil+ / 5.692) | PASS | PASS | PASS |
| LP6 trabalho | PASS (promessa limitada ao que existe) | PASS | PASS | FAIL (12 mil+ / 5.692) | PASS | PASS | PASS |
| indice | n/a | n/a | n/a | n/a | PASS (noindex) | n/a | PASS (45 KB) |

### O que verifiquei e confirmou (sem correção)
- Headlines: as 6 são a candidata 1 do mapa D da DD, caractere a caractere; variantes 2/3 comentadas no HTML conferidas.
- CTAs: todos batem com a DD (inclusive "Que tal experimentar?" e "Vem treinar com a gente").
- Proibições: zero travessão/en dash/emoji/aspas curvas (scan unicode próprio); zero "usuário/consumidor/premium/expert/última chance/erro de iniciante"; zero menção a IA/inteligente/assistente/algoritmo; zero "baixe agora"; zero depoimento ou contagem de gente inventada; suave tratado com respeito (ocasiao:71, trabalho:72); LP5 provoca o paladar do entendido, nunca humilha iniciante.
- UTM: 3 links `/comecar?utm_source=lp&utm_medium=organic&utm_campaign={slug}` por LP, 6 campanhas únicas, consistentes.
- Visual (playwright próprio, `lp/_review-auditor.mjs`, shots em `lp/_review_auditor/`): layout editorial assimétrico nas 7 páginas (não é hero-template centrado); 11 screenshots reais do app carregam (naturalWidth>0 inclusive lazy); ZERO requisição externa (fontes 5 woff2 self-hosted, todas `loaded`); pesos medidos por rede: 211/243/208/217/222/230 KB + índice 45 KB, todos < 400 KB (batem com o relatório do construtor).
- Provas confirmadas: 30 lições (DECISOES seção 2), Score 0-1000 em 5 dimensões (DECISOES linha 35), Desafio do Dia 1/dia, meia-noite, grade sem spoiler (DECISOES linha 43), 2 min/lição.

### Correções (arquivo + linha)

Obrigatórias (a LP se vende como "prova honesta", então o rigor é do próprio frame):
1. "12 mil+ vinhos reais no banco que alimenta o treino" é FALSO no rigor: a view que alimenta o motor de questões tem 10.717 vinhos (data/QA-pipeline.md, passo 9; o ~11,4k do CLAUDE.md está desatualizado). O clean tem 12.597, mas não é ele que "alimenta o treino". Trocar por "10 mil+" ou desamarrar a frase ("mais de 12 mil vinhos catalogados, 10 mil+ no treino"). Ocorrências: mercado/index.html:112, conversa/index.html:111, ocasiao/index.html:111, treino/index.html:113, desafio/index.html:73 e 111, trabalho/index.html:111.
2. "5.692 rótulos fotografados" é contagem pré-dedup da auditoria: o manifest tem 5.334 URLs únicas (QA-pipeline.md) e `data/imagens/` tem 5.219 arquivos baixados. Usar 5.334 (ou "mais de 5 mil"). Ocorrências: mercado/index.html:113, desafio/index.html:110, trabalho/index.html:112.
3. ocasiao/index.html:69: "como os milhares que perguntam por lá" — escala inventada (o corpus tem 1 comentário com 116 likes e ~37 menções de harmonização). Trocar por "como tanta gente que pergunta por lá" ou citar a curtida real.
4. treino/index.html:71: "O que faltava não era talento. Era método." — segunda instância da fórmula proibida "não é X, é Y", esta SEM cobertura da DD. Reescrever (ex.: "Faltava método; talento você já tinha.").
5. Contraste AA (medido): `--muted #8A7A74` sobre `#FAFAF8` = 3,9:1 em texto de 13px (.cta-micro, .phone-legenda, cite) — _base.css:43; `.eyebrow` `#B8894A` sobre bg = 3,0:1 em 13px — _base.css:197. Escurecer (ex.: muted #6B5D57, que o próprio índice já usa; eyebrow ~#8F6A39).

Recomendadas:
6. Citações apresentadas como "comentário real" foram editadas: mercado/index.html:61 e conversa/index.html:60 suprimem a elipse do documento ("supermercado..." / "uva..."); ocasiao/index.html:60 reescreve "ñ entendo nd" como "não entendo nada" e "Por ate" como "por até"; mercado/index.html:70 acrescenta vírgula em S2344. Ou restaurar o texto literal, ou trocar o cite para "comentário real, editado para leitura" (rigor CONAR barato).
7. ocasiao/index.html:71 promete "cada vinho do treino mostra [seco/meio seco/suave] com destaque", mas a ficha do screenshot da galeria (assets/desafio-resultado.webp, usado em ocasiao/index.html:124) mostra só uva/país/preço, sem o chip de doçura já implementado no app. Re-capturar o shot com o chip.
8. desafio/index.html:72: "já rendeu mais conversa boa" implica histórico que um beta sem usuários não tem; usar presente ("rende").
9. Mascote: medalhão cortado ~8px pela borda esquerda do viewport mobile em todos os heros (_base.css:522, `left:-28px`). Reduzir para -12px ou dar margem ao phone.
10. ocasiao/index.html:130 e 132: "Micro-aula" → ortografia pt-BR correta é "microaula".
11. LP4 h1 "Paladar não é dom. É treino." (treino/index.html:6, 10, 42): conflito real entre BRIEF seção 1 (fórmula banida "verbatim, sem exceção") e DD seção D (candidata 1). O construtor registrou corretamente; minha recomendação é manter e escrever a exceção no brief (é a assinatura da marca e veio da pesquisa), mas a decisão é do time, não do construtor.

### Veredito
**APROVADO COM CORREÇÕES.** A estrutura, fidelidade ao mapa da DD, proibições, UTMs, performance e layout editorial estão sólidos e conferidos de forma independente. O que impede aprovação plena é ironicamente a seção "Prova honesta": dois dos quatro números (12 mil+ e 5.692) não sobrevivem à conferência contra data/QA-pipeline.md, mais uma hipérbole ("milhares") e uma instância não sancionada da fórmula banida. Todas as correções são de texto/token, executáveis em menos de 1 hora, sem mudança de estrutura.

Artefatos da revisão: `C:\Users\camargo\Downloads\treino-paladar-app\lp\_review-auditor.mjs` (script próprio) e `C:\Users\camargo\Downloads\treino-paladar-app\lp\_review_auditor\` (14 screenshots + crops).
