FÁBRICA DE QUESTÕES ENTREGUE. Tudo determinístico (seed 20260611), zero LLM em runtime: todo fato vem de coluna do `vinhos_clean.csv`, todo distrator vem de proximidade taxonômica calculada do próprio banco.

**Arquivos entregues**
- `C:\Users\camargo\Downloads\treino-paladar-app\scripts\fabrica_questoes.py` (fábrica, idempotente, ~30s por run)
- `C:\Users\camargo\Downloads\treino-paladar-app\scripts\preparar_rotulos.py` (conversor webp, idempotente, remove órfãos)
- `C:\Users\camargo\Downloads\treino-paladar-app\data\banco_pratica_full.jsonl` (banco completo)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\pratica\banco-pratica.json` (bundle curado com metadados geradoEm/seed/total/porTemplate/porDificuldade/porHabilidade)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\src\content\pratica\desafios.json` (40 Desafios do Dia)
- `C:\Users\camargo\Downloads\treino-paladar-app\app\public\rotulos\` (112 webp 480px q80)
- `C:\Users\camargo\Downloads\treino-paladar-app\data\QA-fabrica.md` (relatório completo)

**Números**
- Base elegível: 10.310 vinhos (view_estrita ∧ preco_valido!=False ∧ filtro defensivo de não-vinhos); 274 uvas canônicas após sinônimos (Shiraz=Syrah, Tinta Roriz=Tempranillo, Prosecco=Glera etc.), 106 com cor derivada do banco (≥90% consistência)
- Banco completo: **19.533 exercícios** válidos (dif1 7.364 / dif2 6.926 / dif3 5.243): de-onde-vem 5.317, rotulo 4.342, mais-encorpado 4.016, harmoniza 3.216, qual-uva 2.422, intruso-uva 220
- Bundle curado: **480 exatos** (qual-uva 90, de-onde-vem 90, mais-encorpado 90, harmoniza 78, rotulo 72, intruso 60; dif 186/186/108), 420/480 de vinhos do mercado BR, 420 com imagem baixada
- Desafios: **40 × 4 perguntas** (arco fácil-difícil-difícil-fácil: tipo → país → uva → harmonização/faixa de preço), máx 2 por produtor, 10 por país
- Imagens: **112 webp, 0,78 MB total** (alvo <8MB), média 7,2 KB, transparência composta sobre branco
- Aproveitamento: 19.533 aceitos / 37.151 tentados (53%); maiores descartes: nome contém a uva (5.198), uva blend (1.518), nome vaza doçura tipo "Port/Suave" (1.875), poucos países distratores (1.342)
- Auditoria independente final: **0** violações de copy (travessão/emoji/vocabulário proibido), **0** vazamentos pergunta-resposta, **0** ids duplicados, **0** refs de imagem quebradas

**Exemplos gerados**
- qual-uva (dif2): "O Michele Chiarlo Palás Barolo, da região de Piemonte, é feito principalmente de qual uva?" Tannat/Sangiovese/Aglianico/**Nebbiolo**
- de-onde-vem (dif3): "O Sassicaia vem da Itália. De qual região?" Puglia/Sicilia/Piemonte/**Toscana**
- mais-encorpado (dif1, doçura): "Qual destes costuma ser mais doce?" Château Suduiraut vs Denis Dubourdieu Reynon Sauvignon Blanc
- harmoniza (dif1): "Qual destes pratos costuma cair bem com o Marqués de Murrieta Dalmau?" **Carne vermelha grelhada**/Sushi/Ostras frescas/Ceviche (distratores validados como ausentes da ficha do vinho)
- intruso-uva (dif1): Pinot Noir/**Chardonnay**/Syrah/Cabernet Sauvignon, regra "três dão tinto"
- rotulo (dif2, com imagem): "Olhe o rótulo com calma. Este vinho vem de qual país?" + `/rotulos/{uuid}.webp` (nome do vinho nunca exibido neste template)

**Problemas encontrados e tratados durante a construção**
1. `harmonizacao_categorias` está vazia em 100% da view (só existe em linhas pendentes) — o template harmoniza parseia `harmonizacao_texto` (fato do banco) com mapa fixo keyword→prato e valida que o distrator não aparece no texto do vinho
2. 21 canivetes Bianchi, kits ("Kit3 Portadas + Bolsa") e um coquetel RTD vazaram na view_estrita — filtro defensivo por regex na fábrica (vale corrigir upstream no pipeline_f0)
3. Ids de vinho não são todos UUID (`v10-ml-*`) — sufixo de id de exercício virou hash md5 para evitar colisão
4. Regiões duplicadas em idiomas ("Central Valley"/"Vale Central", "Uco Valley"/"Valle de Uco") — conflito por interseção de núcleo de tokens + 17 grupos curados de regiões aninhadas (Colchagua⊂Valle Central, Vale dos Vinhedos⊂Serra Gaúcha etc.)
5. Habilidades acidez/frutado não têm template viável sem vazamento (nenhum nome de vinho indica acidez); cobertura atual: rotulo 312, harmonizacao 78, docura 36, tanino 36, corpo 18 — acidez/frutado seguem cobertos pelas lições autorais
6. Não toquei em nenhum `src/*.ts(x)`; os JSONs seguem exatamente os payloads `ExercicioMC`/`ExercicioIntruso` de `types.ts` + campos de catálogo (id, template, vinhoId, habilidade, imagem)
