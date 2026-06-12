F2 INTEGRADO. Build limpo (tsc + vite), 58/58 testes verdes, bundle inicial ~95 KB gzip, screenshots 412x892 e 360x800 geradas e revisadas contra o brief, com 1 iteração de correção.

## Arquivos modificados
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\index.ts` (barrel: 6 unidades, 30 lições tipadas, `unidades`, `todasLicoes`, `licoesPorId`, `unidadeDaLicao`; nenhum JSON precisou de correção, validação programática deu 0 erros de contrato nas 25 lições novas)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\types.ts` (campo opcional `imagem` em `ExercicioMC` e `ExercicioIntruso`)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\engine\types.ts` (contrato de conteúdo virou re-export de `../content/types`, como o próprio arquivo previa; estado ganhou `wallet.praticasHoje`, `checkpoints: string[]`, `ultimoDesafioXp`)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\engine\store.ts` (novos métodos `concluirCheckpoint`, `concluirDesafioDia`, `concluirPratica` + helper privado `aplicarXpAvulso` com meta diária; migração e rollover de dia cobrem os campos novos)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\engine\index.ts`, `hooks.ts` (exports novos; `useProgresso` expõe `checkpoints`)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\Trilha.tsx` + `trilha.css` (6 unidades empilhadas, cor do meta com variante clara/escura, gating, sheet de desbloqueio por 200 cristais, marcador de checkpoint por unidade, cartão Prática livre, auto-scroll ao nó atual)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\Player.tsx`, `Conclusao.tsx`, `Feedback.tsx`, `ExMC.tsx`, `ExIntruso.tsx`, `player.css` (checkpoint pago na conclusão que fecha a unidade com item "+50 checkpoint" no placar; `licao` opcional no reveal; figura de rótulo nos dois formatos)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\main.tsx` (rota /pratica fullscreen), `vite.config.ts` (rotulos fora do precache, runtime caching CacheFirst `rotulos-v1` max 60 entradas/60 dias), `shots.mjs` (6 cenas novas)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\pratica\desafios.json` (enriquecido com bloco `vinho`)

## Arquivos novos
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\engine\__tests__\eventos.test.ts` (7 testes: checkpoint único/persistido/meta, desafio 1x/dia, prática D0, soft cap 10/10/10/5/5/3 com rollover, vida recuperada)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\trilha\desbloqueios.ts` (persistência `tp.desbloqueios.v1`; débito é do engine)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\licao\RotuloFigura.tsx` (img lazy, max 40vh, skeleton só após 300ms)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\pratica\tipos.ts`, `sessao.ts` (contrato do banco; rodada de 8 com 4 da habilidade mais fraca, rodízio das demais por score, janela anti-repetição `tp.pratica.v1`, arco abre/fecha fácil, rng determinístico p/ screenshots)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\routes\Pratica.tsx` + `pratica.css`, `Desafio.tsx` reescrito + `desafio.css` ampliado
- `C:\Users\camargo\Downloads\treino-paladar-app\scripts\enriquecer_desafios.py` (idempotente, fatos só do `vinhos_clean.csv`)

## Decisões tomadas
1. Desafios.json não tinha dados de revelação (nome/uva/país/preço); enriqueci via script a partir do banco canônico, com faixa de preço derivada de `preco_referencia` (5 buckets), nunca inventada.
2. Checkpoint disparado pela UI na conclusão que completa a unidade (o engine não conhece a composição das unidades); idempotência e persistência ficam no engine (`estado.checkpoints`).
3. Prática: XP 10 com soft cap próprio contado por `praticasHoje` (3 cheias, depois 50%, depois 25%, D0 isento), para o drill infinito não virar farm; conta streak e recupera 1 vida (regra de revisão); nunca exige vidas; erros não custam vida.
4. Desbloqueio antecipado só ofertado na primeira unidade fechada (foco, sem menu de compras na trilha); desbloquear u3 não abre u4.
5. Desafio: 1 resultado por dia em `tp.desafio.v1` (chave própria); sair no meio não queima a tentativa, só conclusão grava; XP 30 idempotente por dia no engine; seleção = dias desde epoch no fuso America/Sao_Paulo módulo 40; grade ■/□ via navigator.share com fallback clipboard + toast.
6. Imagens: webp não entrava no precache por extensão, mas deixei `globIgnores` explícito + CacheFirst.

## Autocrítica (screenshot loop, 1 iteração)
Achados e corrigidos: vão morto de 64px acima de toda trilha (agora a folga existe só quando o pill Começar flutua sobre o 1º nó); falta de auto-scroll até a unidade ativa (corrigido, só quando além da u1); emenda branca da foto sobre container bege (container da foto virou branco com hairline, exceção comentada no CSS). Verificado contra o brief: 0 travessões, 0 emoji em src/ (■/□ só no share), cores só da paleta com papel, 3 raios, alvos >= 44pt, skeleton 300ms, animação só transform/opacity. Resta como melhoria futura: pergunta de 2 opções da prática deixa a tela vazia no meio (válido, mas mereceria layout próprio) e o teclado de share nativo não é testável no loop.
