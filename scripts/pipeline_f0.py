# -*- coding: utf-8 -*-
"""
Pipeline F0 — Treine seu Paladar
Limpa o seed v10_5 (aba 'vinhos') e gera vinhos_clean.csv/.jsonl,
imagens_manifest.csv e QA-pipeline.md. Idempotente: roda do zero a cada
execucao, nunca toca o xlsx fonte.

Uso:
  python pipeline_f0.py            # pipeline completo
  python pipeline_f0.py --qa-only  # regenera so o QA-pipeline.md a partir de data/_stats_pipeline.json
"""
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

import pandas as pd

SRC = r"C:\Users\camargo\OneDrive\Área de Trabalho\Tchin Tchin\ai.vinhos\tchintchin_vinhos_seed_v10_5.xlsx"
ROOT = Path(r"C:\Users\camargo\Downloads\treino-paladar-app")
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)

STATS_PATH = DATA / "_stats_pipeline.json"
TESTE_IMG_PATH = DATA / "imagens_teste_resultado.json"

log_lines = []


def log(msg):
    print(msg, flush=True)
    log_lines.append(msg)


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")


def norm_chave(s):
    if pd.isna(s):
        return ""
    s = sem_acento(s).lower().strip()
    # remove pontuacao (apostrofos, aspas, hifens, pontos) e sufixos de volume,
    # para colapsar variantes como "Taylor's"/"Taylor S" e "Alamos - 750ml"/"Alamos 750ml"
    s = re.sub(r"\b(\d{3,4})\s*ml\b", "", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def preenchido(v):
    if pd.isna(v):
        return False
    if isinstance(v, str) and v.strip() == "":
        return False
    return True


# ---------------------------------------------------------------- regras
# Termos categoricamente nao-vinho: removem SEMPRE (teor so vai no motivo).
# \blicor\b nao casa com "licoroso" (boundary), entao vinho licoroso esta a salvo.
RE_NAO_VINHO_SEMPRE = re.compile(
    r"\b(gin|cacha[çc]a|licor|brandy|conhaque|whisk(?:e)?y|vodka|sucos?|"
    r"vinagres?|sacolas?|ta[çc]as?|saca[\s\-]?rolhas?|"
    r"coolers?|sangrias?|coquetel|coquet[eé]is)\b",
    re.IGNORECASE,
)
# Termos ambiguos (ha vinhos reais com esses nomes, ex. "Abridor Blend 2019"):
# removem apenas se teor ausente ou fora de 4-25.
RE_NAO_VINHO_COND = re.compile(r"\b(abridor(?:es)?|kits?)\b", re.IGNORECASE)

# Kits multi-vinho que sobram no clean nao sao um vinho individual:
# ficam fora da view_estrita (nao servem para gerar questao).
# Bag-in-box de um vinho so (ex. Almaden 3L) E vinho individual -> fica na view.
RE_KIT_PACK = re.compile(r"\bkits?\b", re.IGNORECASE)

RE_ICONE = re.compile(
    r"petrus|roman[ée]e|\bdrc\b|lafite|margaux|yquem|screaming\s*eagle",
    re.IGNORECASE,
)

MAPA_TIPO = {
    "tinto": "tinto",
    "branco": "branco",
    "rose": "rose",
    "rosé": "rose",
    "rosado": "rose",
    "espumante": "espumante",
    "frisante": "espumante",  # lossy -> flag requer_revisao_tipo
    "fortificado": "fortificado",
    "fortificado_ou_doce": "fortificado",
    "licoroso": "fortificado",
    "sobremesa": "sobremesa",
    "laranja": "laranja",
    "laranjas": "laranja",
}

MAPA_PAIS = {
    "Australia": "Austrália",
    "Estados Unidos": "EUA",
    "Franca": "França",
    "Italia": "Itália",
    "Africa do Sul": "África do Sul",
    "Nova Zelandia": "Nova Zelândia",
    "Grecia": "Grécia",
    "Austria": "Áustria",
    "Libano": "Líbano",
    "Georgia": "Geórgia",
    "Hungria": "Hungria",
}

EXTS_OK = {"jpg", "jpeg", "png", "webp", "gif", "avif"}


def inferir_ext(url):
    try:
        path = urlparse(str(url)).path
    except Exception:
        return "jpg"
    m = re.search(r"\.([A-Za-z0-9]{2,5})$", path)
    if m and m.group(1).lower() in EXTS_OK:
        e = m.group(1).lower()
        return "jpg" if e == "jpeg" else e
    return "jpg"  # default; download corrige pelo content-type


def main():
    stats = {}

    log("== Pipeline F0 — lendo fonte (somente leitura) ==")
    df = pd.read_excel(SRC, sheet_name="vinhos")
    n0 = len(df)
    stats["linhas_fonte"] = n0
    log(f"Fonte: {n0} linhas x {len(df.columns)} colunas")

    colunas_originais = list(df.columns)

    # ---------------- PASSO 1: nao-vinhos vazados ----------------
    nomes = df["nome"].fillna("")
    match_sempre = nomes.apply(lambda s: bool(RE_NAO_VINHO_SEMPRE.search(s)))
    match_cond = nomes.apply(lambda s: bool(RE_NAO_VINHO_COND.search(s)))
    teor = pd.to_numeric(df["teor_alcoolico"], errors="coerce")
    teor_suspeito = teor.isna() | (teor < 4) | (teor > 25)
    excluir = match_sempre | (match_cond & teor_suspeito)
    poupados = match_cond & ~teor_suspeito & ~match_sempre  # ex. Abridor Blend, kits de vinho

    excluidos = df[excluir].copy()

    def motivo_exclusao(row):
        nome = str(row["nome"])
        m = RE_NAO_VINHO_SEMPRE.search(nome) or RE_NAO_VINHO_COND.search(nome)
        termo = m.group(0).lower() if m else "?"
        t = row["teor_alcoolico"]
        teor_txt = "teor ausente" if pd.isna(t) else f"teor {t}"
        return f"nao-vinho (termo '{termo}', {teor_txt})"

    excluidos["motivo"] = excluidos.apply(motivo_exclusao, axis=1)
    excluidos.to_csv(DATA / "excluidos.csv", index=False, encoding="utf-8-sig")
    df = df[~excluir].copy()
    stats["p1_nao_vinhos_removidos"] = int(excluir.sum())
    stats["p1_nome_bateu_mas_teor_ok"] = int(poupados.sum())
    stats["p1_exemplos"] = excluidos["nome"].head(15).tolist()
    log(f"PASSO 1: removidos {excluir.sum()} nao-vinhos -> data/excluidos.csv "
        f"({poupados.sum()} ambiguos com teor 4-25 mantidos, ex. kits de vinho e 'Abridor')")

    # ---------------- PASSO 2: Monte Paschoal espumante->tinto ----------------
    mp_mask = (
        df["nome"].str.contains("monte paschoal", case=False, na=False)
        & (df["tipo"] == "espumante")
        & (pd.to_numeric(df["tanino"], errors="coerce") >= 3)
    )
    stats["p2_monte_paschoal_corrigidos"] = int(mp_mask.sum())
    stats["p2_nomes"] = df.loc[mp_mask, "nome"].tolist()
    df.loc[mp_mask, "tipo"] = "tinto"
    log(f"PASSO 2: {mp_mask.sum()} Monte Paschoal espumante -> tinto: "
        f"{stats['p2_nomes']}")

    # suspeito extra (tinto no nome, tipo espumante, tanino baixo) -> so flag
    extra_susp = (
        df["nome"].str.contains(r"\btinto\b", case=False, na=False)
        & (df["tipo"] == "espumante")
        & ~df["nome"].str.contains("espumante|frisante|moscatel", case=False, na=False)
    )
    stats["p2_suspeitos_flagados"] = int(extra_susp.sum())

    # ---------------- PASSO 3: normalizar tipo ----------------
    antes_tipo = df["tipo"].value_counts(dropna=False).to_dict()
    tipo_norm = df["tipo"].astype("string").str.strip().str.lower()
    frisante_mask = tipo_norm == "frisante"
    df["tipo"] = tipo_norm.map(MAPA_TIPO)
    nao_mapeado = tipo_norm.notna() & df["tipo"].isna()
    if nao_mapeado.any():
        log(f"  AVISO: {nao_mapeado.sum()} valores de tipo nao mapeados: "
            f"{sorted(tipo_norm[nao_mapeado].unique().tolist())}")
    df["requer_revisao_tipo"] = df["tipo"].isna() | frisante_mask | extra_susp | nao_mapeado
    stats["p3_tipo_antes"] = {str(k): int(v) for k, v in antes_tipo.items()}
    stats["p3_tipo_depois"] = {str(k): int(v) for k, v in df["tipo"].value_counts(dropna=False).items()}
    stats["p3_requer_revisao_tipo"] = int(df["requer_revisao_tipo"].sum())
    stats["p3_frisante_para_espumante"] = int(frisante_mask.sum())
    log(f"PASSO 3: tipo normalizado para enum; {df['tipo'].isna().sum()} NaN mantidos; "
        f"requer_revisao_tipo={df['requer_revisao_tipo'].sum()} "
        f"(NaN + {frisante_mask.sum()} frisante->espumante + {extra_susp.sum()} suspeitos)")

    # ---------------- PASSO 4: normalizar pais ----------------
    pais_strip = df["pais"].astype("string").str.strip()
    alterados_pais = pais_strip.map(lambda p: MAPA_PAIS.get(p, p) if pd.notna(p) else p) != df["pais"]
    df["pais"] = pais_strip.map(lambda p: MAPA_PAIS.get(p, p) if pd.notna(p) else p)
    stats["p4_pais_alterados"] = int(alterados_pais.fillna(False).sum())
    stats["p4_paises_depois"] = {str(k): int(v) for k, v in df["pais"].value_counts(dropna=False).items()}
    log(f"PASSO 4: pais normalizado ({alterados_pais.fillna(False).sum()} celulas alteradas)")

    # ---------------- PASSO 5: status_moderacao ----------------
    antes_status = df["status_moderacao"].value_counts(dropna=False).to_dict()
    df["status_moderacao"] = df["status_moderacao"].replace(
        {"auto_aprovado": "aprovado_auto", "aprovado_automatico": "aprovado_auto"}
    )
    stats["p5_status_antes"] = {str(k): int(v) for k, v in antes_status.items()}
    stats["p5_status_depois"] = {str(k): int(v) for k, v in df["status_moderacao"].value_counts(dropna=False).items()}
    log(f"PASSO 5: status_moderacao -> {stats['p5_status_depois']}")

    # ---------------- PASSO 6: confianca_sensorial 0-100 ----------------
    mapa_conf = {"alto": 85, "medio": 70, "médio": 70, "baixo": 50}

    def conv_conf(v):
        if pd.isna(v):
            return None
        if isinstance(v, str):
            vs = v.strip().lower()
            if vs in mapa_conf:
                return mapa_conf[vs]
            try:
                return float(vs)
            except ValueError:
                return None
        return float(v)

    conf_antes_categorica = df["confianca_sensorial"].astype(str).str.lower().isin(mapa_conf).sum()
    df["confianca_sensorial"] = df["confianca_sensorial"].apply(conv_conf)
    df["confianca_sensorial"] = pd.to_numeric(df["confianca_sensorial"], errors="coerce")
    stats["p6_categoricas_convertidas"] = int(conf_antes_categorica)
    stats["p6_conf_describe"] = {k: round(float(v), 1) for k, v in df["confianca_sensorial"].describe().items()}
    log(f"PASSO 6: confianca_sensorial unificada 0-100 ({conf_antes_categorica} categoricas convertidas)")

    # ---------------- PASSO 7: preco_valido ----------------
    preco = pd.to_numeric(df["preco_referencia"], errors="coerce")
    icone = df["nome"].fillna("").apply(lambda s: bool(RE_ICONE.search(s))) | \
        df["produtor"].fillna("").astype(str).apply(lambda s: bool(RE_ICONE.search(s)))
    fora_faixa = (preco <= 15) | (preco >= 10000)
    invalido = preco.isna() | (fora_faixa & ~icone)
    df["preco_valido"] = ~invalido
    stats["p7_preco_invalido"] = int(invalido.sum())
    stats["p7_preco_nan"] = int(preco.isna().sum())
    stats["p7_fora_faixa_total"] = int(fora_faixa.fillna(False).sum())
    stats["p7_icones_poupados"] = int((fora_faixa.fillna(False) & icone).sum())
    log(f"PASSO 7: preco_valido=False em {invalido.sum()} linhas "
        f"({preco.isna().sum()} sem preco + {int((fora_faixa.fillna(False) & ~icone).sum())} fora de faixa; "
        f"{stats['p7_icones_poupados']} icones poupados)")

    # ---------------- PASSO 8: dedup ----------------
    df["_k_nome"] = df["nome"].apply(norm_chave)
    df["_k_prod"] = df["produtor"].apply(norm_chave)
    df["_k_safra"] = pd.to_numeric(df["safra"], errors="coerce").apply(
        lambda v: "nv" if pd.isna(v) else str(int(v))
    )
    df["_completude"] = df[colunas_originais].apply(lambda r: sum(preenchido(v) for v in r), axis=1)
    df["_tem_img"] = df["imagem_rotulo_url_externa"].astype(str).str.startswith("http").astype(int)
    df["_nao_ml"] = (df["fonte_dado_principal"].astype(str) != "Mercado Livre").astype(int)

    df = df.sort_values(
        by=["_completude", "_tem_img", "_nao_ml", "id"],
        ascending=[False, False, False, True],
        kind="mergesort",
    )
    dup_mask = df.duplicated(subset=["_k_nome", "_k_prod", "_k_safra"], keep="first")
    removidas = df[dup_mask].copy()
    removidas.drop(columns=[c for c in removidas.columns if c.startswith("_")]).to_csv(
        DATA / "dedup_removidos.csv", index=False, encoding="utf-8-sig"
    )
    df = df[~dup_mask].copy()
    df = df.sort_index()
    stats["p8_dedup_removidas"] = int(dup_mask.sum())
    stats["p8_grupos_duplicados"] = int(removidas.groupby(["_k_nome", "_k_prod", "_k_safra"]).ngroups)
    log(f"PASSO 8: dedup removeu {dup_mask.sum()} linhas "
        f"({stats['p8_grupos_duplicados']} grupos) -> data/dedup_removidos.csv")

    df = df.drop(columns=["_k_nome", "_k_prod", "_k_safra", "_completude", "_tem_img", "_nao_ml"])

    # ---------------- PASSO 9: view_estrita ----------------
    # "vinho real": nao-vinhos ja foram removidos no passo 1; kits/packs que
    # sobraram (teor valido) nao sao um vinho individual -> fora da view.
    eh_kit = df["nome"].fillna("").apply(lambda s: bool(RE_KIT_PACK.search(s)))
    df["view_estrita"] = (
        (df["is_active"] == True)  # noqa: E712
        & ~eh_kit
        & df["status_moderacao"].isin(["aprovado_auto", "aprovado"])
        & df["uva_principal"].apply(preenchido)
        & df["pais"].apply(preenchido)
    )
    stats["p9_view_estrita"] = int(df["view_estrita"].sum())
    stats["p9_kits_fora_da_view"] = int(eh_kit.sum())
    log(f"PASSO 9: view_estrita = {df['view_estrita'].sum()} linhas "
        f"({eh_kit.sum()} kits/packs mantidos no clean mas fora da view)")

    # ---------------- tipagem de export ----------------
    # Sem isto, colunas inteiras com NaN sairiam como "2018.0" no CSV e
    # quebrariam o \copy para integer/boolean no Postgres.
    INT_COLS = ["safra", "vivino_num_ratings", "acidez", "tanino", "corpo",
                "frutado", "docura", "tamanho_garrafa_ml"]
    BOOL01_COLS = ["safra_inferida", "requer_enriquecimento", "preco_invalido_origem",
                   "dedup_revisao_flag", "requer_revisao_factual", "erro_factual"]
    for c in INT_COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce").astype("Int64")
    for c in BOOL01_COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce").astype("Int64").astype("boolean")

    # ---------------- SAIDAS ----------------
    n_final = len(df)
    stats["linhas_finais"] = n_final

    df.to_csv(DATA / "vinhos_clean.csv", index=False, encoding="utf-8-sig")
    with open(DATA / "vinhos_clean.jsonl", "w", encoding="utf-8") as f:
        f.write(df.to_json(orient="records", lines=True, force_ascii=False))
    log(f"SAIDA: vinhos_clean.csv / .jsonl ({n_final} linhas, {len(df.columns)} colunas)")

    # manifest de imagens
    imgs = df[df["imagem_rotulo_url_externa"].astype(str).str.startswith("http")][
        ["id", "imagem_rotulo_url_externa"]
    ].rename(columns={"imagem_rotulo_url_externa": "url"})
    antes_dedup_url = len(imgs)
    imgs = imgs.drop_duplicates(subset=["url"], keep="first")
    imgs["ext"] = imgs["url"].apply(inferir_ext)
    imgs.to_csv(DATA / "imagens_manifest.csv", index=False, encoding="utf-8-sig")
    stats["manifest_linhas"] = len(imgs)
    stats["manifest_urls_duplicadas_removidas"] = antes_dedup_url - len(imgs)
    stats["manifest_ext"] = {str(k): int(v) for k, v in imgs["ext"].value_counts().items()}
    log(f"SAIDA: imagens_manifest.csv ({len(imgs)} URLs unicas; "
        f"{antes_dedup_url - len(imgs)} URLs duplicadas removidas)")

    # distribuicoes p/ QA
    stats["dist_tipo"] = {str(k): int(v) for k, v in df["tipo"].value_counts(dropna=False).items()}
    stats["dist_uvas_top10"] = {str(k): int(v) for k, v in df["uva_principal"].value_counts().head(10).items()}
    stats["dist_paises_top10"] = {str(k): int(v) for k, v in df["pais"].value_counts().head(10).items()}
    ve = df[df["view_estrita"]]
    stats["ve_dist_tipo"] = {str(k): int(v) for k, v in ve["tipo"].value_counts(dropna=False).items()}
    stats["ve_com_imagem"] = int(ve["imagem_rotulo_url_externa"].astype(str).str.startswith("http").sum())
    stats["log"] = log_lines

    STATS_PATH.write_text(json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    return stats


def gerar_qa(stats):
    teste = None
    if TESTE_IMG_PATH.exists():
        teste = json.loads(TESTE_IMG_PATH.read_text(encoding="utf-8"))

    def tabela(d, h1, h2):
        linhas = [f"| {h1} | {h2} |", "|---|---|"]
        for k, v in d.items():
            linhas.append(f"| {k} | {v} |")
        return "\n".join(linhas)

    md = f"""# QA — Pipeline F0 (banco de vinhos)

**Fonte (somente leitura):** `{SRC}` — aba `vinhos`, {stats['linhas_fonte']} linhas.
**Gerado por:** `scripts/pipeline_f0.py` (idempotente: cada execução parte do xlsx e sobrescreve as saídas).

## Contagens por passo

| Passo | Ação | Resultado |
|---|---|---|
| 1 | Não-vinhos removidos (termos categóricos sempre; `kit`/`abridor` só com teor ausente ou fora de 4–25) | **{stats['p1_nao_vinhos_removidos']}** removidos → `data/excluidos.csv` ({stats['p1_nome_bateu_mas_teor_ok']} ambíguos com teor 4–25 mantidos, ex. kits de vinho e o vinho "Abridor") |
| 2 | Monte Paschoal espumante → tinto | **{stats['p2_monte_paschoal_corrigidos']}** corrigidos ({stats['p2_suspeitos_flagados']} suspeito(s) extra apenas flagados) |
| 3 | Tipo normalizado p/ enum | {stats['p3_frisante_para_espumante']} frisante→espumante; `requer_revisao_tipo=true` em **{stats['p3_requer_revisao_tipo']}** linhas (tipo NaN + frisante + suspeitos) |
| 4 | País normalizado | **{stats['p4_pais_alterados']}** células alteradas (Australia→Austrália, Estados Unidos→EUA) |
| 5 | status_moderacao unificado | {stats['p5_status_depois']} |
| 6 | confianca_sensorial → 0–100 | **{stats['p6_categoricas_convertidas']}** categóricas convertidas (alto=85, medio=70, baixo=50) |
| 7 | preco_valido=false | **{stats['p7_preco_invalido']}** linhas ({stats['p7_preco_nan']} sem preço + fora de faixa; {stats['p7_icones_poupados']} ícones poupados pela whitelist) |
| 8 | Dedup (nome+produtor+safra normalizados) | **{stats['p8_dedup_removidas']}** removidas em {stats['p8_grupos_duplicados']} grupos → `data/dedup_removidos.csv` |
| 9 | view_estrita | **{stats['p9_view_estrita']}** linhas elegíveis ({stats.get('p9_kits_fora_da_view', 0)} kits/packs mantidos no clean mas fora da view) |

## Linhas finais

- **Total no clean:** {stats['linhas_finais']}
- **view_estrita = true:** {stats['p9_view_estrita']} (destas, {stats['ve_com_imagem']} com imagem externa)
- Regra da view: `is_active` ∧ vinho real (não-vinhos removidos no passo 1; kits/packs excluídos da view) ∧ `status_moderacao ∈ (aprovado_auto, aprovado)` ∧ `uva_principal` preenchida ∧ `pais` preenchido
- Nota: `preco_valido=false` inclui também linhas **sem preço** ({stats['p7_preco_nan']}), além das fora de faixa (≤R$15 ou ≥R$10.000 sem whitelist)

## Distribuições pós-limpeza

### Tipo (clean completo)

{tabela(stats['dist_tipo'], 'tipo', 'linhas')}

### Top 10 uvas

{tabela(stats['dist_uvas_top10'], 'uva_principal', 'linhas')}

### Top 10 países

{tabela(stats['dist_paises_top10'], 'pais', 'linhas')}

## Imagens

- **Manifest:** {stats['manifest_linhas']} URLs únicas (`data/imagens_manifest.csv`); {stats['manifest_urls_duplicadas_removidas']} URLs duplicadas entre linhas removidas no dedup de URL.
- Extensões inferidas: {stats['manifest_ext']} (URLs VTEX sem extensão recebem default `jpg`; o downloader corrige pelo content-type).
"""
    if teste:
        md += f"""
### Teste de download (10 imagens)

- Tentadas: {teste.get('tentadas')}
- Sucesso: {teste.get('ok')}
- Falhas: {teste.get('falhas')}
- Puladas (já existiam): {teste.get('puladas')}
- Detalhe: {teste.get('detalhe', '—')}

Arquivos salvos em `data/imagens/` e contam como resume do download completo (`python data/download_imagens.py`).
"""
    else:
        md += "\n### Teste de download\n\nAinda não executado (`python data/download_imagens.py --limit 10`).\n"

    md += """
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
""" + "\n".join(stats.get("log", [])) + "\n```\n"

    (DATA / "QA-pipeline.md").write_text(md, encoding="utf-8")
    print("QA-pipeline.md gerado.", flush=True)


if __name__ == "__main__":
    if "--qa-only" in sys.argv:
        stats = json.loads(STATS_PATH.read_text(encoding="utf-8"))
        gerar_qa(stats)
    else:
        stats = main()
        gerar_qa(stats)
