# -*- coding: utf-8 -*-
"""
Fabrica de questoes deterministica do Treine seu Paladar.

Gera exercicios de pratica a partir do banco real (data/vinhos_clean.csv),
sem LLM: todo fato vem de coluna do banco, todo distrator vem de proximidade
taxonomica calculada do proprio banco. Idempotente, seed fixo.

Saidas:
  - data/banco_pratica_full.jsonl          (banco completo gerado)
  - app/src/content/pratica/banco-pratica.json  (bundle curado ~480)
  - app/src/content/pratica/desafios.json  (40 Desafios do Dia pre-montados)
  - data/QA-fabrica.md                     (relatorio de QA)

Contrato de payload: app/src/content/types.ts (ExercicioMC / ExercicioIntruso),
com campos extras de catalogo (id, template, vinhoId, habilidade, imagem).

Uso:  python scripts/fabrica_questoes.py
"""

import csv
import hashlib
import json
import os
import random
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone

# ---------------------------------------------------------------- constantes

SEED = 20260611
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE, "data", "vinhos_clean.csv")
IMG_DIR = os.path.join(BASE, "data", "imagens")
OUT_FULL = os.path.join(BASE, "data", "banco_pratica_full.jsonl")
OUT_BUNDLE = os.path.join(BASE, "app", "src", "content", "pratica", "banco-pratica.json")
OUT_DESAFIOS = os.path.join(BASE, "app", "src", "content", "pratica", "desafios.json")
OUT_QA = os.path.join(BASE, "data", "QA-fabrica.md")
ROTULOS_STATS = os.path.join(BASE, "data", "_rotulos_stats.json")

DIM_5D = ["acidez", "tanino", "corpo", "frutado", "docura"]

# nao-vinhos que vazaram para a view (filtro defensivo, regex sobre nome normalizado)
JUNK_NOME_RE = re.compile(
    r"\b(kit\d*|kits|bolsa|sacola|canivete|abridor|saca ?rolhas?|bainha|aerador|"
    r"tacas?|copos?|bomba|vacuo|rtd|old fashioned|coquetel|cocktail|"
    r"gin|vodka|whisky|aperol|espanta)\b"
)

# sinonimos de uva (chave normalizada -> grupo canonico normalizado)
SINONIMOS_UVA = {
    "shiraz": "syrah",
    "garnacha": "grenache", "garnacha tinta": "grenache", "cannonau": "grenache",
    "garnatxa": "grenache",
    "garnacha blanca": "grenache blanc",
    "tinta roriz": "tempranillo", "aragonez": "tempranillo", "tinto fino": "tempranillo",
    "tinta del pais": "tempranillo", "cencibel": "tempranillo", "ull de llebre": "tempranillo",
    "pinot grigio": "pinot gris",
    "spatburgunder": "pinot noir", "pinot nero": "pinot noir",
    "zinfandel": "primitivo",
    "monastrell": "mourvedre", "mataro": "mourvedre",
    "moscato": "moscatel", "muscat": "moscatel", "moscatel de alejandria": "moscatel",
    "moscato bianco": "moscatel", "muscat blanc": "moscatel",
    "ugni blanc": "trebbiano",
    "cot": "malbec",
    "sangiovese grosso": "sangiovese", "brunello": "sangiovese",
    "prosecco": "glera",
    "viura": "macabeo",
    "alvarinho": "albarino",
    "mazuelo": "carignan", "carinena": "carignan",
    "spanna": "nebbiolo",
    "cinsaut": "cinsault",
    "petite sirah": "durif",
    "melon de bourgogne": "muscadet",
    "torrontes riojano": "torrontes",
    "blend tinto": "_blend", "blend branco": "_blend", "blend rose": "_blend",
    "blend espumante": "_blend", "blend": "_blend", "corte": "_blend",
    "assemblage": "_blend", "varias": "_blend",
}

# preposicao de pais (default feminino: "da X")
PAIS_MASC = {"Brasil", "Chile", "Uruguai", "Mexico", "México", "Canada", "Canadá",
             "Japao", "Japão", "Libano", "Líbano", "Peru", "Paraguai"}
PAIS_PREP_ESPECIAL = {"Portugal": "de Portugal", "EUA": "dos EUA", "Israel": "de Israel",
                      "Outros": None}

CONTINENTE = {
    "Brasil": "america_sul", "Chile": "america_sul", "Argentina": "america_sul",
    "Uruguai": "america_sul", "Peru": "america_sul", "Bolívia": "america_sul",
    "EUA": "america_norte", "Canadá": "america_norte", "México": "america_norte",
    "França": "europa", "Itália": "europa", "Portugal": "europa", "Espanha": "europa",
    "Alemanha": "europa", "Áustria": "europa", "Hungria": "europa", "Grécia": "europa",
    "Romênia": "europa", "Bulgária": "europa", "Croácia": "europa", "Eslovênia": "europa",
    "Geórgia": "europa", "Moldávia": "europa", "Reino Unido": "europa", "Suíça": "europa",
    "Macedônia": "europa", "Sérvia": "europa",
    "Austrália": "oceania", "Nova Zelândia": "oceania",
    "África do Sul": "africa", "Marrocos": "africa",
    "Israel": "oriente", "Líbano": "oriente", "Turquia": "oriente", "Armênia": "oriente",
    "China": "asia", "Japão": "asia", "Índia": "asia",
}

DEMONIMOS = {
    "Brasil": ["brasileiro", "brasileira", "nacional"],
    "Chile": ["chileno", "chilena"],
    "Argentina": ["argentino", "argentina"],
    "Portugal": ["portugues", "portuguesa"],
    "França": ["frances", "francesa"],
    "Itália": ["italiano", "italiana"],
    "Espanha": ["espanhol", "espanhola"],
    "EUA": ["americano", "americana", "norte americano"],
    "Austrália": ["australiano", "australiana"],
    "Uruguai": ["uruguaio", "uruguaia"],
    "Alemanha": ["alemao", "alema"],
    "África do Sul": ["sul africano", "sul africana"],
    "Nova Zelândia": ["neozelandes", "neozelandesa"],
    "Grécia": ["grego", "grega"],
    "Hungria": ["hungaro", "hungara"],
}

# regioes/denominacoes classicas que entregam o pais quando aparecem no nome
# (termos normalizados; complementa a tabela regiao->pais derivada do CSV)
REGIOES_CLASSICAS_PAIS = {
    "França": ["bordeaux", "bourgogne", "borgonha", "champagne", "chablis",
               "sancerre", "pouilly fume", "beaujolais", "medoc", "pauillac",
               "margaux", "saint emilion", "pomerol", "sauternes",
               "gevrey chambertin", "chambertin", "meursault", "pommard",
               "vosne romanee", "nuits saint georges", "chateauneuf du pape",
               "cotes du rhone", "rhone", "hermitage", "cote rotie", "gigondas",
               "languedoc", "roussillon", "provence", "alsace", "loire",
               "vouvray", "chinon", "muscadet", "cahors", "jura", "savoie"],
    "Itália": ["asti", "chianti", "barolo", "barbaresco", "valpolicella",
               "soave", "montalcino", "montepulciano", "bolgheri", "toscana",
               "piemonte", "veneto", "sicilia", "etna", "marsala", "langhe",
               "gavi", "valdobbiadene", "prosecco", "amarone", "salento",
               "puglia", "abruzzo", "trentino", "friuli", "alto adige",
               "umbria", "lambrusco"],
    "Espanha": ["rioja", "ribera del duero", "rueda", "toro", "bierzo",
                "priorat", "penedes", "rias baixas", "jumilla", "navarra",
                "jerez", "cava", "la mancha", "valdepenas", "campo de borja",
                "somontano", "montsant", "carinena", "utiel requena"],
    "Portugal": ["douro", "alentejo", "dao", "vinho verde", "bairrada",
                 "setubal", "madeira", "porto", "lisboa", "tejo", "algarve",
                 "tras os montes", "beira interior"],
    "Alemanha": ["mosel", "rheingau", "pfalz", "rheinhessen", "nahe", "baden",
                 "franken"],
    "Argentina": ["mendoza", "uco", "lujan de cuyo", "salta", "cafayate",
                  "tupungato", "gualtallary"],
    "Chile": ["maipo", "colchagua", "casablanca", "maule", "aconcagua",
              "curico", "rapel", "leyda", "limari", "itata", "bio bio",
              "elqui", "cachapoal"],
    "Brasil": ["serra gaucha", "vale dos vinhedos", "campanha gaucha",
               "campanha", "bento goncalves", "pinto bandeira",
               "vale do sao francisco"],
    "EUA": ["napa", "sonoma", "california", "paso robles", "willamette",
            "columbia valley", "oregon", "finger lakes"],
    "Austrália": ["barossa", "mclaren vale", "coonawarra", "margaret river",
                  "yarra", "hunter valley", "adelaide", "clare valley",
                  "eden valley"],
    "Nova Zelândia": ["marlborough", "central otago", "otago", "hawkes bay",
                      "martinborough"],
    "África do Sul": ["stellenbosch", "swartland", "paarl", "franschhoek",
                      "western cape", "walker bay", "constantia"],
    "Áustria": ["wachau", "kamptal", "kremstal", "burgenland"],
    "Hungria": ["tokaj", "tokaji", "eger", "villany"],
    "Grécia": ["santorini", "nemea", "naoussa"],
    "Uruguai": ["canelones", "maldonado"],
}

# regioes aninhadas ou equivalentes: nunca usar uma como distrator da outra
REGIOES_CONFLITO = [
    {"valle central", "vale central", "valle de colchagua", "valle del maipo",
     "maipo", "colchagua", "valle de curico", "valle del maule", "maule",
     "cachapoal", "valle de cachapoal", "valle de rapel"},
    {"serra gaucha", "vale dos vinhedos", "bento goncalves", "pinto bandeira",
     "monte belo do sul", "garibaldi", "farroupilha"},
    {"bordeaux", "pauillac", "margaux", "saint emilion", "pomerol", "medoc",
     "haut medoc", "saint estephe", "saint julien", "pessac leognan", "graves",
     "sauternes", "entre deux mers"},
    {"bourgogne", "borgonha", "chablis", "cote de nuits", "cote de beaune",
     "gevrey chambertin", "meursault", "pommard", "puligny montrachet",
     "nuits saint georges", "beaujolais", "macon", "maconnais", "mercurey"},
    {"toscana", "chianti", "chianti classico", "montalcino", "montepulciano",
     "bolgheri", "maremma"},
    {"piemonte", "barolo", "barbaresco", "langhe", "asti", "alba", "roero", "gavi"},
    {"rioja", "rioja alta", "rioja alavesa"},
    {"castilla y leon", "ribera del duero", "rueda", "toro", "bierzo"},
    {"douro", "cima corgo", "baixo corgo", "douro superior", "porto"},
    {"rhone", "cotes du rhone", "chateauneuf du pape", "crozes hermitage",
     "hermitage", "cote rotie", "gigondas", "vacqueyras"},
    {"loire", "sancerre", "pouilly fume", "vouvray", "chinon", "muscadet", "anjou"},
    {"mendoza", "lujan de cuyo", "valle de uco", "uco valley", "maipu", "altamira",
     "tupungato", "gualtallary", "vista flores", "san pablo"},
    {"california", "napa valley", "napa", "sonoma", "paso robles", "central coast"},
    {"sicilia", "etna", "marsala"},
    {"veneto", "valpolicella", "soave", "prosecco", "valdobbiadene", "amarone"},
    {"alentejo", "alentejano", "vidigueira", "reguengos", "borba"},
    {"campanha", "campanha gaucha", "fronteira"},
]

# vocabulario proibido da marca + cara de IA (validacao de copy)
COPY_PROIBIDA = [
    "usuário", "usuario", "consumidor", "premium", "expert",
    "última chance", "ultima chance", "erro de iniciante",
    "para verdadeiros conhecedores", "gerado por ia", "assistente",
]


def _fem(cor):
    """Concordancia feminina de cor de uva: tinto->tinta, branco->branca."""
    return {"tinto": "tinta", "branco": "branca"}.get(cor, cor)

LEAK_DOCURA = ["seco", "suave", "doce", "demi", "brut", "nature", "moscatel",
               "moscato", "late harvest", "colheita tardia", "licoroso", "dolce",
               "sweet", "moelleux", "auslese", "spatlese", "icewine", "sauternes",
               "tokaji", "porto", "port", "ruby", "tawny", "jerez", "sherry",
               "lambrusco", "doux", "dulce", "asti",
               # estilos que denunciam docura no nome (auditorias f2)
               "rich", "malmsey", "bual", "boal", "lagrima",
               "eiswein", "ice wine", "beerenauslese", "trockenbeerenauslese",
               "passito", "recioto", "vin santo", "vinsanto", "maury", "banyuls",
               # nome de fruta no rotulo grita doce/aromatizado
               "morango", "pessego", "maracuja", "abacaxi", "framboesa",
               "amora", "cereja", "lichia", "tangerina", "frutas"]
LEAK_CORPO = ["encorpado", "leve", "light", "intenso", "gran reserva", "concentrado"]
LEAK_TANINO = ["tanico", "macio", "suave", "intenso", "gran reserva"]

# ------------------------------------------------- harmonizacao deterministica
# parser de harmonizacao_texto: palavra-chave do banco -> (slug, prato de gente)

HARMONIZA_CATEGORIAS = {
    "churrasco": (["churrasco", "costela", "picanha", "bbq", "barbecue"], "Churrasco"),
    "carne_vermelha": (["carnes vermelhas", "carne vermelha", "cordeiro", "bife",
                        "ossobuco", "file mignon", "carne assada", "carnes grelhadas",
                        "carne de panela"], "Carne vermelha grelhada"),
    "massa_molho_vermelho": (["molho de tomate", "ao sugo", "bolonhesa", "ragu",
                              "molhos a base de carne", "lasanha", "molho vermelho"],
                             "Massa ao sugo"),
    "queijo_curado": (["queijos curados", "queijo curado", "queijos duros", "parmesao",
                       "pecorino", "grana padano", "queijos maturados", "queijo reino"],
                      "Queijo curado tipo parmesão"),
    "pizza": (["pizza"], "Pizza de mussarela"),
    "frutos_do_mar": (["frutos do mar", "camarao", "lula", "polvo", "mariscos",
                       "vieiras", "lagosta"], "Frutos do mar"),
    "peixe_leve": (["peixes grelhados", "peixe grelhado", "peixes brancos",
                    "peixe branco", "linguado", "robalo", "tilapia",
                    "peixes leves"], "Peixe branco grelhado"),
    "salada": (["saladas", "salada"], "Salada de folhas frescas"),
    "ostras": (["ostras"], "Ostras frescas"),
    "ceviche": (["ceviche"], "Ceviche"),
    "sushi": (["sushi", "sashimi", "comida japonesa"], "Sushi"),
    "aves": (["frango", "aves", "peru", "galeto"], "Frango assado"),
    "aperitivo": (["aperitivos", "aperitivo", "petiscos", "entradas leves",
                   "canapes"], "Petiscos de entrada"),
    "sobremesa": (["sobremesas", "sobremesa", "chocolate", "doces"],
                  "Sobremesa de chocolate"),
    "feijoada": (["feijoada"], "Feijoada"),
    "queijo_azul": (["queijos azuis", "gorgonzola", "roquefort"], "Queijo gorgonzola"),
}

# pools de distrator por arquétipo (categorias DISJUNTAS do perfil)
POOL_MAR_LEVE = ["ostras", "ceviche", "sushi", "salada", "peixe_leve"]
POOL_CARNE_PESADA = ["churrasco", "carne_vermelha", "massa_molho_vermelho"]

# ------------------------------------------------------------------ helpers


def norm(s):
    """minusculas, sem acento, so alfanumerico e espaco."""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower())
    return re.sub(r"\s+", " ", s).strip()


def contem_termo(texto_norm, termo_norm):
    """containment com fronteira de palavra."""
    if not termo_norm:
        return False
    return re.search(r"(?<![a-z0-9])" + re.escape(termo_norm) + r"(?![a-z0-9])",
                     texto_norm) is not None


def tokens_significativos(uva_canon):
    """tokens da uva (e sinonimos) com 4+ letras, para checagem de vazamento.
    4 e nao 5: uvas curtas como Baga vazavam no enunciado (auditoria f2)."""
    toks = set()
    grupos = [uva_canon] + [k for k, v in SINONIMOS_UVA.items() if v == uva_canon]
    for g in grupos:
        for t in g.split():
            if len(t) >= 4:
                toks.add(t)
    # casos especiais: cabernet sozinho vaza cabernet sauvignon/franc
    if "cabernet" in uva_canon:
        toks.add("cabernet")
    return toks


_STOP_INICIO = {"vinho", "fino", "tinto", "branco", "rose", "espumante", "seco",
                "suave", "meio", "demi", "sec", "nacional", "chileno", "argentino",
                "portugues", "frances", "italiano", "espanhol", "uruguaio",
                "brasileiro", "americano", "australiano", "alemao", "de", "mesa",
                "do", "da"}
_STOP_QUALQUER = {"tinto", "branco", "seco", "suave", "750ml", "garrafa", "unidade",
                  "vinho", "fino", "meio"}


def nome_exibicao(nome):
    """limpa lixo de e-commerce do nome para exibicao (leak check usa o original)."""
    s = str(nome)
    s = re.sub(r"\b\d{3,4}\s?ml\b\.?", " ", s, flags=re.I)
    s = re.sub(r"\b\d(?:[.,]\d)?\s?l(itros?)?\b", " ", s, flags=re.I)
    s = re.sub(r"\bbag in box\b", " ", s, flags=re.I)
    s = re.sub(r"\bmeia\s+(gfa|garrafa)\b\.?", " ", s, flags=re.I)
    # parenteses que ficaram vazios apos remover volume, ex. "(375ml)" -> "( )"
    s = re.sub(r"\(\s*\)", " ", s)
    s = re.sub(r"[|]", " ", s)
    s = re.sub(r"\s*-\s*(chile|argentina|brasil|portugal|franca|frança|italia|itália|espanha|uruguai)\s*$", " ", s, flags=re.I)
    toks = s.split()
    # remove descritores do inicio
    while toks and norm(toks[0]) in _STOP_INICIO and len(toks) > 2:
        toks.pop(0)
    # remove descritores soltos em qualquer posicao
    toks = [t for t in toks if norm(t) not in _STOP_QUALQUER] or toks
    s = " ".join(toks)
    s = re.sub(r"\s+", " ", s).strip(" -.,;")
    # ALLCAPS -> Title
    letras = [c for c in s if c.isalpha()]
    if letras and sum(c.isupper() for c in letras) / len(letras) > 0.7:
        s = s.title()
    return s.strip()


def regiao_exibicao(regiao):
    """regiao do banco pronta para a UI (SOAVE -> Soave)."""
    s = (regiao or "").strip()
    letras = [c for c in s if c.isalpha()]
    if letras and sum(c.isupper() for c in letras) / len(letras) > 0.7:
        s = s.title()
    return s


def prep_pais(pais):
    if pais in PAIS_PREP_ESPECIAL:
        return PAIS_PREP_ESPECIAL[pais]
    if pais in PAIS_MASC:
        return "do " + pais
    return "da " + pais


def dist5d(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def sid(vinho_id):
    """sufixo curto e estavel para ids de exercicio (ids de vinho nao sao todos UUID)."""
    return hashlib.md5(vinho_id.encode("utf-8")).hexdigest()[:10]


def stable_idx(key, n):
    """indice deterministico a partir de uma chave (para variar copy sem RNG global)."""
    h = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n


EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF←-⇿⬀-⯿️]"
)


def copy_problemas(texto):
    """retorna lista de violacoes de copy (travessao, emoji, vocabulario proibido)."""
    probs = []
    if "—" in texto or "–" in texto:
        probs.append("travessao")
    if EMOJI_RE.search(texto):
        probs.append("emoji")
    tn = norm(texto)
    for p in COPY_PROIBIDA:
        if contem_termo(tn, norm(p)):
            probs.append("vocabulario_proibido:" + p)
    return probs


# --------------------------------------------------------------- carregamento


def carregar_banco():
    vinhos = []
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("view_estrita") != "True":
                continue
            if row.get("preco_valido") == "False":
                continue
            nn = norm(row.get("nome"))
            if JUNK_NOME_RE.search(nn):
                continue
            d5 = {}
            ok5 = True
            for dim in DIM_5D:
                try:
                    d5[dim] = float(row[dim])
                except (TypeError, ValueError):
                    ok5 = False
            v = {
                "id": row["id"],
                "nome": row["nome"].strip(),
                "nome_norm": nn,
                "produtor": (row.get("produtor") or "").strip(),
                "tipo": (row.get("tipo") or "").strip(),
                "uva_raw": (row.get("uva_principal") or "").strip(),
                "uvas_sec": [norm(u) for u in re.split(r"[,;/]", row.get("uvas_secundarias") or "") if u.strip()],
                "pais": (row.get("pais") or "").strip(),
                "regiao": regiao_exibicao(row.get("regiao")),
                "preco": None,
                "harm_texto": (row.get("harmonizacao_texto") or "").strip(),
                "d5": d5 if ok5 else None,
                "mercado_br": row.get("origem_cadastro") != "scrape_vivino",
                "pop": 0.0,
            }
            try:
                v["preco"] = float(row.get("preco_referencia") or "")
            except ValueError:
                pass
            try:
                v["pop"] = float(row.get("vivino_num_ratings") or 0)
            except ValueError:
                pass
            vinhos.append(v)
    vinhos.sort(key=lambda v: v["id"])
    # imagens em disco
    imgs = {}
    if os.path.isdir(IMG_DIR):
        for fn in os.listdir(IMG_DIR):
            stem = fn.rsplit(".", 1)[0]
            imgs[stem] = fn
    for v in vinhos:
        v["img"] = imgs.get(v["id"])
    return vinhos


def canonizar_uvas(vinhos):
    """resolve sinonimos/casing e calcula stats por uva canonica."""
    for v in vinhos:
        u = norm(v["uva_raw"])
        u = SINONIMOS_UVA.get(u, u)
        if u.startswith("blend") or u in ("_blend", "", "nan"):
            u = "_blend" if u else ""
        v["uva"] = u
        v["uvas_sec"] = [SINONIMOS_UVA.get(s, s) for s in v["uvas_sec"]]

    stats = {}
    casing = defaultdict(Counter)
    for v in vinhos:
        u = v["uva"]
        if not u or u == "_blend":
            continue
        st = stats.setdefault(u, {"n": 0, "tinto": 0, "branco": 0,
                                  "soma5d": [0.0] * 5, "n5d": 0,
                                  "paises": Counter()})
        st["n"] += 1
        if v["tipo"] == "tinto":
            st["tinto"] += 1
        elif v["tipo"] == "branco":
            st["branco"] += 1
        if v["d5"]:
            st["n5d"] += 1
            for i, dim in enumerate(DIM_5D):
                st["soma5d"][i] += v["d5"][dim]
        if v["pais"] and v["pais"] != "Outros":
            st["paises"][v["pais"]] += 1
        casing[u][v["uva_raw"]] += 1

    DISPLAY_FIX = {"carmenere": "Carménère", "torrontes": "Torrontés",
                   "semillon": "Sémillon", "albarino": "Alvarinho",
                   "castelao": "Castelão", "gruner veltliner": "Grüner Veltliner",
                   "mourvedre": "Mourvèdre", "grenache": "Grenache",
                   "petit verdot": "Petit Verdot", "viognier": "Viognier"}
    for u, st in stats.items():
        cores = st["tinto"] + st["branco"]
        st["cor"] = None
        if cores >= 3:
            if st["tinto"] / cores >= 0.9:
                st["cor"] = "tinto"
            elif st["branco"] / cores >= 0.9:
                st["cor"] = "branco"
        st["perfil"] = ([s / st["n5d"] for s in st["soma5d"]] if st["n5d"] else None)
        # display: casing mais frequente com inicial maiuscula
        cands = [(c, n) for c, n in casing[u].items() if c[:1].isupper()] or list(casing[u].items())
        disp = max(cands, key=lambda x: (x[1], x[0]))[0]
        if disp.isupper() or disp.islower():
            disp = disp.title()
        st["display"] = DISPLAY_FIX.get(u, disp)
        st["tokens_leak"] = tokens_significativos(u)
    return stats


# ----------------------------------------------------------------- validacao


class Validador:
    def __init__(self):
        self.descartes = Counter()
        self.dedup_resposta = set()
        self.dedup_enunciado = set()
        self.uso_template_vinho = set()

    def aceitar(self, ex, vinho_ids):
        t = ex["template"]
        # max 1 exercicio por vinho por template
        for vid in vinho_ids:
            if (t, vid) in self.uso_template_vinho:
                self.descartes[t + "/vinho_repetido_no_template"] += 1
                return False
        # schema
        err = self._schema(ex)
        if err:
            self.descartes[t + "/schema:" + err] += 1
            return False
        # copy
        for campo in ("pergunta", "okMsg", "erroMsg", "porque", "regra"):
            txt = ex.get(campo)
            if txt:
                probs = copy_problemas(txt)
                if probs:
                    self.descartes[t + "/copy:" + probs[0]] += 1
                    return False
        for op in ex.get("opcoes", []):
            if copy_problemas(op):
                self.descartes[t + "/copy_opcao"] += 1
                return False
        # resposta unica entre opcoes
        ops_norm = [norm(o) for o in ex["opcoes"]]
        if len(set(ops_norm)) != len(ops_norm):
            self.descartes[t + "/opcao_duplicada"] += 1
            return False
        # dedup por (template, vinho, resposta); sem vinho, a chave e o proprio id
        resposta = ex["opcoes"][ex.get("correta", ex.get("intruso"))]
        k1 = (t, "|".join(sorted(vinho_ids)) or ex["id"], norm(resposta))
        # em templates com imagem, a imagem diferencia o enunciado
        k2 = (t, norm(ex.get("pergunta", "")), "|".join(sorted(ops_norm)),
              ex.get("imagem", ""))
        if k1 in self.dedup_resposta or k2 in self.dedup_enunciado:
            self.descartes[t + "/dedup"] += 1
            return False
        self.dedup_resposta.add(k1)
        self.dedup_enunciado.add(k2)
        for vid in vinho_ids:
            self.uso_template_vinho.add((t, vid))
        return True

    def _schema(self, ex):
        if ex.get("dificuldade") not in (1, 2, 3):
            return "dificuldade"
        if ex.get("tipo") == "mc":
            for c in ("pergunta", "opcoes", "correta", "okMsg", "erroMsg", "porque"):
                if c not in ex:
                    return "campo_" + c
            if not (isinstance(ex["opcoes"], list) and 2 <= len(ex["opcoes"]) <= 5):
                return "n_opcoes"
            if not (isinstance(ex["correta"], int) and 0 <= ex["correta"] < len(ex["opcoes"])):
                return "correta_fora"
        elif ex.get("tipo") == "intruso":
            for c in ("pergunta", "opcoes", "intruso", "regra"):
                if c not in ex:
                    return "campo_" + c
            if len(ex["opcoes"]) != 4:
                return "n_opcoes"
            if not (isinstance(ex["intruso"], int) and 0 <= ex["intruso"] < 4):
                return "intruso_fora"
        else:
            return "tipo_desconhecido"
        if any(not isinstance(o, str) or not o.strip() for o in ex["opcoes"]):
            return "opcao_vazia"
        return None


# --------------------------------------------------------------- geradores

OK_PREFIX = ["Isso.", "Exato.", "Bonito.", "Na mosca.", "É isso mesmo."]
ERRO_PREFIX = ["Quase.", "Tudo bem.", "Sem drama.", "Acontece."]
ERRO_FECHO = ["Fica para a próxima taça.", "Agora você já sabe.",
              "Anota essa para a próxima compra.", "Esse detalhe vem com o treino."]


def _ok(key, fato):
    return OK_PREFIX[stable_idx(key + "ok", len(OK_PREFIX))] + " " + fato


def _erro(key, fato):
    p = ERRO_PREFIX[stable_idx(key + "er", len(ERRO_PREFIX))]
    f = ERRO_FECHO[stable_idx(key + "ef", len(ERRO_FECHO))]
    return p + " " + fato + " " + f


class Fabrica:
    def __init__(self, vinhos, uvas):
        self.vinhos = vinhos
        self.uvas = uvas
        self.rng = random.Random(SEED)
        self.val = Validador()
        self.exercicios = []
        # rankings
        self.rank_uvas = [u for u, st in sorted(uvas.items(), key=lambda kv: (-kv[1]["n"], kv[0]))]
        self.top8_uvas = set(self.rank_uvas[:8])
        self.uvas_medias = set(self.rank_uvas[8:30])
        paises = Counter(v["pais"] for v in vinhos if v["pais"] and v["pais"] != "Outros")
        self.rank_paises = [p for p, _ in sorted(paises.items(), key=lambda kv: (-kv[1], kv[0]))]
        self.top8_paises = set(self.rank_paises[:8])
        self.n_paises = paises
        # regioes por pais
        self.regioes_pais = defaultdict(Counter)
        for v in vinhos:
            if v["regiao"] and v["pais"] and v["pais"] != "Outros":
                self.regioes_pais[v["pais"]][v["regiao"].strip()] += 1
        # leak regiao-no-nome: tabela regiao->pais do proprio CSV (qualquer
        # contagem) + denominacoes classicas; um regex compilado por pais
        termos_pais = defaultdict(set)
        for pais, cnt in self.regioes_pais.items():
            for r in cnt:
                rn = norm(r)
                if len(rn) >= 4:
                    termos_pais[pais].add(rn)
        for pais, termos in REGIOES_CLASSICAS_PAIS.items():
            termos_pais[pais].update(termos)
        self.re_regiao_pais = {
            pais: re.compile(
                r"(?<![a-z0-9])(?:"
                + "|".join(sorted((re.escape(t) for t in termos), key=len, reverse=True))
                + r")(?![a-z0-9])")
            for pais, termos in termos_pais.items()
        }

    # ---------- util

    def _add(self, ex, vinho_ids):
        if self.val.aceitar(ex, vinho_ids):
            self.exercicios.append(ex)
            return True
        return False

    def _nome_ok(self, v):
        n = nome_exibicao(v["nome"])
        if not (3 <= len(n) <= 52):
            return None
        # nome de produto com vocabulario proibido na UI (Premium etc.) nao vira copy
        if copy_problemas(n):
            return None
        return n

    def _vaza_uva(self, v, uva_canon):
        toks = self.uvas[uva_canon]["tokens_leak"] if uva_canon in self.uvas else {uva_canon}
        return any(contem_termo(v["nome_norm"], t) for t in toks)

    def _vaza_pais(self, v):
        alvo = [v["pais"]] + DEMONIMOS.get(v["pais"], [])
        return any(contem_termo(v["nome_norm"], norm(a)) for a in alvo if a)

    _REGIAO_STOP = {"valle", "vale", "valley", "de", "del", "do", "da", "dos",
                    "das", "la", "las", "los", "el", "y", "e", "region", "regiao",
                    "wine", "country"}

    def _regiao_conflita(self, r1, r2):
        a, b = norm(r1), norm(r2)
        if a == b or a in b or b in a:
            return True
        if any(a in grupo and b in grupo for grupo in REGIOES_CONFLITO):
            return True
        # nucleos de nome iguais em idiomas diferentes (Central Valley vs Vale Central)
        ta = set(a.split()) - self._REGIAO_STOP
        tb = set(b.split()) - self._REGIAO_STOP
        return bool(ta and tb and ta & tb)

    def _dif_uva(self, uva):
        if uva in self.top8_uvas:
            return 1
        if uva in self.uvas_medias:
            return 2
        return 3

    def _habilidade_uva(self, uva):
        """dimensao sensorial assinatura da uva-resposta, derivada do perfil 5D
        medio da uva no banco (maior media vence; empate -> frutado)."""
        st = self.uvas.get(uva)
        if not st or not st.get("perfil"):
            return "frutado"
        mx = max(st["perfil"])
        dims = [DIM_5D[i] for i, m in enumerate(st["perfil"]) if mx - m < 1e-9]
        return dims[0] if len(dims) == 1 else "frutado"

    # ---------- a) qual-uva

    def gerar_qual_uva(self):
        t = "qual-uva"
        for v in self.vinhos:
            u = v["uva"]
            if not u or u == "_blend" or u not in self.uvas:
                self.val.descartes[t + "/uva_invalida_ou_blend"] += 1
                continue
            st = self.uvas[u]
            if st["cor"] is None or st["n"] < 5 or not st["perfil"]:
                self.val.descartes[t + "/uva_sem_cor_ou_rara_demais"] += 1
                continue
            if self._vaza_uva(v, u):
                self.val.descartes[t + "/nome_contem_uva"] += 1
                continue
            nome = self._nome_ok(v)
            if not nome:
                self.val.descartes[t + "/nome_sujo"] += 1
                continue
            if not v["pais"] or v["pais"] == "Outros":
                self.val.descartes[t + "/pais_invalido"] += 1
                continue
            dif = self._dif_uva(u)
            dist = self._distratores_uva(v, u, dif)
            if not dist:
                self.val.descartes[t + "/sem_distrator"] += 1
                continue
            origem = ("da região de " + v["regiao"]
                      if v["regiao"] and not contem_termo(v["nome_norm"], norm(v["regiao"]))
                      else prep_pais(v["pais"]))
            if not origem:
                self.val.descartes[t + "/pais_invalido"] += 1
                continue
            opcoes = [st["display"]] + dist
            ordem = list(range(len(opcoes)))
            self.rng.shuffle(ordem)
            opcoes = [opcoes[i] for i in ordem]
            correta = opcoes.index(st["display"])
            key = t + v["id"]
            fato = "O {} é feito principalmente de {}.".format(nome, st["display"])
            ex = {
                "id": "{}-{}".format(t, sid(v["id"])),
                "template": t, "vinhoId": v["id"],
                "habilidade": self._habilidade_uva(u),
                "tipo": "mc", "dificuldade": dif,
                "pergunta": "O {}, {}, é feito principalmente de qual uva?".format(nome, origem),
                "opcoes": opcoes, "correta": correta,
                "okMsg": _ok(key, "{} é a uva que dá a cara deste rótulo.".format(st["display"])),
                "erroMsg": _erro(key, fato),
                "porque": "A ficha do {} traz {} como uva principal.".format(nome, st["display"]),
            }
            self._add(ex, [v["id"]])

    def _distratores_uva(self, v, uva, dif, n=3):
        st = self.uvas[uva]
        cands = []
        for u2, st2 in self.uvas.items():
            if u2 == uva or st2["cor"] != st["cor"] or not st2["perfil"]:
                continue
            if st2["n"] < (15 if dif == 1 else 8):
                continue
            if u2 in v["uvas_sec"]:
                continue
            if norm(st2["display"]) == norm(st["display"]):
                continue
            cands.append((dist5d(st["perfil"], st2["perfil"]), st2["n"], u2))
        if len(cands) < n:
            return None
        if dif == 1:
            # distratores distantes no perfil 5D, priorizando uvas conhecidas
            cands.sort(key=lambda x: (-x[0] * 2 - (x[2] in self.top8_uvas) * 1.5, x[2]))
        else:
            # distratores proximos no perfil 5D
            cands.sort(key=lambda x: (x[0], -x[1], x[2]))
        return [self.uvas[c[2]]["display"] for c in cands[:n]]

    # ---------- b) de-onde-vem (pais e regiao)

    def gerar_de_onde_vem(self):
        t = "de-onde-vem"
        for v in self.vinhos:
            nome = self._nome_ok(v)
            if not nome:
                self.val.descartes[t + "/nome_sujo"] += 1
                continue
            if not v["pais"] or v["pais"] == "Outros":
                self.val.descartes[t + "/pais_invalido"] += 1
                continue
            # variante regiao (dificuldade 3): regiao preenchida e nome sem a regiao
            feito = False
            if v["regiao"] and not contem_termo(v["nome_norm"], norm(v["regiao"])):
                feito = self._regiao_q(v, nome)
            if not feito:
                self._pais_q(v, nome)

    def _pais_q(self, v, nome):
        t = "de-onde-vem"
        if self._vaza_pais(v):
            self.val.descartes[t + "/nome_contem_pais"] += 1
            return False
        # nome com qualquer regiao do pais-resposta (tabela do CSV + classicas)
        # entrega a resposta (ex. "Gevrey Chambertin" -> França, "d'Asti" -> Itália)
        re_leak = self.re_regiao_pais.get(v["pais"])
        if re_leak and re_leak.search(v["nome_norm"]):
            self.val.descartes[t + "/nome_contem_regiao_que_entrega"] += 1
            return False
        u = v["uva"]
        produtores = []
        if u and u in self.uvas:
            produtores = [p for p, n in self.uvas[u]["paises"].items()
                          if n >= 3 and p != v["pais"]]
        if len(produtores) < 3:
            self.val.descartes[t + "/poucos_paises_distratores"] += 1
            return False
        dif = 1 if v["pais"] in self.top8_paises else 2
        cont = CONTINENTE.get(v["pais"], "outro")
        if dif == 1:
            # distratores distantes: outros continentes primeiro
            produtores.sort(key=lambda p: (CONTINENTE.get(p, "outro") == cont,
                                           -self.n_paises.get(p, 0), p))
        else:
            # distratores proximos: mesmo continente primeiro
            produtores.sort(key=lambda p: (CONTINENTE.get(p, "outro") != cont,
                                           -self.n_paises.get(p, 0), p))
        dist = produtores[:3]
        opcoes = [v["pais"]] + dist
        ordem = list(range(4))
        self.rng.shuffle(ordem)
        opcoes = [opcoes[i] for i in ordem]
        key = t + v["id"]
        uva_disp = self.uvas[u]["display"] if u in self.uvas else None
        extra = (" Os outros três países também aparecem no nosso banco com vinhos de {}.".format(uva_disp)
                 if uva_disp else "")
        ex = {
            "id": "{}-{}".format(t, sid(v["id"])),
            "template": t, "variante": "pais", "vinhoId": v["id"], "habilidade": "rotulo",
            "tipo": "mc", "dificuldade": dif,
            "pergunta": "De qual país vem o {}?".format(nome),
            "opcoes": opcoes, "correta": opcoes.index(v["pais"]),
            "okMsg": _ok(key, "Este rótulo nasce mesmo {}.".format(prep_pais(v["pais"]))),
            "erroMsg": _erro(key, "O {} vem {}.".format(nome, prep_pais(v["pais"]))),
            "porque": "A ficha do {} marca {} como país de origem.{}".format(nome, v["pais"], extra),
        }
        return self._add(ex, [v["id"]])

    def _regiao_q(self, v, nome):
        t = "de-onde-vem"
        regiao = v["regiao"].strip()
        outras = [r for r, n in self.regioes_pais[v["pais"]].items()
                  if n >= 5 and not self._regiao_conflita(r, regiao)]
        outras.sort(key=lambda r: (-self.regioes_pais[v["pais"]][r], r))
        # distratores tambem nao podem conflitar entre si (Valle de Uco vs Uco Valley)
        dist = []
        for r in outras:
            if all(not self._regiao_conflita(r, d) for d in dist):
                dist.append(r)
            if len(dist) == 3:
                break
        if len(dist) < 3:
            self.val.descartes[t + "/poucas_regioes_distratoras"] += 1
            return False
        opcoes = [regiao] + dist
        ordem = list(range(4))
        self.rng.shuffle(ordem)
        opcoes = [opcoes[i] for i in ordem]
        key = t + v["id"] + "r"
        ex = {
            "id": "{}-r-{}".format(t, sid(v["id"])),
            "template": t, "variante": "regiao", "vinhoId": v["id"], "habilidade": "rotulo",
            "tipo": "mc", "dificuldade": 3,
            "pergunta": "O {} vem {}. De qual região?".format(nome, prep_pais(v["pais"])),
            "opcoes": opcoes, "correta": opcoes.index(regiao),
            "okMsg": _ok(key, "{} é a casa deste rótulo.".format(regiao)),
            "erroMsg": _erro(key, "O {} vem de {}.".format(nome, regiao)),
            "porque": "A ficha do {} marca {} como região de origem, dentro do mapa {}.".format(
                nome, regiao, prep_pais(v["pais"])),
        }
        return self._add(ex, [v["id"]])

    # ---------- c) mais-encorpado (variantes corpo / tanino / docura)

    VARIANTES_5D = {
        "corpo": {
            "pergunta": "Qual destes costuma ser mais encorpado?",
            "leak": LEAK_CORPO, "dim": "corpo",
            "porque": "Na nossa ficha, {a} pontua {va} de 5 em corpo e {b} fica em {vb}.",
            "ok": "O mais encorpado tende a ser esse mesmo.",
            "erro": "O {a} costuma encher mais a boca: corpo {va} de 5 contra {vb}.",
            "habilidade": "corpo",
        },
        "tanino": {
            "pergunta": "Qual destes costuma ter o tanino mais firme, aquele que seca a boca?",
            "leak": LEAK_TANINO, "dim": "tanino",
            "porque": "Na nossa ficha, {a} marca {va} de 5 em tanino e {b} marca {vb}.",
            "ok": "Esse tende a segurar mais a sua saliva.",
            "erro": "O {a} costuma secar mais: tanino {va} de 5 contra {vb}.",
            "habilidade": "tanino",
        },
        "docura": {
            "pergunta": "Qual destes costuma ser mais doce?",
            "leak": LEAK_DOCURA, "dim": "docura",
            "porque": "Na nossa ficha, {a} marca {va} de 5 em doçura e {b} fica em {vb}.",
            "ok": "Esse tende a vir com mais açúcar na taça.",
            "erro": "O {a} costuma ser o mais doce da dupla: {va} de 5 contra {vb}.",
            "habilidade": "docura",
        },
    }

    def gerar_mais_encorpado(self):
        t = "mais-encorpado"
        usados = set()  # compartilhado entre variantes: max 1 exercicio por vinho no template
        # docura primeiro (vinhos doces sem vazamento no nome sao raros), depois tanino e corpo
        for variante in ("docura", "tanino", "corpo"):
            cfg = self.VARIANTES_5D[variante]
            dim = cfg["dim"]
            leaks = [norm(x) for x in cfg["leak"]]
            pool = []
            for v in self.vinhos:
                if not v["d5"] or v["id"] in usados:
                    continue
                nome = self._nome_ok(v)
                if not nome:
                    continue
                if any(contem_termo(v["nome_norm"], lk) for lk in leaks):
                    self.val.descartes[t + "/nome_vaza_" + variante] += 1
                    continue
                pool.append((v, nome, v["d5"][dim]))
            baixos = sorted([p for p in pool if p[2] <= 2], key=lambda x: x[0]["id"])
            altos = sorted([p for p in pool if p[2] >= 3], key=lambda x: x[0]["id"])
            self.rng.shuffle(baixos)
            self.rng.shuffle(altos)
            cursor = 0
            for (va, na, sa) in altos:
                if va["id"] in usados:
                    continue
                for j in range(cursor, len(baixos)):
                    vb, nb, sb = baixos[j]
                    if vb["id"] in usados or norm(na) == norm(nb):
                        continue
                    diff = sa - sb
                    if diff < 2:
                        continue
                    dif = 1 if diff >= 4 else (2 if diff >= 3 else 3)
                    if self._par_5d(t, variante, cfg, va, na, sa, vb, nb, sb, dif):
                        usados.add(va["id"])
                        usados.add(vb["id"])
                        if j == cursor:
                            cursor += 1
                        break

    def _par_5d(self, t, variante, cfg, va, na, sa, vb, nb, sb, dif):
        ordem = [0, 1] if stable_idx(va["id"] + vb["id"], 2) == 0 else [1, 0]
        nomes = [na, nb]
        opcoes = [nomes[i] for i in ordem]
        correta = opcoes.index(na)
        key = t + variante + va["id"]
        ex = {
            "id": "{}-{}-{}-{}".format(t, variante, sid(va["id"]), sid(vb["id"])),
            "template": t, "variante": variante,
            "vinhoId": va["id"], "vinhoIdB": vb["id"], "habilidade": cfg["habilidade"],
            "tipo": "mc", "dificuldade": dif,
            "pergunta": cfg["pergunta"],
            "opcoes": opcoes, "correta": correta,
            "okMsg": _ok(key, cfg["ok"]),
            "erroMsg": _erro(key, cfg["erro"].format(a=na, va=int(sa), vb=int(sb))),
            "porque": cfg["porque"].format(a=na, b=nb, va=int(sa), vb=int(sb)),
        }
        return self._add(ex, [va["id"], vb["id"]])

    # ---------- d) harmoniza

    def _categorias_do_texto(self, texto):
        tn = norm(texto)
        cats = {}
        for slug, (kws, prato) in HARMONIZA_CATEGORIAS.items():
            for kw in kws:
                if contem_termo(tn, norm(kw)):
                    cats[slug] = prato
                    break
        # ficha que diz "sobremesas a base de frutas" nao pode virar "de chocolate"
        # na copy (a IA nunca atribui o que a ficha nao diz; auditoria f2)
        if "sobremesa" in cats and ("frutas" in tn or "de fruta" in tn):
            cats["sobremesa"] = "Sobremesa de frutas"
        return cats

    def gerar_harmoniza(self):
        t = "harmoniza"
        for v in self.vinhos:
            if not v["harm_texto"] or not v["d5"]:
                continue
            nome = self._nome_ok(v)
            if not nome:
                self.val.descartes[t + "/nome_sujo"] += 1
                continue
            cats = self._categorias_do_texto(v["harm_texto"])
            if not cats:
                self.val.descartes[t + "/texto_sem_categoria_mapeavel"] += 1
                continue
            d5 = v["d5"]
            arq = None
            if v["tipo"] == "tinto" and d5["tanino"] >= 3 and d5["corpo"] >= 3:
                certas = [s for s in ("churrasco", "carne_vermelha",
                                      "massa_molho_vermelho", "queijo_curado") if s in cats]
                pool, arq = POOL_MAR_LEVE, "tinto_firme"
                regra = ("Tinto firme de tanino pede gordura e proteína; "
                         "pratos delicados do mar somem do lado dele.")
            elif (v["tipo"] in ("branco", "espumante") and d5["corpo"] <= 3
                  and d5["docura"] <= 2 and d5["tanino"] <= 2):
                certas = [s for s in ("frutos_do_mar", "peixe_leve", "salada",
                                      "ostras", "ceviche", "sushi", "aperitivo") if s in cats]
                pool, arq = POOL_CARNE_PESADA, "branco_leve"
                regra = ("Vinho leve e fresco acompanha prato delicado; "
                         "carne pesada atropela ele na mesa.")
            elif v["tipo"] in ("fortificado", "sobremesa") and d5["docura"] >= 3:
                certas = [s for s in ("sobremesa", "queijo_azul", "queijo_curado") if s in cats]
                pool, arq = POOL_MAR_LEVE, "doce"
                regra = ("Vinho doce e potente conversa com sobremesa e queijos fortes, "
                         "nunca com pratos leves do mar.")
            else:
                self.val.descartes[t + "/perfil_fora_dos_arquetipos"] += 1
                continue
            if not certas:
                self.val.descartes[t + "/categoria_certa_ausente_no_arquetipo"] += 1
                continue
            certa = certas[stable_idx(v["id"], len(certas))]
            # distratores: categorias disjuntas, ausentes do texto do vinho
            dist = [s for s in pool if s not in cats and s != certa]
            dist_validos = []
            for s in dist:
                kws = HARMONIZA_CATEGORIAS[s][0]
                if any(contem_termo(norm(v["harm_texto"]), norm(k)) for k in kws):
                    continue  # paranoia: keyword presente no texto
                dist_validos.append(s)
            if len(dist_validos) < 3:
                self.val.descartes[t + "/poucos_distratores_disjuntos"] += 1
                continue
            dist_validos = dist_validos[:3]
            if arq == "tinto_firme":
                dif = 1 if v["uva"] in self.top8_uvas else 2
            elif arq == "branco_leve":
                dif = 2
            else:
                dif = 3
            pratos = [cats[certa]] + [HARMONIZA_CATEGORIAS[s][1] for s in dist_validos]
            ordem = list(range(4))
            self.rng.shuffle(ordem)
            opcoes = [pratos[i] for i in ordem]
            key = t + v["id"]
            ex = {
                "id": "{}-{}".format(t, sid(v["id"])),
                "template": t, "vinhoId": v["id"], "habilidade": "harmonizacao",
                "tipo": "mc", "dificuldade": dif,
                "pergunta": "Qual destes pratos costuma cair bem com o {}?".format(nome),
                "opcoes": opcoes, "correta": opcoes.index(cats[certa]),
                "okMsg": _ok(key, "{} é o par que a ficha dele sugere.".format(cats[certa])),
                "erroMsg": _erro(key, "A ficha do {} aponta {} como companhia.".format(
                    nome, cats[certa].lower())),
                "porque": regra + " A ficha deste rótulo sugere {}.".format(cats[certa].lower()),
            }
            self._add(ex, [v["id"]])

    # ---------- e) intruso-uva

    def gerar_intruso_uva(self, alvo=220):
        t = "intruso-uva"
        elegiveis = [(u, st) for u, st in self.uvas.items()
                     if st["n"] >= 10 and st["cor"] in ("tinto", "branco")]
        tintas = sorted([u for u, st in elegiveis if st["cor"] == "tinto"],
                        key=lambda u: -self.uvas[u]["n"])
        brancas = sorted([u for u, st in elegiveis if st["cor"] == "branco"],
                         key=lambda u: -self.uvas[u]["n"])
        combos_vistos = set()
        tentativas = 0
        gerados = 0
        while gerados < alvo and tentativas < alvo * 30:
            tentativas += 1
            cor_grupo = self.rng.choice(["tinto", "branco"])
            grupo_pool = tintas if cor_grupo == "tinto" else brancas
            intruso_pool = brancas if cor_grupo == "tinto" else tintas
            dif = self.rng.choice([1, 1, 2, 2, 3])
            if dif == 1:
                gp = [u for u in grupo_pool if u in self.top8_uvas]
                ip = [u for u in intruso_pool if u in self.top8_uvas]
            elif dif == 2:
                gp = [u for u in grupo_pool if self.uvas[u]["n"] >= 30]
                ip = [u for u in intruso_pool if self.uvas[u]["n"] >= 30]
            else:
                gp = [u for u in grupo_pool if 10 <= self.uvas[u]["n"] < 60]
                ip = [u for u in intruso_pool if 10 <= self.uvas[u]["n"] < 60]
            if len(gp) < 3 or not ip:
                continue
            grupo = self.rng.sample(gp, 3)
            intruso = self.rng.choice(ip)
            combo = frozenset(grupo + [intruso])
            if combo in combos_vistos:
                self.val.descartes[t + "/combo_repetido"] += 1
                continue
            combos_vistos.add(combo)
            nomes = [self.uvas[u]["display"] for u in grupo] + [self.uvas[intruso]["display"]]
            ordem = list(range(4))
            self.rng.shuffle(ordem)
            opcoes = [nomes[i] for i in ordem]
            idx_intruso = opcoes.index(self.uvas[intruso]["display"])
            cor_inv = "branco" if cor_grupo == "tinto" else "tinto"
            key = t + "".join(sorted(combo))
            grupo_disp = [self.uvas[u]["display"] for u in grupo]
            ex = {
                "id": "{}-{}".format(t, hashlib.md5(key.encode()).hexdigest()[:10]),
                "template": t, "habilidade": self._habilidade_uva(intruso),
                "tipo": "intruso", "dificuldade": dif,
                # fala da CASTA, nao do vinho: Pinot Noir e tinta mas faz
                # espumante branco, entao "da vinho tinto" e falso (auditoria)
                "pergunta": "Três destas são uvas {}s. Qual é a intrusa?".format(_fem(cor_grupo)),
                "opcoes": opcoes, "intruso": idx_intruso,
                "regra": "{} e {} são uvas {}s; {} é uva {}.".format(
                    ", ".join(grupo_disp[:2]), grupo_disp[2], _fem(cor_grupo),
                    self.uvas[intruso]["display"], _fem(cor_inv)),
            }
            if self._add(ex, []):
                gerados += 1

    # ---------- f) rotulo (mc com imagem)

    def gerar_rotulo(self):
        t = "rotulo"
        rodada = 0
        for v in self.vinhos:
            if not v["img"]:
                continue
            nome = self._nome_ok(v)
            variantes = []
            # pais: prefere rotulo cujo nome nao entrega pais/uva
            if (v["pais"] and v["pais"] != "Outros" and not self._vaza_pais(v)
                    and not (v["regiao"] and contem_termo(v["nome_norm"], norm(v["regiao"])))):
                variantes.append("pais")
            if v["uva"] and v["uva"] != "_blend" and v["uva"] in self.uvas \
                    and self.uvas[v["uva"]]["cor"] and self.uvas[v["uva"]]["n"] >= 8:
                variantes.append("uva")
            if v["tipo"] in ("tinto", "branco", "espumante", "rose"):
                variantes.append("tipo")
            if not variantes:
                self.val.descartes[t + "/sem_variante_valida"] += 1
                continue
            variante = variantes[rodada % len(variantes)]
            rodada += 1
            ok = False
            if variante == "pais":
                ok = self._rotulo_pais(v)
            elif variante == "uva":
                ok = self._rotulo_uva(v)
            else:
                ok = self._rotulo_tipo(v)
            if not ok and len(variantes) > 1:
                for alt in variantes:
                    if alt != variante:
                        if alt == "pais" and self._rotulo_pais(v):
                            break
                        if alt == "uva" and self._rotulo_uva(v):
                            break
                        if alt == "tipo" and self._rotulo_tipo(v):
                            break

    def _img_path(self, v):
        return "/rotulos/{}.webp".format(v["id"])

    def _rotulo_pais(self, v):
        t = "rotulo"
        u = v["uva"]
        produtores = []
        if u and u in self.uvas:
            produtores = [p for p, n in self.uvas[u]["paises"].items()
                          if n >= 3 and p != v["pais"]]
        if len(produtores) < 3:
            produtores = [p for p in self.rank_paises[:10] if p != v["pais"]]
        if len(produtores) < 3:
            self.val.descartes[t + "/poucos_paises"] += 1
            return False
        dif = 2 if v["pais"] in self.top8_paises else 3
        cont = CONTINENTE.get(v["pais"], "outro")
        produtores.sort(key=lambda p: ((CONTINENTE.get(p, "outro") == cont) == (dif == 2),
                                       -self.n_paises.get(p, 0), p))
        dist = produtores[:3]
        opcoes = [v["pais"]] + dist
        ordem = list(range(4))
        self.rng.shuffle(ordem)
        opcoes = [opcoes[i] for i in ordem]
        key = t + v["id"] + "p"
        ex = {
            "id": "{}-pais-{}".format(t, sid(v["id"])),
            "template": t, "variante": "pais", "vinhoId": v["id"], "habilidade": "rotulo",
            "imagem": self._img_path(v),
            "tipo": "mc", "dificuldade": dif,
            "pergunta": "Olhe o rótulo com calma. Este vinho vem de qual país?",
            "opcoes": opcoes, "correta": opcoes.index(v["pais"]),
            "okMsg": _ok(key, "O rótulo entrega a origem para quem aprende a ler."),
            "erroMsg": _erro(key, "Este rótulo vem {}.".format(prep_pais(v["pais"]))),
            "porque": "A ficha deste vinho marca {} como país de origem; o rótulo costuma trazer essa pista.".format(v["pais"]),
        }
        return self._add(ex, [v["id"]])

    def _rotulo_uva(self, v):
        t = "rotulo"
        u = v["uva"]
        st = self.uvas[u]
        dif = self._dif_uva(u)
        dist = self._distratores_uva(v, u, dif)
        if not dist:
            self.val.descartes[t + "/sem_distrator_uva"] += 1
            return False
        opcoes = [st["display"]] + dist
        ordem = list(range(len(opcoes)))
        self.rng.shuffle(ordem)
        opcoes = [opcoes[i] for i in ordem]
        key = t + v["id"] + "u"
        ex = {
            "id": "{}-uva-{}".format(t, sid(v["id"])),
            "template": t, "variante": "uva", "vinhoId": v["id"], "habilidade": "rotulo",
            "imagem": self._img_path(v),
            "tipo": "mc", "dificuldade": dif,
            "pergunta": "Este rótulo é de um vinho feito com qual uva?",
            "opcoes": opcoes, "correta": opcoes.index(st["display"]),
            "okMsg": _ok(key, "Ler a uva no rótulo é meio caminho andado na prateleira."),
            "erroMsg": _erro(key, "Este é um {}.".format(st["display"])),
            "porque": "A ficha deste vinho traz {} como uva principal; muitos rótulos estampam a uva na frente.".format(st["display"]),
        }
        return self._add(ex, [v["id"]])

    def _rotulo_tipo(self, v):
        t = "rotulo"
        nomes_tipo = {"tinto": "Tinto", "branco": "Branco",
                      "espumante": "Espumante", "rose": "Rosé"}
        correta_disp = nomes_tipo[v["tipo"]]
        opcoes = ["Tinto", "Branco", "Espumante"]
        if v["tipo"] == "rose":
            opcoes = ["Tinto", "Branco", "Rosé", "Espumante"]
        ordem = list(range(len(opcoes)))
        self.rng.shuffle(ordem)
        opcoes = [opcoes[i] for i in ordem]
        key = t + v["id"] + "t"
        ex = {
            "id": "{}-tipo-{}".format(t, sid(v["id"])),
            "template": t, "variante": "tipo", "vinhoId": v["id"], "habilidade": "rotulo",
            "imagem": self._img_path(v),
            "tipo": "mc", "dificuldade": 1,
            "pergunta": "Pelo rótulo e pela garrafa, este vinho é de qual tipo?",
            "opcoes": opcoes, "correta": opcoes.index(correta_disp),
            "okMsg": _ok(key, "A garrafa conta muita coisa antes da primeira taça."),
            "erroMsg": _erro(key, "Este é um {}.".format(correta_disp.lower())),
            "porque": "A ficha deste vinho marca o tipo {}; cor da garrafa e desenho do rótulo costumam dar a pista.".format(correta_disp.lower()),
        }
        return self._add(ex, [v["id"]])

    # ---------- desafios do dia

    def gerar_desafios(self, n=40):
        candidatos = []
        for v in self.vinhos:
            if not v["img"] or not v["mercado_br"]:
                continue
            if v["tipo"] not in ("tinto", "branco", "espumante", "rose"):
                continue
            if not v["pais"] or v["pais"] == "Outros" or not v["preco"]:
                continue
            if not v["uva"] or v["uva"] == "_blend" or v["uva"] not in self.uvas:
                continue
            if not self.uvas[v["uva"]]["cor"]:
                continue
            if not self._nome_ok(v):
                continue
            score = (bool(v["regiao"]) + bool(v["harm_texto"]) + (v["pop"] > 50)
                     + (v["uva"] in self.top8_uvas) + (v["pais"] in self.top8_paises))
            # correcao C3: o Desafio do Dia e o rotulo que a pessoa VE na
            # gondola; vinhos de R$30-150 do mercado BR vem antes dos
            # aspiracionais (imagem e metadados seguem obrigatorios acima)
            gondola = 1 if 30 <= v["preco"] <= 150 else 0
            candidatos.append((gondola, score, v))
        candidatos.sort(key=lambda x: (-x[0], -x[1], -x[2]["pop"], x[2]["id"]))
        desafios = []
        por_produtor = Counter()
        por_pais = Counter()
        for gondola, score, v in candidatos:
            if len(desafios) >= n:
                break
            if por_produtor[norm(v["produtor"])] >= 2 or por_pais[v["pais"]] >= 10:
                continue
            perguntas = self._perguntas_desafio(v)
            if not perguntas:
                continue
            por_produtor[norm(v["produtor"])] += 1
            por_pais[v["pais"]] += 1
            desafios.append({
                "id": "desafio-{:02d}".format(len(desafios) + 1),
                "vinhoId": v["id"],
                "imagem": self._img_path(v),
                "perguntas": perguntas,
            })
        return desafios

    def _perguntas_desafio(self, v):
        """4 mc sobre o mesmo rotulo: tipo (facil), pais, uva, harmonizacao ou preco."""
        u = v["uva"]
        st = self.uvas[u]
        rng = random.Random(SEED + stable_idx(v["id"], 99991))
        perguntas = []

        def embaralha(certa, dist):
            ops = [certa] + dist
            ordem = list(range(len(ops)))
            rng.shuffle(ordem)
            ops = [ops[i] for i in ordem]
            return ops, ops.index(certa)

        # validacao local de copy e unicidade
        def valida(ex, certa):
            ops_norm = [norm(o) for o in ex["opcoes"]]
            if len(set(ops_norm)) != len(ops_norm):
                return False
            for campo in ("pergunta", "okMsg", "erroMsg", "porque"):
                if copy_problemas(ex[campo]):
                    return False
            return ex["opcoes"][ex["correta"]] == certa

        # 1) tipo (abre facil)
        nomes_tipo = {"tinto": "Tinto", "branco": "Branco", "espumante": "Espumante", "rose": "Rosé"}
        ops_tipo = ["Tinto", "Branco", "Rosé", "Espumante"] if v["tipo"] == "rose" else ["Tinto", "Branco", "Espumante"]
        certa = nomes_tipo[v["tipo"]]
        ops, idx = embaralha(certa, [o for o in ops_tipo if o != certa])
        key = "dq" + v["id"]
        q1 = {"tipo": "mc", "dificuldade": 1, "habilidade": "rotulo",
              "pergunta": "Para abrir: este vinho é de qual tipo?",
              "opcoes": ops, "correta": idx,
              "okMsg": _ok(key + "1", "Primeira leitura do rótulo no bolso."),
              "erroMsg": _erro(key + "1", "Este é um {}.".format(certa.lower())),
              "porque": "A ficha deste vinho marca o tipo {}.".format(certa.lower())}
        if not valida(q1, certa):
            return None
        perguntas.append(q1)

        # 2) pais
        produtores = [p for p, c in st["paises"].items() if c >= 3 and p != v["pais"]]
        if len(produtores) < 3:
            produtores = [p for p in self.rank_paises[:8] if p != v["pais"]]
        produtores.sort(key=lambda p: (-self.n_paises.get(p, 0), p))
        ops, idx = embaralha(v["pais"], produtores[:3])
        q2 = {"tipo": "mc", "dificuldade": 2, "habilidade": "rotulo",
              "pergunta": "Procure a origem no rótulo. De qual país vem este vinho?",
              "opcoes": ops, "correta": idx,
              "okMsg": _ok(key + "2", "Origem achada. O rótulo sempre conta."),
              "erroMsg": _erro(key + "2", "Este vem {}.".format(prep_pais(v["pais"]))),
              "porque": "A ficha deste vinho marca {} como país de origem.".format(v["pais"])}
        if not valida(q2, v["pais"]):
            return None
        perguntas.append(q2)

        # 3) uva
        dist = self._distratores_uva(v, u, self._dif_uva(u))
        if not dist:
            return None
        ops, idx = embaralha(st["display"], dist)
        q3 = {"tipo": "mc", "dificuldade": 2, "habilidade": "rotulo",
              "pergunta": "E a uva principal deste rótulo, qual é?",
              "opcoes": ops, "correta": idx,
              "okMsg": _ok(key + "3", "Uva certa. Seu olho de prateleira está ficando afiado."),
              "erroMsg": _erro(key + "3", "Este é feito de {}.".format(st["display"])),
              "porque": "A ficha deste vinho traz {} como uva principal.".format(st["display"])}
        if not valida(q3, st["display"]):
            return None
        perguntas.append(q3)

        # 4) harmonizacao (preferida) ou faixa de preco (fecha facil)
        q4 = self._q_harmonia_desafio(v, rng, key) or self._q_preco_desafio(v, rng, key)
        if not q4 or not valida(q4, q4["opcoes"][q4["correta"]]):
            return None
        perguntas.append(q4)
        return perguntas

    def _q_harmonia_desafio(self, v, rng, key):
        if not v["harm_texto"] or not v["d5"]:
            return None
        cats = self._categorias_do_texto(v["harm_texto"])
        d5 = v["d5"]
        if v["tipo"] == "tinto" and d5["tanino"] >= 3:
            certas = [s for s in ("churrasco", "carne_vermelha", "massa_molho_vermelho",
                                  "queijo_curado", "pizza") if s in cats]
            pool = POOL_MAR_LEVE
        elif v["tipo"] in ("branco", "espumante") and d5["docura"] <= 2:
            certas = [s for s in ("frutos_do_mar", "peixe_leve", "salada", "ostras",
                                  "ceviche", "sushi", "aperitivo", "aves") if s in cats]
            pool = POOL_CARNE_PESADA
        else:
            return None
        if not certas:
            return None
        certa = certas[stable_idx(v["id"] + "h", len(certas))]
        tn = norm(v["harm_texto"])
        dist = []
        for s in pool:
            if s == certa or s in cats:
                continue
            if any(contem_termo(tn, norm(k)) for k in HARMONIZA_CATEGORIAS[s][0]):
                continue
            dist.append(HARMONIZA_CATEGORIAS[s][1])
        if len(dist) < 3:
            return None
        prato = HARMONIZA_CATEGORIAS[certa][1]
        ops = [prato] + dist[:3]
        ordem = list(range(4))
        rng.shuffle(ordem)
        ops = [ops[i] for i in ordem]
        return {"tipo": "mc", "dificuldade": 1, "habilidade": "harmonizacao",
                "pergunta": "Para fechar: qual destes pratos costuma cair bem com este vinho?",
                "opcoes": ops, "correta": ops.index(prato),
                "okMsg": _ok(key + "4", "Mesa posta. Você leu o vinho inteiro."),
                "erroMsg": _erro(key + "4", "A ficha dele sugere {}.".format(prato.lower())),
                "porque": "A ficha deste vinho aponta {} entre as companhias de mesa.".format(prato.lower())}

    FAIXAS_PRECO = [("Até R$ 40", 0, 40), ("Entre R$ 40 e R$ 90", 40, 90),
                    ("Entre R$ 90 e R$ 200", 90, 200),
                    ("Entre R$ 200 e R$ 500", 200, 500),
                    ("Acima de R$ 500", 500, 10 ** 9)]

    def _q_preco_desafio(self, v, rng, key):
        p = v["preco"]
        if not p:
            return None
        faixa = None
        for rotulo, lo, hi in self.FAIXAS_PRECO:
            if lo < p <= hi:
                # evita borda: preco a menos de 12% do limite vira ambiguidade
                if lo > 0 and p < lo * 1.12:
                    return None
                if hi < 10 ** 9 and p > hi * 0.88:
                    return None
                faixa = rotulo
                break
        if not faixa:
            return None
        outras = [r for r, _, _ in self.FAIXAS_PRECO if r != faixa]
        ops = [faixa] + outras[:3]
        ordem = list(range(4))
        rng.shuffle(ordem)
        ops = [ops[i] for i in ordem]
        return {"tipo": "mc", "dificuldade": 1, "habilidade": "rotulo",
                "pergunta": "Para fechar: na gôndola, este vinho costuma ficar em qual faixa de preço?",
                "opcoes": ops, "correta": ops.index(faixa),
                "okMsg": _ok(key + "4", "Olho de preço calibrado vale ouro no mercado."),
                "erroMsg": _erro(key + "4", "Ele costuma aparecer na faixa {}.".format(faixa.lower())),
                "porque": "O preço de referência deste vinho no nosso banco fica na faixa {}.".format(faixa.lower())}


# ----------------------------------------------------------------- curadoria

# Correcao C3 da DD de publico (dd-publico/DUE-DILIGENCE-PUBLICO.md): a faixa
# real de compra do publico e R$30-80 de mercado; a mediana do banco (R$108)
# nao descreve o cenario-base. Na curadoria, vinho com preco valido em 30-80
# ganha prioridade nas dificuldades 1-2 de todos os templates; 80-150 e
# neutro; acima de 150 vira minoritario e concentra na dificuldade 3
# (conteudo aspiracional). Meta: >= 45% do bundle com vinhos de R$30-80.
FAIXAS_C3 = ["<30", "30-80", "80-150", ">150"]
PESO_GONDOLA = 6.0        # 30-80 nas dificuldades 1-2 (cenario-base de compra)
PESO_ASPIRACIONAL = -4.0  # >150 nas dificuldades 1-2 (sai do cenario-base)
PESO_DIF3_ALTO = 1.0      # >150 concentra na dificuldade 3
META_GONDOLA = 0.45

# baseline medido em 12/jun/2026, antes da correcao C3 (bundle de 480)
BASELINE_C3_BUNDLE = {"<30": 2, "30-80": 44, "80-150": 57, ">150": 317,
                      "sem_vinho": 60, "sem_preco": 0}
BASELINE_C3_DESAFIOS_30_150 = 11  # de 40


def faixa_c3(preco):
    if preco is None:
        return "sem_preco"
    if preco < 30:
        return "<30"
    if preco <= 80:
        return "30-80"
    if preco <= 150:
        return "80-150"
    return ">150"


def peso_preco(preco, dificuldade):
    """peso de selecao por faixa de preco (correcao C3)."""
    fx = faixa_c3(preco)
    if dificuldade <= 2:
        if fx == "30-80":
            return PESO_GONDOLA
        if fx == ">150":
            return PESO_ASPIRACIONAL
        return 0.0
    return PESO_DIF3_ALTO if fx == ">150" else 0.0


QUOTAS = {
    # template: (total, {dificuldade: cota})
    "qual-uva": (90, {1: 36, 2: 36, 3: 18}),
    "de-onde-vem": (90, {1: 36, 2: 30, 3: 24}),
    "mais-encorpado": (90, {1: 36, 2: 30, 3: 24}),
    "harmoniza": (78, {1: 30, 2: 36, 3: 12}),
    "intruso-uva": (60, {1: 24, 2: 24, 3: 12}),
    "rotulo": (72, {1: 24, 2: 30, 3: 18}),
}

# nenhuma habilidade pode passar de 40% do bundle (auditoria f2)
CAP_HABILIDADE = 0.40


def curar_bundle(fab, desafio_ids):
    por_vinho = {v["id"]: v for v in fab.vinhos}
    total_alvo = sum(total for total, _ in QUOTAS.values())
    cap = int(total_alvo * CAP_HABILIDADE)
    hab_count = Counter()

    def prioridade(ex):
        v = por_vinho.get(ex.get("vinhoId"))
        score = 0.0
        if v:
            score += 4.0 * bool(v["img"])
            score += 2.0 * v["mercado_br"]
            score += min(v["pop"], 5000) / 5000.0
            score += peso_preco(v["preco"], ex["dificuldade"])  # correcao C3
        if ex["template"] == "rotulo" and ex.get("vinhoId") in desafio_ids:
            score -= 10.0  # nao queima rotulo do desafio na pratica
        if ex["template"] == "mais-encorpado":
            vb = por_vinho.get(ex.get("vinhoIdB"))
            if vb:
                score += 2.0 * vb["mercado_br"]
                score += 0.5 * peso_preco(vb["preco"], ex["dificuldade"])
        return score

    selecionados = []
    usados_ids = set()
    for template, (total, por_dif) in QUOTAS.items():
        pool = [e for e in fab.exercicios if e["template"] == template]
        pool.sort(key=lambda e: (-prioridade(e), e["id"]))
        escolhidos = []

        def pegar(e):
            escolhidos.append(e)
            hab_count[e["habilidade"]] += 1

        for dif, cota in por_dif.items():
            do_nivel = [e for e in pool if e["dificuldade"] == dif and e["id"] not in usados_ids]
            # variedade dentro do template (variantes alternadas)
            por_variante = defaultdict(list)
            for e in do_nivel:
                por_variante[e.get("variante", "")].append(e)
            roda = sorted(por_variante.keys())
            pegos = 0
            while pegos < cota and any(por_variante[k] for k in roda):
                progresso = False
                for k in roda:
                    if pegos >= cota:
                        break
                    lst = por_variante[k]
                    # primeiro candidato da variante que nao estoura o cap global
                    idx = next((j for j, e in enumerate(lst)
                                if hab_count[e["habilidade"]] < cap), None)
                    if idx is not None:
                        pegar(lst.pop(idx))
                        pegos += 1
                        progresso = True
                if not progresso:
                    break  # so restaram candidatos que estourariam o cap
        # completa cota total com o que houver, ainda respeitando o cap
        if len(escolhidos) < total:
            ids_escolhidos = {e["id"] for e in escolhidos}
            resto = [e for e in pool
                     if e["id"] not in ids_escolhidos and e["id"] not in usados_ids]
            for e in resto:
                if len(escolhidos) >= total:
                    break
                if hab_count[e["habilidade"]] < cap:
                    pegar(e)
        for e in escolhidos:
            usados_ids.add(e["id"])
        selecionados.extend(escolhidos)
    return selecionados


# -------------------------------------------------------------------- QA

def escrever_qa(fab, bundle, desafios, dur):
    linhas = []
    linhas.append("# QA — Fabrica de questoes (deterministica, sem LLM)")
    linhas.append("")
    linhas.append("**Gerado por:** `scripts/fabrica_questoes.py` (seed {}, idempotente). "
                  "Fonte: `data/vinhos_clean.csv` filtrada por `view_estrita=True` e "
                  "`preco_valido!=False` + filtro defensivo de nao-vinhos.".format(SEED))
    linhas.append("**Quando:** {} · duracao {:.1f}s".format(
        datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"), dur))
    linhas.append("")
    linhas.append("## Totais")
    linhas.append("")
    linhas.append("| Onde | Total |")
    linhas.append("|---|---|")
    linhas.append("| Banco completo (`data/banco_pratica_full.jsonl`) | {} |".format(len(fab.exercicios)))
    linhas.append("| Bundle curado (`app/src/content/pratica/banco-pratica.json`) | {} |".format(len(bundle)))
    linhas.append("| Desafios do Dia (`app/src/content/pratica/desafios.json`) | {} ({} perguntas) |".format(
        len(desafios), sum(len(d["perguntas"]) for d in desafios)))
    linhas.append("")

    def tabela_dist(exs, titulo):
        linhas.append("### {}".format(titulo))
        linhas.append("")
        linhas.append("| template | dif 1 | dif 2 | dif 3 | total |")
        linhas.append("|---|---|---|---|---|")
        por_t = defaultdict(Counter)
        for e in exs:
            por_t[e["template"]][e["dificuldade"]] += 1
        for tmpl in sorted(por_t):
            c = por_t[tmpl]
            linhas.append("| {} | {} | {} | {} | {} |".format(
                tmpl, c[1], c[2], c[3], sum(c.values())))
        tot = Counter(e["dificuldade"] for e in exs)
        linhas.append("| **total** | {} | {} | {} | {} |".format(
            tot[1], tot[2], tot[3], len(exs)))
        linhas.append("")

    tabela_dist(fab.exercicios, "Banco completo, por template e dificuldade")
    tabela_dist(bundle, "Bundle curado, por template e dificuldade")

    linhas.append("### Bundle por habilidade")
    linhas.append("")
    hab = Counter(e["habilidade"] for e in bundle)
    linhas.append("| habilidade | exercicios |")
    linhas.append("|---|---|")
    for h, n in hab.most_common():
        linhas.append("| {} | {} |".format(h, n))
    linhas.append("")

    por_vinho = {v["id"]: v for v in fab.vinhos}
    com_img = sum(1 for e in bundle if e.get("imagem")
                  or (e.get("vinhoId") and por_vinho.get(e["vinhoId"], {}).get("img")))
    br = sum(1 for e in bundle if e.get("vinhoId") and por_vinho.get(e["vinhoId"], {}).get("mercado_br"))
    linhas.append("Bundle: {} exercicios de vinhos com imagem baixada · {} de vinhos do mercado BR.".format(com_img, br))
    linhas.append("")

    linhas.append("## Distribuicao de preco (correcao C3 da DD de publico)")
    linhas.append("")
    linhas.append("A faixa real de compra do publico e R$30-80; a mediana do banco (R$108) "
                  "nao descreve o cenario-base. A curadoria pondera a selecao por faixa: "
                  "30-80 tem prioridade nas dificuldades 1-2 de todos os templates, 80-150 "
                  "e neutra e acima de 150 vira conteudo aspiracional concentrado na "
                  "dificuldade 3. Meta: 45% ou mais do bundle com vinhos de R$30-80.")
    linhas.append("")
    faixas = Counter()
    por_dif_preco = defaultdict(Counter)
    for e in bundle:
        v = por_vinho.get(e.get("vinhoId"))
        fx = faixa_c3(v["preco"]) if v else "sem_vinho"
        faixas[fx] += 1
        por_dif_preco[e["dificuldade"]][fx] += 1
    rotulos_fx = {"<30": "abaixo de R$30", "30-80": "R$30-80 (gondola do publico)",
                  "80-150": "R$80-150", ">150": "acima de R$150 (aspiracional)",
                  "sem_vinho": "sem vinho ancorado (intruso-uva)",
                  "sem_preco": "vinho sem preco de referencia"}
    base_total = max(1, sum(BASELINE_C3_BUNDLE.values()))
    linhas.append("| faixa | antes (12/jun, pre-C3) | depois |")
    linhas.append("|---|---|---|")
    for fx in FAIXAS_C3 + ["sem_vinho", "sem_preco"]:
        antes = BASELINE_C3_BUNDLE.get(fx, 0)
        depois = faixas.get(fx, 0)
        linhas.append("| {} | {} ({:.0f}%) | {} ({:.0f}%) |".format(
            rotulos_fx[fx], antes, 100.0 * antes / base_total,
            depois, 100.0 * depois / max(1, len(bundle))))
    linhas.append("")
    linhas.append("### Depois, por dificuldade")
    linhas.append("")
    linhas.append("| dificuldade | <30 | 30-80 | 80-150 | >150 | sem vinho | sem preco |")
    linhas.append("|---|---|---|---|---|---|---|")
    for d in sorted(por_dif_preco):
        c = por_dif_preco[d]
        linhas.append("| {} | {} | {} | {} | {} | {} | {} |".format(
            d, c["<30"], c["30-80"], c["80-150"], c[">150"],
            c["sem_vinho"], c["sem_preco"]))
    linhas.append("")
    cd = Counter(faixa_c3(por_vinho[d["vinhoId"]]["preco"]) for d in desafios)
    em_gondola = cd["30-80"] + cd["80-150"]
    linhas.append("Desafios do Dia com vinho de R$30-150 (gondola BR): {}/{} "
                  "(antes: {}/40). Por faixa: <30 {} · 30-80 {} · 80-150 {} · >150 {}.".format(
                      em_gondola, len(desafios), BASELINE_C3_DESAFIOS_30_150,
                      cd["<30"], cd["30-80"], cd["80-150"], cd[">150"]))
    linhas.append("")

    linhas.append("## Taxa de descarte por regra de validacao")
    linhas.append("")
    linhas.append("| regra | descartes |")
    linhas.append("|---|---|")
    for regra, n in sorted(fab.val.descartes.items(), key=lambda kv: -kv[1]):
        linhas.append("| {} | {} |".format(regra, n))
    total_desc = sum(fab.val.descartes.values())
    linhas.append("| **total** | {} |".format(total_desc))
    linhas.append("")
    linhas.append("Aproveitamento: {} aceitos / {} tentados ({:.0f}%).".format(
        len(fab.exercicios), len(fab.exercicios) + total_desc,
        100.0 * len(fab.exercicios) / max(1, len(fab.exercicios) + total_desc)))
    linhas.append("")

    linhas.append("## Exemplos (5 por template, do bundle)")
    linhas.append("")
    rng = random.Random(SEED)
    for tmpl in sorted(QUOTAS):
        exs = [e for e in bundle if e["template"] == tmpl]
        amostra = rng.sample(exs, min(5, len(exs)))
        linhas.append("### {}".format(tmpl))
        linhas.append("")
        for e in amostra:
            resp = e["opcoes"][e.get("correta", e.get("intruso"))]
            extra = " · imagem: `{}`".format(e["imagem"]) if e.get("imagem") else ""
            linhas.append("- (dif {}) {} **Opcoes:** {} **Resposta:** {}{}".format(
                e["dificuldade"], e.get("pergunta", ""),
                " / ".join(e["opcoes"]), resp, extra))
        linhas.append("")

    linhas.append("## Desafios do Dia (amostra)")
    linhas.append("")
    for d in desafios[:3]:
        v = por_vinho[d["vinhoId"]]
        linhas.append("- **{}** · {} ({}, {}) · imagem `{}` · perguntas: {}".format(
            d["id"], nome_exibicao(v["nome"]), v["pais"], v["tipo"], d["imagem"],
            " | ".join(q["pergunta"] for q in d["perguntas"])))
    linhas.append("")

    linhas.append("## Imagens preparadas")
    linhas.append("")
    if os.path.exists(ROTULOS_STATS):
        with open(ROTULOS_STATS, encoding="utf-8") as f:
            rs = json.load(f)
        linhas.append("- Convertidas para webp 480px: **{}** arquivos em `app/public/rotulos/`".format(rs["total"]))
        linhas.append("- Peso total: **{:.2f} MB** (alvo < 8 MB) · media {:.1f} KB".format(
            rs["peso_mb"], rs["media_kb"]))
        if rs.get("falhas"):
            linhas.append("- Falhas de conversao: {}".format(rs["falhas"]))
    else:
        linhas.append("- Pendente: rodar `python scripts/preparar_rotulos.py` e re-rodar a fabrica para atualizar este bloco.")
    linhas.append("")

    with open(OUT_QA, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))


# -------------------------------------------------------------------- self-check

def self_check(fab, bundle, desafios):
    """imprime a verificacao final: preco por faixa/dificuldade (correcao C3),
    caps de curadoria, referencias de imagem e schema. Falha dura -> exit 1."""
    por_vinho = {v["id"]: v for v in fab.vinhos}
    colunas = FAIXAS_C3 + ["sem_vinho", "sem_preco"]
    falhas = []
    print("")
    print("== SELF-CHECK ==")

    # 1) distribuicao de preco do bundle, por faixa e por dificuldade
    faixas = Counter()
    por_dif = defaultdict(Counter)
    for e in bundle:
        v = por_vinho.get(e.get("vinhoId"))
        fx = faixa_c3(v["preco"]) if v else "sem_vinho"
        faixas[fx] += 1
        por_dif[e["dificuldade"]][fx] += 1
    print("Preco do bundle por faixa: " + " · ".join(
        "{} {}".format(fx, faixas.get(fx, 0)) for fx in colunas))
    for d in sorted(por_dif):
        print("  dif {}: ".format(d) + " · ".join(
            "{} {}".format(fx, por_dif[d].get(fx, 0)) for fx in colunas))
    pct = faixas["30-80"] / float(max(1, len(bundle)))
    if pct >= META_GONDOLA:
        print("Meta C3 (>= {:.0f}% do bundle em R$30-80): OK com {:.1f}%".format(
            100 * META_GONDOLA, 100 * pct))
    else:
        falhas.append("meta_c3: so {:.1f}% do bundle em R$30-80 (meta {:.0f}%)".format(
            100 * pct, 100 * META_GONDOLA))
    cd = Counter(faixa_c3(por_vinho[d["vinhoId"]]["preco"]) for d in desafios)
    print("Desafios do Dia em R$30-150 (gondola BR): {}/{}".format(
        cd["30-80"] + cd["80-150"], len(desafios)))

    # 2) caps de curadoria (total por template, cota por dificuldade, habilidade)
    por_t = defaultdict(Counter)
    for e in bundle:
        por_t[e["template"]][e["dificuldade"]] += 1
    caps_ok = True
    for tmpl, (total, por_d) in QUOTAS.items():
        c = por_t[tmpl]
        if sum(c.values()) > total:
            caps_ok = False
            falhas.append("cap_template: {} com {} exercicios (cap {})".format(
                tmpl, sum(c.values()), total))
        for d, cota in por_d.items():
            if c[d] > cota:
                caps_ok = False
                falhas.append("cap_dificuldade: {} dif {} com {} (cota {})".format(
                    tmpl, d, c[d], cota))
    cap_hab = int(sum(t for t, _ in QUOTAS.values()) * CAP_HABILIDADE)
    hab = Counter(e["habilidade"] for e in bundle)
    for h, n in hab.items():
        if n > cap_hab:
            caps_ok = False
            falhas.append("cap_habilidade: {} com {} (cap {})".format(h, n, cap_hab))
    if caps_ok:
        print("Caps de curadoria (template, dificuldade, habilidade <= {}): mantidos.".format(cap_hab))

    # 3) referencias de imagem (bundle + desafios)
    rot_dir = os.path.join(BASE, "app", "public", "rotulos")
    refs = set()
    for e in bundle:
        if e.get("imagem"):
            refs.add(e["imagem"].split("/")[-1].rsplit(".", 1)[0])
    for d in desafios:
        refs.add(d["imagem"].split("/")[-1].rsplit(".", 1)[0])
    sem_origem = sorted(r for r in refs if not (por_vinho.get(r) or {}).get("img"))
    pendentes = sorted(r for r in refs - set(sem_origem)
                       if not os.path.exists(os.path.join(rot_dir, r + ".webp")))
    if sem_origem:
        falhas.append("imagem_quebrada: {} ids sem origem em data/imagens (ex.: {})".format(
            len(sem_origem), ", ".join(sem_origem[:3])))
    if pendentes:
        print("Imagens referenciadas sem webp em app/public/rotulos: {} "
              "(rodar scripts/preparar_rotulos.py e re-rodar a fabrica).".format(len(pendentes)))
    else:
        print("Referencias de imagem: {} ids, zero quebradas, todas com webp em app/public/rotulos.".format(len(refs)))

    # 4) schema
    erros_schema = 0
    for e in bundle:
        if fab.val._schema(e):
            erros_schema += 1
    n_perguntas = 0
    for d in desafios:
        for q in d["perguntas"]:
            n_perguntas += 1
            if fab.val._schema(q):
                erros_schema += 1
    if erros_schema:
        falhas.append("schema: {} itens invalidos".format(erros_schema))
    else:
        print("Schema: ok ({} exercicios do bundle + {} perguntas de desafio).".format(
            len(bundle), n_perguntas))

    if falhas:
        print("SELF-CHECK FALHOU:")
        for item in falhas:
            print("  - " + item)
        sys.exit(1)
    print("SELF-CHECK: tudo certo.")


# -------------------------------------------------------------------- main

def main():
    t0 = datetime.now()
    print("== Fabrica de questoes (seed {}) ==".format(SEED))
    vinhos = carregar_banco()
    print("Base elegivel: {} vinhos (view estrita + preco valido + filtro de nao-vinho)".format(len(vinhos)))
    uvas = canonizar_uvas(vinhos)
    print("Uvas canonicas: {} ({} com cor definida)".format(
        len(uvas), sum(1 for s in uvas.values() if s["cor"])))

    fab = Fabrica(vinhos, uvas)
    fab.gerar_qual_uva()
    fab.gerar_de_onde_vem()
    fab.gerar_mais_encorpado()
    fab.gerar_harmoniza()
    fab.gerar_intruso_uva()
    fab.gerar_rotulo()
    print("Exercicios validos no banco completo: {}".format(len(fab.exercicios)))
    print("Descartes: {}".format(sum(fab.val.descartes.values())))

    desafios = fab.gerar_desafios(40)
    print("Desafios do Dia: {}".format(len(desafios)))
    desafio_ids = {d["vinhoId"] for d in desafios}

    bundle = curar_bundle(fab, desafio_ids)
    print("Bundle curado: {}".format(len(bundle)))

    os.makedirs(os.path.dirname(OUT_BUNDLE), exist_ok=True)
    with open(OUT_FULL, "w", encoding="utf-8") as f:
        for e in fab.exercicios:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")

    agora = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    meta_bundle = {
        "geradoEm": agora,
        "seed": SEED,
        "total": len(bundle),
        "porTemplate": dict(Counter(e["template"] for e in bundle)),
        "porDificuldade": {str(k): v for k, v in sorted(Counter(e["dificuldade"] for e in bundle).items())},
        "porHabilidade": dict(Counter(e["habilidade"] for e in bundle)),
        "exercicios": bundle,
    }
    with open(OUT_BUNDLE, "w", encoding="utf-8") as f:
        json.dump(meta_bundle, f, ensure_ascii=False, indent=2)

    meta_desafios = {
        "geradoEm": agora,
        "seed": SEED,
        "total": len(desafios),
        "desafios": desafios,
    }
    with open(OUT_DESAFIOS, "w", encoding="utf-8") as f:
        json.dump(meta_desafios, f, ensure_ascii=False, indent=2)

    dur = (datetime.now() - t0).total_seconds()
    escrever_qa(fab, bundle, desafios, dur)
    print("Saidas escritas:")
    for p in (OUT_FULL, OUT_BUNDLE, OUT_DESAFIOS, OUT_QA):
        print("  -", os.path.relpath(p, BASE))
    self_check(fab, bundle, desafios)


if __name__ == "__main__":
    main()
