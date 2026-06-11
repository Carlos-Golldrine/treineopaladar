# QA — Pipeline F0 (banco de vinhos)

**Fonte (somente leitura):** `C:\Users\camargo\OneDrive\Área de Trabalho\Tchin Tchin\ai.vinhos\tchintchin_vinhos_seed_v10_5.xlsx` — aba `vinhos`, 14603 linhas.
**Gerado por:** `scripts/pipeline_f0.py` (idempotente: cada execução parte do xlsx e sobrescreve as saídas).

## Contagens por passo

| Passo | Ação | Resultado |
|---|---|---|
| 1 | Não-vinhos removidos (termos categóricos sempre; `kit`/`abridor` só com teor ausente ou fora de 4–25) | **73** removidos → `data/excluidos.csv` (11 ambíguos com teor 4–25 mantidos, ex. kits de vinho e o vinho "Abridor") |
| 2 | Monte Paschoal espumante → tinto | **2** corrigidos (5 suspeito(s) extra apenas flagados) |
| 3 | Tipo normalizado p/ enum | 30 frisante→espumante; `requer_revisao_tipo=true` em **405** linhas (tipo NaN + frisante + suspeitos) |
| 4 | País normalizado | **226** células alteradas (Australia→Austrália, Estados Unidos→EUA) |
| 5 | status_moderacao unificado | {'aprovado_auto': 12604, 'pendente': 1926} |
| 6 | confianca_sensorial → 0–100 | **13166** categóricas convertidas (alto=85, medio=70, baixo=50) |
| 7 | preco_valido=false | **415** linhas (343 sem preço + fora de faixa; 11 ícones poupados pela whitelist) |
| 8 | Dedup (nome+produtor+safra normalizados) | **1910** removidas em 1309 grupos → `data/dedup_removidos.csv` |
| 9 | view_estrita | **10739** linhas elegíveis (10 kits/packs mantidos no clean mas fora da view) |

## Linhas finais

- **Total no clean:** 12620
- **view_estrita = true:** 10739 (destas, 4761 com imagem externa)
- Regra da view: `is_active` ∧ vinho real (não-vinhos removidos no passo 1; kits/packs excluídos da view) ∧ `status_moderacao ∈ (aprovado_auto, aprovado)` ∧ `uva_principal` preenchida ∧ `pais` preenchido
- Nota: `preco_valido=false` inclui também linhas **sem preço** (343), além das fora de faixa (≤R$15 ou ≥R$10.000 sem whitelist)

## Distribuições pós-limpeza

### Tipo (clean completo)

| tipo | linhas |
|---|---|
| tinto | 7682 |
| branco | 2566 |
| espumante | 1050 |
| rose | 548 |
| nan | 367 |
| fortificado | 305 |
| sobremesa | 94 |
| laranja | 8 |

### Top 10 uvas

| uva_principal | linhas |
|---|---|
| Cabernet Sauvignon | 1383 |
| Chardonnay | 1272 |
| Blend Tinto | 1031 |
| Malbec | 1022 |
| Merlot | 862 |
| Pinot Noir | 597 |
| Sauvignon Blanc | 381 |
| Tempranillo | 362 |
| Touriga Nacional | 256 |
| Syrah | 256 |

### Top 10 países

| pais | linhas |
|---|---|
| Brasil | 2843 |
| Chile | 1841 |
| Argentina | 1774 |
| França | 1559 |
| Outros | 1076 |
| Itália | 1051 |
| Portugal | 988 |
| Espanha | 783 |
| EUA | 145 |
| Austrália | 143 |

## Imagens

- **Manifest:** 5338 URLs únicas (`data/imagens_manifest.csv`); 52 URLs duplicadas entre linhas removidas no dedup de URL.
- Extensões inferidas: {'jpg': 3743, 'png': 1141, 'webp': 454} (URLs VTEX sem extensão recebem default `jpg`; o downloader corrige pelo content-type).

### Teste de download (10 imagens)

- Tentadas: 13
- Sucesso: 3
- Falhas: 0
- Puladas (já existiam): 10
- Detalhe: todas baixadas com sucesso

Arquivos salvos em `data/imagens/` e contam como resume do download completo (`python data/download_imagens.py`).

## Saídas

| Arquivo | Conteúdo |
|---|---|
| `data/vinhos_clean.csv` (UTF-8 BOM) / `.jsonl` | catálogo limpo, todas as colunas + flags `requer_revisao_tipo`, `preco_valido`, `view_estrita` |
| `data/excluidos.csv` | não-vinhos removidos, com motivo |
| `data/dedup_removidos.csv` | duplicatas removidas (perdedoras de cada grupo) |
| `data/imagens_manifest.csv` | id, url, ext — base do download |
| `data/download_imagens.py` | downloader standalone com resume |
| `supabase/migrations/0001_vinhos.sql` / `0002_app.sql` | schema do banco e do app |
| `scripts/IMPORT-SUPABASE.md` | instruções de import |

## Log bruto da última execução

```
== Pipeline F0 — lendo fonte (somente leitura) ==
Fonte: 14603 linhas x 56 colunas
PASSO 1: removidos 73 nao-vinhos -> data/excluidos.csv (11 ambiguos com teor 4-25 mantidos, ex. kits de vinho e 'Abridor')
PASSO 2: 2 Monte Paschoal espumante -> tinto: ['Vinho Monte Paschoal Reserva Merlot Tinto 750ml', 'Vinho Monte Paschoal Dedicato Cabernet Sauvignon Tinto 750ml']
PASSO 3: tipo normalizado para enum; 370 NaN mantidos; requer_revisao_tipo=405 (NaN + 30 frisante->espumante + 5 suspeitos)
PASSO 4: pais normalizado (226 celulas alteradas)
PASSO 5: status_moderacao -> {'aprovado_auto': 12604, 'pendente': 1926}
PASSO 6: confianca_sensorial unificada 0-100 (13166 categoricas convertidas)
PASSO 7: preco_valido=False em 415 linhas (343 sem preco + 72 fora de faixa; 11 icones poupados)
PASSO 8: dedup removeu 1910 linhas (1309 grupos) -> data/dedup_removidos.csv
PASSO 9: view_estrita = 10739 linhas (10 kits/packs mantidos no clean mas fora da view)
SAIDA: vinhos_clean.csv / .jsonl (12620 linhas, 59 colunas)
SAIDA: imagens_manifest.csv (5338 URLs unicas; 52 URLs duplicadas removidas)
```
