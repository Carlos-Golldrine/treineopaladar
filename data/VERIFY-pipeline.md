Verificação completa. Todos os itens auditados diretamente no disco.

## Tabela PASS/FAIL

| # | Item | Resultado | Números reais (contados por mim) |
|---|---|---|---|
| 1 | vinhos_clean.csv carrega; totais | **PASS** | 12.958 linhas x 59 colunas (faixa esperada 12.5k-13.5k OK); view_estrita=True: 11.064 (faixa 10.5k-12k OK). Fonte xlsx confirmada: 14.603 linhas na aba `vinhos` |
| 2 | Zero não-vinhos | **PASS** | Regex deu 30 hits, TODOS investigados: 18 são substring falso-positivo ("gin" dentro de Original/Origine/Originales/Ginestra/Bòggina), 4 "Licoroso" = vinho licoroso/fortificado real (tipo sobremesa), 10 "Kit " = kits de vinho, todos com view_estrita=False. Zero gin/cachaça/whisky/vodka/suco/sacola/taça/saca-rolha reais |
| 3 | Zero duplicatas (nome, produtor, safra) | **PASS parcial** | 0 dups sob a chave do pipeline (sem acento+lower+espaços, `norm_chave` em pipeline_f0.py:41). Porém sobram **3 grupos (6 linhas)** que diferem só por apóstrofo ("Taylor's" vs "Taylor S") e **52 grupos (109 linhas, 0,84%)** se normalizar pontuação (aspas/hífen/ponto: ex. Château Léoville-Barton vs Léoville Barton, Alamos Malbec com/sem "-") |
| 4 | Enums tipo e país | **PASS** | tipo: exatamente {tinto 7.898, branco 2.628, espumante 1.080, rose 561, NaN 369, fortificado 319, sobremesa 95, laranja 8}. País: 21 valores, sem pares duplicados (só Austrália, só EUA) |
| 5 | Sensorial e preços | **PASS** | Branco/espumante com tanino>=3: apenas 2 — Lambrusco Concerto (espumante TINTO de verdade, tanino justificável, flagado requer_revisao_tipo) e Champagne Bollinger La Côte aux Enfants 2014 (100% Pinot Noir, plausível, NÃO flagado). Preços: 11 linhas preco_valido=True fora de R$15-10.000, todas ícones da whitelist (regex petrus/romanée/lafite/margaux/yquem/DRC); min R$15,11, 0 com preço NaN |
| 6 | imagens_manifest.csv | **PASS** | 5.380 linhas, 5.380 URLs únicas, 0 ids duplicados, 0 ids fora do clean. 5 URLs aleatórias baixadas na unha com requests: 5/5 HTTP 200, content-type image/png|jpeg, 35-113 KB (todas >2KB) |
| 7 | download_imagens.py | **PASS** | Código confere: resume via glob `{id}.*`, 2 retries com backoff 1.5s/3s, valida `image/*` e >2048 bytes, falhas em imagens_falhas.csv, `--limit`. Executei de verdade: `--limit 3` → pulada=3 (resume OK); `--limit 13` → ok=3, pulada=10, 3 arquivos novos salvos em data/imagens/ (13 no total) |
| 8 | SQL 0001 e 0002 | **PASS** | Ambos existem; parênteses balanceados (0/0), statements terminam em `;`. 14/14 tabelas prometidas presentes (0001: vinhos, vinhos_quarentena; 0002: profiles, licoes, progresso_licao, score_paladar, wallet, transacoes_cristais, mesas, mesa_membros, mesa_posts, mesa_tchins, exercicios, desafio_dia). Nenhuma faltando, nenhuma extra |
| 9 | QA-pipeline.md bate | **PASS com ressalva** | Batem exato: total 12.958, estrita 11.064, 4.793 c/ imagem, distribuição de tipo inteira, manifest 5.380, dedup 1.572, excluidos 73, top uvas/países. NÃO batem com o estado final do CSV (são contagens pré-dedup do passo): status_moderacao doc 12.604/1.926 vs final 11.182/1.776; preco_valido=false doc 415 vs final 408; requer_revisao_tipo doc 405 vs final 403 |

## Problemas (por gravidade)

**Bloqueante:** nenhum.

**Importante:**
1. ~109 linhas (52 grupos) de duplicatas residuais por variação de pontuação no nome (aspas, hífens, "- 750ml" vs "750ml"). Sob a chave declarada pelo construtor está zerado, mas para o app isso pode gerar o mesmo vinho 2-3x em questões. Recomendo endurecer `norm_chave` removendo pontuação.

**Menor:**
2. QA-pipeline.md apresenta 3 métricas em valores pré-dedup (status_moderacao, preco_valido, requer_revisao_tipo) sem avisar que não refletem o CSV final — pode confundir auditorias futuras.
3. Whitelist de ícones é por regex no NOME (inclui qualquer "romanée"), não por produtor: poupou "Lafite Vertical Decade Edition" a R$265.050, que é uma coleção vertical (multi-garrafa), não uma garrafa — preco_valido=True questionável.
4. Bollinger La Côte aux Enfants (espumante, tanino 3) não recebeu flag de revisão; plausível por ser blanc de noirs estruturado, mas mereceria requer_revisao_tipo=True como o Lambrusco.
5. Meus testes sobrescreveram `data/imagens_teste_resultado.json` (agora reflete ok=3/pulada=10) e adicionaram 3 imagens em data/imagens/ — efeito colateral esperado do resume, sem dano.

## Veredito geral

**APROVADO.** O relatório do construtor é fiel: todos os números centrais (12.958 / 11.064 / 5.380 / 1.572 / 73 / enums / whitelist de 11 ícones) foram reproduzidos de forma independente e batem. Pipeline, downloader e migrações funcionam como descrito (testados ao vivo). Única pendência material antes de gerar questões: passada extra de dedup punctuation-insensitive (~109 linhas, 0,84% do clean).
