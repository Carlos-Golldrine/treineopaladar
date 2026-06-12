# VERIFICAÇÃO ADVERSARIAL — DD PÚBLICO TCHIN TCHIN
Recomputado do zero a partir dos arquivos brutos: `s5_comments_classified.csv`, `s2_community_comments.csv`, `s5_personas_visual.csv`, `s3_instagram_personas.csv`, `s1_demand_map.csv` (em `...\tchin-pipeline-v2\data\output\`) e `Extração - Vinhos(Comentarios).csv` / `(Reddit).csv` (em `C:\Users\camargo\Downloads\`). Pipeline próprio (pandas/scipy/statsmodels), sem reaproveitar o `_analysis_quant.py`.

## 1. Tabela: alegado vs recomputado

| # | Número na síntese | Recomputado do bruto | Veredito |
|---|---|---|---|
| 1 | IG 35-54 = 49,1% [36,6; 61,7], n=57, binomial p=0,500 | 28/57 = 49,1% [36,6; 61,7], p=0,500 | **BATE** |
| 2 | IG modal 25-34 = 31,6%; 25-44 = 59,6% | 18/57 = 31,6%; 34/57 = 59,6% | **BATE** |
| 3 | IG gênero F 71,7% [58,4; 82,0], p=0,002, razão 2,5:1 | 38/53 = 71,7% [58,4; 82,0], p=0,0022, 2,53:1 | **BATE** |
| 4 | Iniciante amplo 65,4% [61,3; 69,3]; 51,3% c/ indefinidos; binomial vs 0,73 p=1,3e-4 | 346/529 = 65,4% [61,3; 69,3]; p=1,29e-4; c/ indefinidos 346/676 = **51,2%** (51,3% só se excluir 1 NaN: 346/675) | **BATE** (51,3 vs 51,2 = quibble de denominador) |
| 5 | HP3 51,8% / HP4 32,7% [28,8; 36,8], razão 1,6x, p=3e-10 | 274/529 = 51,8%; 173/529 = 32,7% [28,8; 36,8]; 1,58x; z=6,29 p=3,25e-10 | **BATE** |
| 6 | Dor HP3 2,33 vs HP4 1,74; dor alta 37,2% vs 18,5%; Cliff 0,375 | idêntico (MW p=2e-12; Cliff=0,375) | **BATE** |
| 7 | Learning HP3 75,9%; JTBD nº1 "aprender sem parecer ignorante" 42% | 75,9% [70,5; 80,6]; JTBD 42,0% | **BATE** |
| 8 | Logit: entendido OR 1,71 [1,11; 2,63] p=0,014; sensibilidade OR 1,74 p=0,004; pain/learning nulos | OR 1,71 [1,11; 2,63] p=0,0140; sens. 1,74 p=0,0041; pain p=0,187, learning p=0,484 | **BATE** |
| 9 | rho dúvida×upvotes = −0,126, p-FDR=0,002 | rho=−0,126, p=0,0010, p-FDR=0,0019 (família de 28 pares replicada) | **BATE** |
| 10 | Queries: n=114, 65,8% iniciante [56,7; 73,9] | 75/114 = 65,8% [56,7; 73,9] | **BATE** |
| 11 | Citações com likes (S2435=8, S2267=8, S2436=56, S2661=210, S2626=1.304 "máximo do acervo", S2442=18, S2627=116, S2073=15, S2417=15; RD392 "bet money") | Esquema [S2nnn] = índice 0-based do subset pt do s2 decifrado; **todos os 9 likes conferem no microdado**; 1.304 não é o máximo absoluto (max pt = 10.467, o do Malbec), mas é o maior de comentário citável de tema; RD392 contém a frase | **BATE** (ressalva no "mais curtido de todo o acervo") |
| 12 | YT: "18/264 pedem teste cego/desafio" | Regex ampla (cega/cego/blind/ranking/adivinh/desafio/teste/errar/acertar/viés/jogo): **13/264**; YT157/158/236/238 existem verbatim | **NÃO BATE exato** (codificação manual; 13 reproduzíveis, 18 não) |
| 13 | Reddit: "14/536 menções a IA, 100% hostis" | Menções explícitas a IA no texto: **4** (RD022, RD448, RD450, RD533) + 2 sob o post "WineCrafter AI" = **4-6**. O "14" do 02-qualitativo era a categoria "IA **e atalhos de tecnologia**" (inclui CellarTracker/anti-app RD055-056). Hostis: sim, mas n=4-6 | **NÃO BATE** como enunciado na síntese |
| 14 | Malbec: "29/118 menções pt a Malbec no TikTok são sobre o perfume" (top like 10.467) | 118 = **total de comentários TikTok pt**; 29 = os que mencionam "malbec"; só **7/29** têm palavra de perfume/Boticário no texto (resto é inferência de contexto, 3 vídeos); top like 10.467 confere | **BATE nos inteiros, NÃO BATE na frase** (denominador invertido; "são sobre o perfume" não verificável por texto) |
| 15 | vision_wine_present 12/73; bios 15/64 com credencial | 12 True / 60 False / 1 NaN → 12/73 confere; credenciais estritas (WSET/somm/enolog/ABS): **13-14**/64, não 15 | **BATE** / quase (14≈15) |
| 16 | Temas: ~82 suave, ~74 jargão, ~67 preço, ~37 paladar, ~32 ocasião /676 | Regex independente: 40, 38, 63, 17, 16 — só "preço" reproduz; os demais dependem do dicionário do codificador (declarado como "teto") | **NÃO REPRODUZÍVEL** com precisão citada |

Não recomputáveis por ausência de microdado no acervo (citados como [DADO] na síntese): cadastros n=148 (mediana 40, 35-54=53%), Consevitis n=1.709, IDIs n=13, BSB 53%, "tom acessível 53% dos virais". São agregados declarados em outros documentos.

## 2. Overclaims, n pequeno e correlação→causa

**Overclaims (por gravidade):**
1. **ALTA — C5/B3 "14/536 menções a IA, 100% hostis"**: o número real de menções explícitas a IA é 4-6; o 14 importa indevidamente a categoria "atalhos de tecnologia" do qualitativo. Uma correção OBRIGATÓRIA de posicionamento (derrubar o PR pitch "App com IA") está apoiada em **4 comentários de um subreddit anglófono**. A direção é defensável como hipótese; como "[DADO]... unânime" é inflação ~3x.
2. **ALTA — A1 "Idade 35-54: SUSTENTADA com confiança média-alta"**: a perna auditável (IG, n=57) tem p=0,500 num teste sem nenhum poder — isso é "não refutada", não "sustentada"; o IC [36,6; 61,7] é compatível com a tese e com a antítese. A perna que "sustenta" (cadastros n=148) **não tem microdado no acervo** — chamar de "duas fontes independentes" quando uma não é verificável é overclaim. Veredito honesto: não testável de verdade.
3. **MÉDIA — B2/C2 correlação vendida como causa**: OR 1,71 (pseudo-R²=0,027, preditor = rótulo de IA, outcome = like em comentário de terceiros) vira "o entendido é o motor de distribuição... ele engaja **e compartilha**" — share nunca foi medido. Idem rho=−0,126 (r²≈1,6%) virando previsão sobre algoritmo ("conteúdo aprenda-comigo não será carregado"). O 01-quantitativo chama de "sinais direcionais"; a síntese endurece para [DADO] e ergue a correção OBRIGATÓRIA C2 em cima.
4. **MÉDIA — C8 Malbec**: frase com denominador invertido (ver tabela #14); a inferência "são sobre o perfume" é contextual, não textual. Recomendação barata e provavelmente correta, mas o "29/118" como redigido não é o que o dado diz.
5. **MÉDIA — contagens temáticas citadas como [DADO] preciso** ("~82/676", "18/264"): o próprio 02-qualitativo declara codificador único, regex-teto, sem confiabilidade inter-codificadores; minha reprodução dá valores 40-60% menores em vários temas. Deveriam circular como [DADO proxy] — exatamente o rebaixamento que a própria DD recomenda no E9 e não aplica a si mesma.
6. **BAIXA — n pequeno tratado com solidez excessiva**: gênero 71,7% "sinal robusto" (n=53, demografia inferida por visão IA com erro de medida não quantificado — o p=0,002 ignora isso); C4 objetivo "trabalho" promovido com ~10 casos; células etárias de 5-18 perfis; "1.304 likes = comentário mais curtido de todo o acervo" (o mais curtido é o do Malbec, 10.467).

**Pontos a favor (registro adversarial honesto):** os 10 números estatísticos centrais reproduzem **exatamente** a partir do microdado, incluindo ICs, p-valores, FDR e o logit com sensibilidade — raro em DD desse tipo. Todas as 9 citações com likes conferem no arquivo bruto. Os caveats do 01-quantitativo (rótulos IA correlacionados, pseudo-R² baixo, viés de seleção) são corretos; a degradação ocorre na passagem 01/02 → síntese, onde hipóteses ganham etiqueta [DADO].

## 3. Veredito

**APROVADO COM CORREÇÕES.** A espinha quantitativa é fiel ao dado bruto (10/10 números decisivos batem). Correções obrigatórias antes de uso em board/investidor: (a) reescrever a evidência de C5 como "4-6 menções explícitas, todas hostis, em corpus anglófono" e rebaixar de [DADO] para hipótese de risco; (b) corrigir a frase do Malbec em C8 (29 = menções a malbec em 118 comentários TikTok; vínculo com perfume é contextual); (c) trocar o veredito A1 de "SUSTENTADA com confiança média-alta" para "não refutada; única perna auditável sem poder estatístico; cadastros n=148 não verificáveis"; (d) reetiquetar contagens temáticas e "18/264" como [DADO proxy, codificador único]; (e) remover linguagem causal de B2/C2 ("motor de distribuição", "compartilha") até existir métrica de share real.
