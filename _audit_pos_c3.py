# -*- coding: utf-8 -*-
"""Auditoria independente pos-C3 (verificador de dados). Nao confia no relatorio."""
import csv, json, os, re, sys, random, hashlib, unicodedata, statistics
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE, "data", "vinhos_clean.csv")
BANCO = os.path.join(BASE, "app", "src", "content", "pratica", "banco-pratica.json")
DESAFIOS = os.path.join(BASE, "app", "src", "content", "pratica", "desafios.json")
ROTULOS = os.path.join(BASE, "app", "public", "rotulos")

OUT = []
def p(*a):
    OUT.append(" ".join(str(x) for x in a))

# ----------------------------------------------------------- helpers (independentes)
def norm(s):
    if s is None: return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()

def contem_termo(texto_norm, termo_norm):
    if not termo_norm: return False
    return re.search(r"(?<![a-z0-9])" + re.escape(termo_norm) + r"(?![a-z0-9])", texto_norm) is not None

SINONIMOS_UVA = {
    "shiraz": "syrah", "garnacha": "grenache", "garnacha tinta": "grenache",
    "cannonau": "grenache", "garnatxa": "grenache", "garnacha blanca": "grenache blanc",
    "tinta roriz": "tempranillo", "aragonez": "tempranillo", "tinto fino": "tempranillo",
    "tinta del pais": "tempranillo", "cencibel": "tempranillo", "ull de llebre": "tempranillo",
    "pinot grigio": "pinot gris", "spatburgunder": "pinot noir", "pinot nero": "pinot noir",
    "zinfandel": "primitivo", "monastrell": "mourvedre", "mataro": "mourvedre",
    "moscato": "moscatel", "muscat": "moscatel", "moscatel de alejandria": "moscatel",
    "moscato bianco": "moscatel", "muscat blanc": "moscatel", "ugni blanc": "trebbiano",
    "cot": "malbec", "sangiovese grosso": "sangiovese", "brunello": "sangiovese",
    "prosecco": "glera", "viura": "macabeo", "alvarinho": "albarino",
    "mazuelo": "carignan", "carinena": "carignan", "spanna": "nebbiolo",
    "cinsaut": "cinsault", "petite sirah": "durif", "melon de bourgogne": "muscadet",
    "torrontes riojano": "torrontes",
    "blend tinto": "_blend", "blend branco": "_blend", "blend rose": "_blend",
    "blend espumante": "_blend", "blend": "_blend", "corte": "_blend",
    "assemblage": "_blend", "varias": "_blend",
}
def canon_uva(raw):
    u = norm(raw)
    u = SINONIMOS_UVA.get(u, u)
    if u.startswith("blend") or u in ("_blend", "", "nan"):
        u = "_blend" if u else ""
    return u

def tokens_uva(uva_canon):
    toks = set()
    grupos = [uva_canon] + [k for k, v in SINONIMOS_UVA.items() if v == uva_canon]
    for g in grupos:
        for t in g.split():
            if len(t) >= 4: toks.add(t)
    if "cabernet" in uva_canon: toks.add("cabernet")
    return toks

DEMONIMOS = {
    "Brasil": ["brasileiro", "brasileira", "nacional"], "Chile": ["chileno", "chilena"],
    "Argentina": ["argentino", "argentina"], "Portugal": ["portugues", "portuguesa"],
    "França": ["frances", "francesa"], "Itália": ["italiano", "italiana"],
    "Espanha": ["espanhol", "espanhola"], "EUA": ["americano", "americana", "norte americano"],
    "Austrália": ["australiano", "australiana"], "Uruguai": ["uruguaio", "uruguaia"],
    "Alemanha": ["alemao", "alema"], "África do Sul": ["sul africano", "sul africana"],
    "Nova Zelândia": ["neozelandes", "neozelandesa"], "Grécia": ["grego", "grega"],
    "Hungria": ["hungaro", "hungara"],
}
LEAK_DOCURA = ["seco", "suave", "doce", "demi", "brut", "nature", "moscatel",
    "moscato", "late harvest", "colheita tardia", "licoroso", "dolce", "sweet",
    "moelleux", "auslese", "spatlese", "icewine", "sauternes", "tokaji", "porto",
    "port", "ruby", "tawny", "jerez", "sherry", "lambrusco", "doux", "dulce", "asti",
    "rich", "malmsey", "bual", "boal", "lagrima", "eiswein", "ice wine",
    "beerenauslese", "trockenbeerenauslese", "passito", "recioto", "vin santo",
    "vinsanto", "maury", "banyuls", "morango", "pessego", "maracuja", "abacaxi",
    "framboesa", "amora", "cereja", "lichia", "tangerina", "frutas"]
LEAK_CORPO = ["encorpado", "leve", "light", "intenso", "gran reserva", "concentrado"]
LEAK_TANINO = ["tanico", "macio", "suave", "intenso", "gran reserva"]

HARMONIZA_CATEGORIAS = {
    "churrasco": (["churrasco", "costela", "picanha", "bbq", "barbecue"], "Churrasco"),
    "carne_vermelha": (["carnes vermelhas", "carne vermelha", "cordeiro", "bife",
        "ossobuco", "file mignon", "carne assada", "carnes grelhadas", "carne de panela"],
        "Carne vermelha grelhada"),
    "massa_molho_vermelho": (["molho de tomate", "ao sugo", "bolonhesa", "ragu",
        "molhos a base de carne", "lasanha", "molho vermelho"], "Massa ao sugo"),
    "queijo_curado": (["queijos curados", "queijo curado", "queijos duros", "parmesao",
        "pecorino", "grana padano", "queijos maturados", "queijo reino"],
        "Queijo curado tipo parmesão"),
    "pizza": (["pizza"], "Pizza de mussarela"),
    "frutos_do_mar": (["frutos do mar", "camarao", "lula", "polvo", "mariscos",
        "vieiras", "lagosta"], "Frutos do mar"),
    "peixe_leve": (["peixes grelhados", "peixe grelhado", "peixes brancos",
        "peixe branco", "linguado", "robalo", "tilapia", "peixes leves"],
        "Peixe branco grelhado"),
    "salada": (["saladas", "salada"], "Salada de folhas frescas"),
    "ostras": (["ostras"], "Ostras frescas"),
    "ceviche": (["ceviche"], "Ceviche"),
    "sushi": (["sushi", "sashimi", "comida japonesa"], "Sushi"),
    "aves": (["frango", "aves", "peru", "galeto"], "Frango assado"),
    "aperitivo": (["aperitivos", "aperitivo", "petiscos", "entradas leves", "canapes"],
        "Petiscos de entrada"),
    "sobremesa": (["sobremesas", "sobremesa", "chocolate", "doces"], "Sobremesa de chocolate"),
    "feijoada": (["feijoada"], "Feijoada"),
    "queijo_azul": (["queijos azuis", "gorgonzola", "roquefort"], "Queijo gorgonzola"),
}
PRATO2SLUG = {prato: slug for slug, (_k, prato) in HARMONIZA_CATEGORIAS.items()}
PRATO2SLUG["Sobremesa de frutas"] = "sobremesa"

# ----------------------------------------------------------- carga CSV
csvmap = {}
with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        csvmap[row["id"]] = row

def preco_de(vid):
    r = csvmap.get(vid)
    if not r: return None
    try: return float(r.get("preco_referencia") or "")
    except ValueError: return None

def faixa_c3(preco):
    if preco is None: return "sem_preco"
    if preco < 30: return "<30"
    if preco <= 80: return "30-80"
    if preco <= 150: return "80-150"
    return ">150"

# stats de uva (cor) independentes, replicando a semantica do banco
uva_stats = defaultdict(lambda: {"n": 0, "tinto": 0, "branco": 0})
for r in csvmap.values():
    if r.get("view_estrita") != "True": continue
    if r.get("preco_valido") == "False": continue
    u = canon_uva(r.get("uva_principal"))
    if not u or u == "_blend": continue
    uva_stats[u]["n"] += 1
    t = (r.get("tipo") or "").strip()
    if t == "tinto": uva_stats[u]["tinto"] += 1
    elif t == "branco": uva_stats[u]["branco"] += 1
def cor_uva(u):
    st = uva_stats.get(u)
    if not st: return None
    cores = st["tinto"] + st["branco"]
    if cores >= 3:
        if st["tinto"] / cores >= 0.9: return "tinto"
        if st["branco"] / cores >= 0.9: return "branco"
    return None

falhas = {}   # check -> lista de problemas
nums = {}     # check -> numeros

# =====================================================================
# 1) banco-pratica.json
# =====================================================================
banco = json.load(open(BANCO, encoding="utf-8"))
ex = banco["exercicios"]
probs1 = []
n_total = len(ex)
if n_total != 480: probs1.append("total != 480: %d" % n_total)
if banco.get("total") != n_total: probs1.append("metadado total=%s != len=%d" % (banco.get("total"), n_total))
ids = [e["id"] for e in ex]
n_unicos = len(set(ids))
if n_unicos != n_total: probs1.append("ids duplicados: %d unicos de %d" % (n_unicos, n_total))

HABS = {"tanino", "acidez", "corpo", "docura", "frutado", "rotulo", "harmonizacao"}
PERMITIDOS = {"id", "template", "vinhoId", "vinhoIdB", "variante", "habilidade",
              "tipo", "dificuldade", "calibrar", "pergunta", "opcoes", "correta",
              "okMsg", "erroMsg", "porque", "imagem", "intruso", "regra"}
schema_err = 0
for e in ex:
    err = None
    extras = set(e.keys()) - PERMITIDOS
    if extras: err = "campos fora do contrato: %s" % extras
    elif e.get("dificuldade") not in (1, 2, 3): err = "dificuldade invalida"
    elif e.get("habilidade") not in HABS: err = "habilidade invalida: %s" % e.get("habilidade")
    elif e.get("tipo") == "mc":
        for c in ("pergunta", "opcoes", "correta", "okMsg", "erroMsg", "porque"):
            if c not in e: err = "mc sem campo %s" % c; break
        if not err:
            if not (isinstance(e["opcoes"], list) and 2 <= len(e["opcoes"]) <= 4
                    and all(isinstance(o, str) and o.strip() for o in e["opcoes"])):
                err = "opcoes invalidas"
            elif not (isinstance(e["correta"], int) and 0 <= e["correta"] < len(e["opcoes"])):
                err = "correta fora do range"
            elif "imagem" in e and not re.fullmatch(r"/rotulos/[\w-]+\.webp", e["imagem"]):
                err = "imagem com path estranho: %s" % e["imagem"]
    elif e.get("tipo") == "intruso":
        for c in ("pergunta", "opcoes", "intruso", "regra"):
            if c not in e: err = "intruso sem campo %s" % c; break
        if not err and not (isinstance(e["intruso"], int) and len(e["opcoes"]) == 4
                            and 0 <= e["intruso"] < 4):
            err = "intruso fora do range"
    else:
        err = "tipo desconhecido: %s" % e.get("tipo")
    if err:
        schema_err += 1
        if len(probs1) < 12: probs1.append("%s: %s" % (e.get("id"), err))
# vinhoIds existem no CSV
vinho_refs = [e[k] for e in ex for k in ("vinhoId", "vinhoIdB") if k in e]
orfaos_csv = [v for v in vinho_refs if v not in csvmap]
if orfaos_csv: probs1.append("vinhoIds fora do CSV: %d" % len(orfaos_csv))

QUOTAS = {"qual-uva": (90, {1: 36, 2: 36, 3: 18}), "de-onde-vem": (90, {1: 36, 2: 30, 3: 24}),
          "mais-encorpado": (90, {1: 36, 2: 30, 3: 24}), "harmoniza": (78, {1: 30, 2: 36, 3: 12}),
          "intruso-uva": (60, {1: 24, 2: 24, 3: 12}), "rotulo": (72, {1: 24, 2: 30, 3: 18})}
por_tmpl = Counter(e["template"] for e in ex)
por_tmpl_dif = Counter((e["template"], e["dificuldade"]) for e in ex)
for t, (tot, por_d) in QUOTAS.items():
    if por_tmpl.get(t, 0) != tot:
        probs1.append("template %s: %d != cota %d" % (t, por_tmpl.get(t, 0), tot))
    for d, c in por_d.items():
        if por_tmpl_dif.get((t, d), 0) != c:
            probs1.append("cota %s dif %d: %d != %d" % (t, d, por_tmpl_dif.get((t, d), 0), c))
por_hab = Counter(e["habilidade"] for e in ex)
hab_max = por_hab.most_common(1)[0] if por_hab else ("-", 0)
cap = int(n_total * 0.40)
if hab_max[1] > cap:
    probs1.append("habilidade %s = %d > cap %d (40%%)" % (hab_max[0], hab_max[1], cap))
# metadados de contagem
if dict(banco.get("porTemplate", {})) != dict(por_tmpl): probs1.append("porTemplate metadado divergente")
if {int(k): v for k, v in banco.get("porDificuldade", {}).items()} != dict(Counter(e["dificuldade"] for e in ex)):
    probs1.append("porDificuldade metadado divergente")
if dict(banco.get("porHabilidade", {})) != dict(por_hab): probs1.append("porHabilidade metadado divergente")
# copy: travessao/emoji
travessao = sum(1 for e in ex if "—" in json.dumps(e, ensure_ascii=False) or "–" in json.dumps(e, ensure_ascii=False))
if travessao: probs1.append("%d exercicios com travessao" % travessao)

falhas["1"] = probs1
nums["1"] = dict(total=n_total, ids_unicos=n_unicos, schema_erros=schema_err,
                 por_template=dict(por_tmpl), hab_max=hab_max, cap_40=cap,
                 por_dif=dict(Counter(e["dificuldade"] for e in ex)))

# =====================================================================
# 2) distribuicao de preco do bundle
# =====================================================================
faixas_tot = Counter()
faixas_dif = defaultdict(Counter)
for e in ex:
    vid = e.get("vinhoId")
    fx = "sem_vinho" if not vid else faixa_c3(preco_de(vid))
    faixas_tot[fx] += 1
    faixas_dif[e["dificuldade"]][fx] += 1
pct3080 = faixas_tot["30-80"] / n_total * 100
probs2 = []
if pct3080 < 45: probs2.append("30-80 = %.1f%% < 45%%" % pct3080)
alto = faixas_tot[">150"]
alto_d3 = faixas_dif[3][">150"]
nums["2"] = dict(total=dict(faixas_tot), pct_30_80=round(pct3080, 1),
                 por_dif={d: dict(c) for d, c in sorted(faixas_dif.items())},
                 alto_total=alto, alto_dif3=alto_d3,
                 alto_dif12=alto - alto_d3,
                 pct_alto_em_dif3=round(alto_d3 / alto * 100, 1) if alto else None)
falhas["2"] = probs2

# =====================================================================
# 3) amostra dura 20 (seed 7)
# =====================================================================
rng = random.Random(7)
amostra = rng.sample(ex, 20)
probs3 = []
detalhes3 = []

def leak_no_nome(nome_norm, termos):
    return [t for t in termos if contem_termo(nome_norm, norm(t))]

# regioes por pais (para leak de regiao no de-onde-vem)
regioes_pais = defaultdict(set)
for r in csvmap.values():
    if r.get("view_estrita") != "True": continue
    reg, pais = (r.get("regiao") or "").strip(), (r.get("pais") or "").strip()
    if reg and pais and pais != "Outros":
        rn = norm(reg)
        if len(rn) >= 4: regioes_pais[pais].add(rn)

for e in amostra:
    t, eid = e["template"], e["id"]
    erros = []
    row = csvmap.get(e.get("vinhoId")) if e.get("vinhoId") else None
    nome_norm = norm(row["nome"]) if row else ""
    if t == "qual-uva" or (t == "rotulo" and e.get("variante") == "uva"):
        u_csv = canon_uva(row["uva_principal"])
        if canon_uva(e["opcoes"][e["correta"]]) != u_csv:
            erros.append("resposta '%s' != uva CSV '%s'" % (e["opcoes"][e["correta"]], row["uva_principal"]))
        secs = {canon_uva(s) for s in re.split(r"[,;/]", row.get("uvas_secundarias") or "") if s.strip()}
        for i, o in enumerate(e["opcoes"]):
            if i == e["correta"]: continue
            cu = canon_uva(o)
            if cu == u_csv: erros.append("distrator '%s' == uva principal" % o)
            if cu in secs: erros.append("distrator '%s' esta nas uvas secundarias" % o)
        lk = leak_no_nome(nome_norm, tokens_uva(u_csv))
        if lk: erros.append("vazamento: nome contem token de uva %s" % lk)
    elif t == "de-onde-vem" and e.get("variante") == "pais" or (t == "rotulo" and e.get("variante") == "pais"):
        pais = row["pais"].strip()
        if e["opcoes"][e["correta"]] != pais:
            erros.append("resposta '%s' != pais CSV '%s'" % (e["opcoes"][e["correta"]], pais))
        for i, o in enumerate(e["opcoes"]):
            if i != e["correta"] and norm(o) == norm(pais):
                erros.append("distrator duplica o pais correto")
        if t == "de-onde-vem":  # rotulo/pais usa imagem; leak de nome so vale sem imagem? factory checa nos dois
            alvos = [pais] + DEMONIMOS.get(pais, [])
            lk = [a for a in alvos if contem_termo(nome_norm, norm(a))]
            if lk: erros.append("vazamento: nome contem pais/gentilico %s" % lk)
            lkr = [rn for rn in regioes_pais.get(pais, ()) if contem_termo(nome_norm, rn)]
            if lkr: erros.append("vazamento: nome contem regiao do pais %s" % lkr[:3])
    elif t == "de-onde-vem" and e.get("variante") == "regiao":
        reg = (row.get("regiao") or "").strip()
        if norm(e["opcoes"][e["correta"]]) != norm(reg):
            erros.append("resposta '%s' != regiao CSV '%s'" % (e["opcoes"][e["correta"]], reg))
        if contem_termo(nome_norm, norm(reg)):
            erros.append("vazamento: nome contem a regiao")
        for i, o in enumerate(e["opcoes"]):
            if i == e["correta"]: continue
            a, b = norm(o), norm(reg)
            if a == b or a in b or b in a:
                erros.append("distrator '%s' conflita com a regiao correta" % o)
    elif t == "mais-encorpado":
        var = e["variante"]; dim = var
        rb = csvmap.get(e.get("vinhoIdB"))
        try:
            va, vb = float(row[dim]), float(rb[dim])
        except (TypeError, ValueError):
            va = vb = None; erros.append("dimensao %s ausente no CSV" % dim)
        if va is not None:
            if va - vb < 2: erros.append("contraste %s: A=%.0f B=%.0f (dif < 2)" % (dim, va, vb))
            if vb >= va: erros.append("DISTRATOR CORRETO: B >= A em %s" % dim)
        leakset = {"docura": LEAK_DOCURA, "corpo": LEAK_CORPO, "tanino": LEAK_TANINO}[var]
        for lbl, rr in (("A", row), ("B", rb)):
            lk = leak_no_nome(norm(rr["nome"]), leakset)
            if lk: erros.append("vazamento %s no nome do vinho %s: %s" % (var, lbl, lk))
    elif t == "harmoniza" or (t == "rotulo" and False):
        tn = norm(row.get("harmonizacao_texto") or "")
        certa = e["opcoes"][e["correta"]]
        slug = PRATO2SLUG.get(certa)
        if not slug:
            erros.append("prato correto '%s' nao mapeia para categoria" % certa)
        else:
            kws = HARMONIZA_CATEGORIAS[slug][0]
            if not any(contem_termo(tn, norm(k)) for k in kws):
                erros.append("resposta '%s' sem keyword na ficha do vinho" % certa)
        for i, o in enumerate(e["opcoes"]):
            if i == e["correta"]: continue
            s2 = PRATO2SLUG.get(o)
            if s2 and any(contem_termo(tn, norm(k)) for k in HARMONIZA_CATEGORIAS[s2][0]):
                erros.append("DISTRATOR CORRETO: '%s' tambem esta na ficha" % o)
    elif t == "intruso-uva":
        cores = [cor_uva(canon_uva(o)) for o in e["opcoes"]]
        grupo = [c for i, c in enumerate(cores) if i != e["intruso"]]
        ci = cores[e["intruso"]]
        if None in cores:
            erros.append("uva sem cor determinavel: %s" % [o for o, c in zip(e["opcoes"], cores) if c is None])
        elif len(set(grupo)) != 1:
            erros.append("grupo nao homogeneo: %s" % list(zip(e["opcoes"], cores)))
        elif ci == grupo[0]:
            erros.append("intruso da mesma cor do grupo")
        # mais de um da cor invertida = segundo intruso valido
        if cores.count(ci) > 1 and ci is not None:
            erros.append("DISTRATOR CORRETO: mais de uma uva da cor do intruso")
    elif t == "rotulo" and e.get("variante") == "tipo":
        tipo_map = {"tinto": "Tinto", "branco": "Branco", "espumante": "Espumante", "rose": "Rosé"}
        tcsv = tipo_map.get((row.get("tipo") or "").strip())
        if e["opcoes"][e["correta"]] != tcsv:
            erros.append("resposta '%s' != tipo CSV '%s'" % (e["opcoes"][e["correta"]], tcsv))
    # checks comuns a todos
    ops_norm = [norm(o) for o in e["opcoes"]]
    if len(set(ops_norm)) != len(ops_norm): erros.append("opcoes duplicadas")
    if "imagem" in e:
        fn = os.path.join(ROTULOS, os.path.basename(e["imagem"]))
        if not os.path.isfile(fn): erros.append("imagem inexistente: %s" % e["imagem"])
        if e.get("vinhoId") and os.path.basename(e["imagem"]) != e["vinhoId"] + ".webp":
            erros.append("imagem nao corresponde ao vinhoId")
    txt = " ".join([e.get("pergunta", "")] + [e.get(k, "") for k in ("okMsg", "erroMsg", "porque", "regra")])
    if "—" in txt or "–" in txt: erros.append("travessao na copy")
    detalhes3.append((eid, t, e.get("variante", ""), "OK" if not erros else "; ".join(erros)))
    if erros: probs3.append("%s [%s/%s]: %s" % (eid, t, e.get("variante", ""), "; ".join(erros)))

falhas["3"] = probs3
nums["3"] = dict(amostra=20, com_erro=len(probs3),
                 templates=dict(Counter(d[1] for d in detalhes3)))

# =====================================================================
# 4) desafios.json
# =====================================================================
dd = json.load(open(DESAFIOS, encoding="utf-8"))
ds = dd["desafios"]
probs4 = []
if len(ds) != 40: probs4.append("desafios != 40: %d" % len(ds))
npergs = [len(d["perguntas"]) for d in ds]
if any(n != 4 for n in npergs): probs4.append("desafios sem 4 perguntas: %s" % Counter(npergs))
ids_d = [d["id"] for d in ds]
if len(set(ids_d)) != len(ds): probs4.append("ids de desafio duplicados")
vids_d = [d["vinhoId"] for d in ds]
if len(set(vids_d)) != len(ds): probs4.append("vinhoId repetido entre desafios (colide na rotacao de datas)")
# datas: indiceDoDia = dias_epoch % 40 -> 40 dias consecutivos cobrem cada desafio 1x
import datetime
hoje = datetime.date(2026, 6, 12)
indices = [(hoje + datetime.timedelta(days=i)).toordinal() % len(ds) for i in range(len(ds))] if ds else []
if sorted(indices) != list(range(len(ds))):
    probs4.append("rotacao de datas com colisao dentro da janela de 40 dias")
precos_d, fora_gondola, sem_img, sem_br = [], [], [], []
for d in ds:
    r = csvmap.get(d["vinhoId"])
    if not r: probs4.append("%s: vinhoId fora do CSV" % d["id"]); continue
    pr = preco_de(d["vinhoId"])
    precos_d.append(pr)
    if pr is None or not (30 <= pr <= 150): fora_gondola.append((d["id"], pr))
    if r.get("origem_cadastro") == "scrape_vivino": sem_br.append(d["id"])
    fimg = os.path.join(ROTULOS, d["vinhoId"] + ".webp")
    if not os.path.isfile(fimg): sem_img.append(d["id"])
    if d.get("imagem") != "/rotulos/%s.webp" % d["vinhoId"]: probs4.append("%s: path de imagem errado" % d["id"])
    # respostas das 4 perguntas vs CSV
    tipo_map = {"tinto": "Tinto", "branco": "Branco", "espumante": "Espumante", "rose": "Rosé"}
    for q in d["perguntas"]:
        certa = q["opcoes"][q["correta"]]
        pg = q["pergunta"]
        if "qual tipo" in pg:
            if certa != tipo_map.get((r.get("tipo") or "").strip()):
                probs4.append("%s: tipo '%s' != CSV '%s'" % (d["id"], certa, r.get("tipo")))
        elif "qual país vem" in pg:
            if certa != r["pais"].strip():
                probs4.append("%s: pais '%s' != CSV '%s'" % (d["id"], certa, r["pais"]))
        elif "uva principal" in pg:
            if canon_uva(certa) != canon_uva(r["uva_principal"]):
                probs4.append("%s: uva '%s' != CSV '%s'" % (d["id"], certa, r["uva_principal"]))
        elif "pratos costuma cair bem" in pg:
            tn = norm(r.get("harmonizacao_texto") or "")
            slug = PRATO2SLUG.get(certa)
            if not slug or not any(contem_termo(tn, norm(k)) for k in HARMONIZA_CATEGORIAS[slug][0]):
                probs4.append("%s: prato '%s' sem keyword na ficha" % (d["id"], certa))
            for i, o in enumerate(q["opcoes"]):
                if i == q["correta"]: continue
                s2 = PRATO2SLUG.get(o)
                if s2 and any(contem_termo(tn, norm(k)) for k in HARMONIZA_CATEGORIAS[s2][0]):
                    probs4.append("%s: DISTRATOR CORRETO em harmonizacao: '%s'" % (d["id"], o))
        elif "faixa de preço" in pg:
            fxs = [("Até R$ 40", 0, 40), ("Entre R$ 40 e R$ 90", 40, 90),
                   ("Entre R$ 90 e R$ 200", 90, 200), ("Entre R$ 200 e R$ 500", 200, 500),
                   ("Acima de R$ 500", 500, 10**9)]
            esperada = next((rot for rot, lo, hi in fxs if lo < pr <= hi), None)
            if certa != esperada:
                probs4.append("%s: faixa '%s' != esperada '%s' (preco %.0f)" % (d["id"], certa, esperada, pr))
    # bloco vinho do enriquecer
    vb = d.get("vinho") or {}
    if not vb: probs4.append("%s: sem bloco vinho" % d["id"])
    else:
        def faixa_amig(p):
            if p <= 40: return "ate R$ 40"
            if p <= 80: return "R$ 40 a 80"
            if p <= 150: return "R$ 80 a 150"
            if p <= 300: return "R$ 150 a 300"
            return "acima de R$ 300"
        if vb.get("faixaPreco") != faixa_amig(pr):
            probs4.append("%s: faixaPreco do card '%s' != '%s'" % (d["id"], vb.get("faixaPreco"), faixa_amig(pr)))
        if vb.get("pais") != r["pais"].strip():
            probs4.append("%s: pais do card divergente" % d["id"])
if sem_img: probs4.append("desafios sem imagem em rotulos: %s" % sem_img)
if fora_gondola: probs4.append("desafios fora de R$30-150: %s" % fora_gondola)
if sem_br: probs4.append("desafios sem mercado BR: %s" % sem_br)
pv = sorted(x for x in precos_d if x is not None)
nums["4"] = dict(n=len(ds), perguntas=sum(npergs), ids_unicos=len(set(ids_d)),
                 vinhos_unicos=len(set(vids_d)),
                 preco_min=min(pv) if pv else None, preco_mediana=statistics.median(pv) if pv else None,
                 preco_max=max(pv) if pv else None,
                 em_30_150=sum(1 for x in pv if 30 <= x <= 150),
                 com_imagem=len(ds) - len(sem_img), mercado_br=len(ds) - len(sem_br))
falhas["4"] = probs4

# =====================================================================
# 5) imagens
# =====================================================================
arquivos = set(os.listdir(ROTULOS))
refs = set()
for e in ex:
    if "imagem" in e: refs.add(os.path.basename(e["imagem"]))
for d in ds:
    refs.add(os.path.basename(d["imagem"]))
quebradas = sorted(refs - arquivos)
orfas = sorted(arquivos - refs)
nao_webp = [a for a in arquivos if not a.endswith(".webp")]
peso = sum(os.path.getsize(os.path.join(ROTULOS, a)) for a in arquivos) / 1024 / 1024
probs5 = []
if quebradas: probs5.append("referencias quebradas: %d %s" % (len(quebradas), quebradas[:3]))
if orfas: probs5.append("imagens orfas: %d %s" % (len(orfas), orfas[:3]))
if nao_webp: probs5.append("arquivos nao-webp: %s" % nao_webp)
nums["5"] = dict(arquivos=len(arquivos), referencias=len(refs), quebradas=len(quebradas),
                 orfas=len(orfas), peso_mb=round(peso, 2))
falhas["5"] = probs5

# ----------------------------------------------------------- saida
print(json.dumps({"nums": nums, "falhas": falhas,
                  "amostra_detalhe": detalhes3}, ensure_ascii=False, indent=1, default=str))
