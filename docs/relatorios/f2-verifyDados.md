AUDITORIA INDEPENDENTE — FÁBRICA DE QUESTÕES (treino-paladar-app)
Verificado com Python direto contra os artefatos; nenhum relatório foi usado como fonte. Meta interna dos JSONs foi recontada, não confiada.

Arquivos auditados:
- C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\pratica\banco-pratica.json (480 exercícios)
- C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\pratica\desafios.json (40 desafios)
- C:\Users\camargo\Downloads\treino-paladar-app\data\vinhos_clean.csv (12.620 linhas)
- C:\Users\camargo\Downloads\treino-paladar-app\app\public\rotulos\ (112 webp)
- Contrato: app\src\content\types.ts · Seleção de data: app\src\routes\Desafio.tsx (indiceDoDia = diasEpoch % 40)

| # | Checagem | Resultado | Números |
|---|----------|-----------|---------|
| 1 | Amostra dura 40 (seed 42, random.sample) — correta bate com CSV | PASS | 40/40 corretas (11 qual-uva, 8 harmoniza, 8 de-onde-vem, 5 intruso, 4 rotulo, 4 mais-encorpado) |
| 2a | Distratores acidentalmente corretos (uva secundária, país, categoria de harmonização, tipo igual) | PASS | 0 em 40; estendi para os 480: 0 |
| 2b | Anti-vazamento (nome exibido revela resposta) | PASS c/ ressalvas | 0 vazamentos diretos em 480; 6 soft leaks (warnings abaixo) |
| 3 | Schema vs types.ts (campos, índices em range, dificuldade 1-3, opções únicas, ids únicos) | PASS | 480/480 banco + 160/160 perguntas de desafio, 0 violações; meta interna == recontagem |
| 4 | Imagens: existem, webp, peso, dimensões | PASS | 112 referenciadas = 112 na pasta, 0 faltando, 0 órfãs; 0,78 MB < 8 MB; TODAS as 112 medidas: largura máx = 480 |
| 5 | Desafios: 40 itens, 4 perguntas, vinhoId no CSV com imagem, datas | PASS | 40/40 com 4 perguntas; 160/160 perguntas conferidas factualmente vs CSV: 0 erros; módulo 40 simulado por 120 dias: 0 colisões em qualquer janela de 40 dias |
| 6 | Copy: travessão/emoji | PASS | 0 travessões (—), 0 en-dash (–), 0 emojis em todos os 640 itens |
| 7 | Balanceamento (nenhuma célula > 40%) | FAIL | template OK (máx 19%); dificuldade OK (1=39%, 2=39%, 3=22%); habilidade FALHA: rotulo = 312/480 = 65% |
| extra | Elegibilidade dos vinhos usados (não pedido, mas auditado) | PASS | 379 vinhos: 100% is_vinho=True, is_active=True, categoria=vinho, view_estrita=True, 0 erro_factual |

Violação encontrada (única objetiva):
- Balanceamento por habilidade: rotulo = 312/480 (65%) — 4 dos 6 templates (qual-uva, de-onde-vem, intruso-uva, rotulo) mapeiam para a habilidade 'rotulo'. Estrutural, não acidental. docura=36 (8%), tanino=36 (8%), corpo=18 (4%), harmonizacao=78 (16%).

Warnings (não invalidam a resposta, mas facilitam):
- Vazamento indireto (região no nome em pergunta de país): de-onde-vem-40c3db1106 (nome contém "Gevrey Chambertin" → denuncia França), de-onde-vem-4dd7db2d14 (nome contém "Moscato d'Asti" → denuncia Itália).
- Vazamento semântico de doçura não coberto pela lista LEAK da fábrica: mais-encorpado-docura-b1203eef5a-88a8ababb4 e mais-encorpado-docura-11ac9f0150-f10de5ebd8 ("Malmsey Rich" = Madeira doce), mais-encorpado-docura-e3ad5a6fba-e3e36c9ca4 ("Duke of Clarence Rich"), mais-encorpado-docura-fc0fbb9a9d-835425bd8d ("Cooler Morango E Pêssego" — nome grita doce; e um cooler de frutas constar como vinho elegível com view_estrita=True é questão do pipeline do CSV, não da fábrica).

Falsos positivos descartados durante a auditoria (transparência): 3 flags de mais-encorpado vieram do meu matcher de nomes (a fábrica encurta nomes de exibição removendo "750 Ml"/"Tinto"/"Suave" — re-conferido por similaridade de tokens: todas as 90 duplas têm a correta com valor estritamente maior, gap >= 2); 12 flags de intruso-uva vieram de eu classificar uva por estilo modal do banco (Sémillon→sobremesa, Macabeo→espumante) — ampelograficamente ambas são brancas; re-conferido com tabela curada de cor de uva: 60/60 corretos, regras consistentes.

VEREDITO: APROVADO COM RESSALVA. A fábrica é factualmente sólida — 0 erros de resposta, 0 distratores acidentalmente corretos e 0 vazamentos diretos em todos os 480 exercícios + 160 perguntas de desafio conferidos contra o CSV canônico; schema, imagens, datas e copy 100% limpos. Reprova apenas no critério de balanceamento por habilidade (rotulo 65% > 40%), e recomenda-se adicionar "rich", "malmsey" e nomes de fruta/cooler à lista LEAK_DOCURA de scripts/fabrica_questoes.py.
