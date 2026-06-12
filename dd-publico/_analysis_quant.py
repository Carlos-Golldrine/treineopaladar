# -*- coding: utf-8 -*-
"""DD Publico Tchin Tchin - analise quantitativa (bases primarias/hibridas)."""
import sys, os, glob, re, warnings
import numpy as np
import pandas as pd
from scipy import stats
import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.stats.multitest import multipletests
from statsmodels.stats.proportion import proportion_confint, proportions_ztest, binom_test

sys.stdout.reconfigure(encoding="utf-8")
warnings.filterwarnings("ignore")
pd.set_option("display.width", 200)

BASE = glob.glob(r"C:\Users\camargo\OneDrive\*rea de Trabalho\Tchin Tchin\duolingo do vinho\tchin-pipeline-v2\data\output")[0]
DL = r"C:\Users\camargo\Downloads"
SCRAPE_DATE = pd.Timestamp("2026-05-13", tz="UTC")

def wilson(k, n):
    lo, hi = proportion_confint(k, n, method="wilson")
    return f"{100*k/n:.1f}% [{100*lo:.1f}; {100*hi:.1f}]"

print("#"*70); print("## A. CARGA E LIMPEZA"); print("#"*70)

# ---- s5 comments classified (hibrido: comentario+upvotes primarios, rotulos IA)
cm = pd.read_csv(os.path.join(BASE, "s5_comments_classified.csv"))
print("s5_comments_classified bruto:", cm.shape, "| dup comment_id:", cm.comment_id.duplicated().sum())

# idade do comentario (confundidor de upvotes)
def parse_age_years(x):
    if pd.isna(x): return np.nan
    s = str(x)
    try:
        d = pd.to_datetime(s, utc=True)
        return max((SCRAPE_DATE - d).days / 365.25, 0.0)
    except Exception:
        pass
    m = re.search(r"(\d+)\s*(hour|day|week|month|year)", s)
    if not m: return np.nan
    v, u = int(m.group(1)), m.group(2)
    f = {"hour": 1/8760, "day": 1/365.25, "week": 7/365.25, "month": 1/12, "year": 1.0}[u]
    return v * f

cm["age_years"] = cm.date_posted.map(parse_age_years)
cm["iniciante"] = (cm.persona_fit == "HP3_iniciante_estrategica").astype(float)
cm["entendido"] = (cm.persona_fit == "HP4_sommelier_fim_semana").astype(float)
cm["sent_duvida"] = (cm.sentiment == "dúvida").astype(float)
cm["sent_negativo"] = cm.sentiment.isin(["crítica", "frustração"]).astype(float)
cm["log_textlen"] = np.log1p(cm.text_length)
cm["learning"] = cm.mentions_learning.astype(float)

# engajamento: acima da mediana DENTRO da fonte (escala de likes difere por plataforma)
eng = cm[cm.upvotes_or_likes.notna()].copy()
med = eng.groupby("source").upvotes_or_likes.transform("median")
eng["engaged"] = (eng.upvotes_or_likes > med).astype(int)
eng["upv_pctile"] = eng.groupby("source").upvotes_or_likes.rank(pct=True)
print("com upvotes:", len(eng), "| mediana por fonte:", eng.groupby('source').upvotes_or_likes.median().to_dict())
print("taxa engaged por fonte:", eng.groupby("source").engaged.mean().round(3).to_dict())
pt = cm[cm.language == "pt"].copy()
eng_pt = eng[eng.language == "pt"].copy()
print("pt:", len(pt), "| pt c/ upvotes:", len(eng_pt), "| age_years parse ok:", eng_pt.age_years.notna().sum())

# ---- s5 personas visual (hibrido) / s3 (primario)
vz = pd.read_csv(os.path.join(BASE, "s5_personas_visual.csv"))
age_ord_map = {"18-24": 1, "25-34": 2, "35-44": 3, "45-54": 4, "55+": 5}
vz["age_ord"] = vz.vision_age_range.map(age_ord_map)
vz["gender_F"] = vz.vision_gender.map({"F": 1.0, "M": 0.0})
vz["age_35_54"] = vz.vision_age_range.isin(["35-44", "45-54"]).astype(float).where(vz.vision_age_range.notna())
vz["age_35plus"] = (vz.age_ord >= 3).astype(float).where(vz.age_ord.notna())
vz["log_followers"] = np.log10(vz.follower_count)
vz["wine"] = vz.vision_wine_present.astype(float)
print("s5_personas_visual:", vz.shape)

# ---- s1 demand map (queries reais Google; rotulos IA)
s1 = pd.read_csv(os.path.join(BASE, "s1_demand_map.csv"))

# ---- YouTube BR out/2025 (primario, so texto)
yt = pd.read_csv(os.path.join(DL, "Extração - Vinhos(Comentarios).csv"), encoding="cp1252", sep=";")
yt = yt[yt["comentárioTexto"].notna()].drop_duplicates(subset=["comentárioTexto", "autor"])
print("YT-2025 limpo:", len(yt), "| autores:", yt.autor.nunique())

print(); print("#"*70); print("## B. ESTRATIFICACAO vs PUBLICO-ALVO (35-54, 73% iniciantes)"); print("#"*70)

print("\n--- B1. Idade inferida (IG, n=73, 16 nulos) ---")
ac = vz.vision_age_range.value_counts().reindex(["18-24","25-34","35-44","45-54","55+"])
n_age = int(ac.sum())
for k, v in ac.items():
    print(f"  {k}: {v}  ({wilson(v, n_age)})")
k3554 = int(ac["35-44"] + ac["45-54"])
print(f"  35-54: {k3554}/{n_age} = {wilson(k3554, n_age)}")
p_bin = stats.binomtest(k3554, n_age, 0.5, alternative="less").pvalue
print(f"  H0: P(35-54)>=50% (alvo 'core e maioria') | binomial unilateral p={p_bin:.3f}")
k2544 = int(ac["25-34"] + ac["35-44"])
print(f"  25-44: {k2544}/{n_age} = {wilson(k2544, n_age)}")

print("\n--- B2. Genero inferido (IG) ---")
gc = vz.vision_gender.value_counts()
nFM = int(gc.get("F",0) + gc.get("M",0))
print(f"  F: {gc.get('F',0)}, M: {gc.get('M',0)}, ambiguo: {gc.get('ambíguo',0)}, nulo: {int(vz.vision_gender.isna().sum())}")
print(f"  %F entre F/M: {wilson(int(gc['F']), nFM)} | binomial vs 50%: p={stats.binomtest(int(gc['F']), nFM, 0.5).pvalue:.4f}")

print("\n--- B3. Nivel de conhecimento: persona IA nos comentarios pt (n=%d) ---" % len(pt))
pc = pt.persona_fit.value_counts()
print(pc.to_string())
clas = pt[pt.persona_fit.notna() & (pt.persona_fit != "indefinido")]
n_cl = len(clas)
ini_strict = int((clas.persona_fit == "HP3_iniciante_estrategica").sum())
ini_broad = int(clas.persona_fit.isin(["HP3_iniciante_estrategica","HP2_curioso_conectado","HP6_genz"]).sum())
ent = int((clas.persona_fit == "HP4_sommelier_fim_semana").sum())
print(f"  classificados (excl. indefinido): {n_cl}")
print(f"  iniciante estrito (HP3): {wilson(ini_strict, n_cl)}")
print(f"  iniciante amplo (HP3+HP2+HP6): {wilson(ini_broad, n_cl)}")
print(f"  entendido (HP4): {wilson(ent, n_cl)}")
for k, lbl in [(ini_strict, "HP3"), (ini_broad, "amplo")]:
    pv = stats.binomtest(k, n_cl, 0.73).pvalue
    print(f"  H0: prop iniciante = 73% declarado | {lbl}: p={pv:.2e}")

print("\n--- B4. Demanda de busca (s1, 114 queries Google related/PAA) ---")
qc = s1.persona_fit.value_counts(); nq = len(s1)
for k, v in qc.items(): print(f"  {k}: {v} ({wilson(v, nq)})")
print("  funil:", s1.estagio_funil.value_counts().to_dict(), "| emocao:", s1.emotional_tag.value_counts().to_dict())

print("\n--- B5. Regiao e renda ---")
print("  NENHUMA base primaria auditada tem regiao ou renda no microdado. Unico dado: agregado GA no PDF (BSB 53%) - nao testavel aqui.")

print("\n--- B6. Triangulacao lexical YT-2025 (n=%d, pt-BR, primario puro) ---" % len(yt))
txt = yt["comentárioTexto"].str.lower()
kw = {"aprend": "aprender/aprendizado", "inicia": "iniciante/iniciar", "dica": "dica(s)",
      "indic": "indicar/indicacao", "harmoniz": "harmonizacao", "preço|preco|barat|caro": "preco",
      "curso": "curso", "melhor vinho|qual vinho": "qual/melhor vinho"}
for pat, lbl in kw.items():
    k = int(txt.str.contains(pat, regex=True).sum())
    print(f"  {lbl}: {k}/{len(yt)} ({wilson(k, len(yt))})")

print(); print("#"*70); print("## C. CORRELACOES (Spearman, BH-FDR)"); print("#"*70)

def spearman_matrix(df, cols, label):
    print(f"\n--- {label} ---")
    rows = []
    for i in range(len(cols)):
        for j in range(i+1, len(cols)):
            a, b = cols[i], cols[j]
            sub = df[[a, b]].dropna()
            if len(sub) < 10: continue
            rho, p = stats.spearmanr(sub[a], sub[b])
            rows.append((a, b, len(sub), rho, p))
    if not rows: return
    rej, padj, _, _ = multipletests([r[4] for r in rows], method="fdr_bh")
    print(f"{'var1':22s} {'var2':22s} {'n':>4s} {'rho':>7s} {'p':>8s} {'p_FDR':>8s} sig")
    for (a, b, n, rho, p), pa, rj in sorted(zip(rows, padj, rej), key=lambda t: t[1]):
        print(f"{a:22s} {b:22s} {n:4d} {rho:7.3f} {p:8.4f} {pa:8.4f} {'*' if rj else ''}")

spearman_matrix(vz, ["follower_count","following_count","posts_count","follower_following_ratio","age_ord","gender_F","wine"],
                "C1. Perfis IG (n<=73; age_ord/gender/wine = inferidos por IA)")
spearman_matrix(eng_pt, ["pain_intensity","log_textlen","upv_pctile","age_years","learning","iniciante","entendido","sent_duvida"],
                "C2. Comentarios pt c/ upvotes (n<=%d; pain/persona/learning/sentiment = rotulos IA; upv_pctile/textlen/age = primarios)" % len(eng_pt))

print(); print("#"*70); print("## D. MODELOS (variavel-resposta primaria: engajamento)"); print("#"*70)

print("\n--- D1. Logit: engaged (upvotes > mediana da fonte) ~ rotulos IA + controles | pt, n=%d ---" % len(eng_pt))
d1 = eng_pt.dropna(subset=["pain_intensity","learning","iniciante","entendido","log_textlen","age_years","engaged"]).copy()
d1["src_tiktok"] = (d1.source == "tiktok_curated").astype(float)
d1["src_reddit"] = (d1.source == "reddit").astype(float)
X = d1[["pain_intensity","learning","iniciante","entendido","log_textlen","age_years","src_tiktok","src_reddit"]]
X = sm.add_constant(X)
m1 = sm.Logit(d1.engaged, X).fit(disp=0)
print(f"n={int(m1.nobs)} | pseudo-R2={m1.prsquared:.3f} | LLR p={m1.llr_pvalue:.2e}")
co = pd.DataFrame({"beta": m1.params, "OR": np.exp(m1.params),
                   "OR_lo": np.exp(m1.conf_int()[0]), "OR_hi": np.exp(m1.conf_int()[1]), "p": m1.pvalues})
print(co.round(4).to_string())
corr = X.drop(columns="const").corr().abs()
mx = corr.where(~np.eye(len(corr), dtype=bool)).max().max()
print(f"max |corr| entre preditores: {mx:.2f}")
# sensibilidade: todas linguas
d1b = eng.dropna(subset=["pain_intensity","learning","iniciante","entendido","log_textlen","age_years","engaged"]).copy()
d1b["src_tiktok"] = (d1b.source=="tiktok_curated").astype(float); d1b["src_reddit"]=(d1b.source=="reddit").astype(float)
d1b["lang_pt"] = (d1b.language=="pt").astype(float)
Xb = sm.add_constant(d1b[["pain_intensity","learning","iniciante","entendido","log_textlen","age_years","src_tiktok","src_reddit","lang_pt"]])
m1b = sm.Logit(d1b.engaged, Xb).fit(disp=0)
print(f"\nSensibilidade (todas linguas, n={int(m1b.nobs)}): OR pain={np.exp(m1b.params['pain_intensity']):.2f} (p={m1b.pvalues['pain_intensity']:.3f}), OR learning={np.exp(m1b.params['learning']):.2f} (p={m1b.pvalues['learning']:.3f}), OR iniciante={np.exp(m1b.params['iniciante']):.2f} (p={m1b.pvalues['iniciante']:.3f})")

print("\n--- D2. OLS: percentil de upvotes na fonte ~ mesmos preditores (robusto HC3) ---")
m2 = smf.ols("upv_pctile ~ pain_intensity + learning + iniciante + entendido + log_textlen + age_years + src_tiktok + src_reddit", data=d1).fit(cov_type="HC3")
co2 = pd.DataFrame({"beta": m2.params, "lo": m2.conf_int()[0], "hi": m2.conf_int()[1], "p": m2.pvalues})
print(f"n={int(m2.nobs)} | R2={m2.rsquared:.3f}")
print(co2.round(4).to_string())

print("\n--- D3. Logit IG (SUBPOTENCIA, so exploratorio): wine_present ~ idade 35+ + log followers + genero ---")
d3 = vz.dropna(subset=["wine","age_35plus","log_followers","gender_F"])
print(f"n={len(d3)} | eventos wine=1: {int(d3.wine.sum())}  (~%d eventos/parametro - minimo recomendado e 10)" % (d3.wine.sum()/3))
try:
    m3 = sm.Logit(d3.wine, sm.add_constant(d3[["age_35plus","log_followers","gender_F"]])).fit(disp=0)
    co3 = pd.DataFrame({"OR": np.exp(m3.params), "OR_lo": np.exp(m3.conf_int()[0]), "OR_hi": np.exp(m3.conf_int()[1]), "p": m3.pvalues})
    print(co3.round(3).to_string())
except Exception as e:
    print("  nao convergiu:", e)
tab = pd.crosstab(d3.age_35plus, d3.wine)
print("  Fisher exato 35+ x wine:", tab.values.tolist(), "p=%.3f" % stats.fisher_exact(tab)[1])

print(); print("#"*70); print("## E. HIPOTESE DE SEGMENTO: INICIANTE (HP3) vs ENTENDIDO (HP4), comentarios pt"); print("#"*70)
h3 = pt[pt.persona_fit == "HP3_iniciante_estrategica"]
h4 = pt[pt.persona_fit == "HP4_sommelier_fim_semana"]
print(f"n HP3={len(h3)}, HP4={len(h4)} | razao {len(h3)/len(h4):.2f}:1")
z, pz = proportions_ztest([len(h3), len(h4)], [len(clas), len(clas)])
print(f"diferenca de share entre os classificados: {wilson(len(h3), n_cl)} vs {wilson(len(h4), n_cl)} | z={z:.2f} p={pz:.2e}")

print("\n--- E1. Intensidade de dor (rotulo IA 1-5) ---")
u, pmw = stats.mannwhitneyu(h3.pain_intensity.dropna(), h4.pain_intensity.dropna(), alternative="two-sided")
n1, n2 = h3.pain_intensity.notna().sum(), h4.pain_intensity.notna().sum()
cliff = 2*u/(n1*n2) - 1
print(f"medias: HP3={h3.pain_intensity.mean():.2f} HP4={h4.pain_intensity.mean():.2f} | medianas: {h3.pain_intensity.median():.0f} vs {h4.pain_intensity.median():.0f}")
print(f"Mann-Whitney U={u:.0f}, p={pmw:.2e} | delta de Cliff={cliff:.3f}")
print("dor>=3 (alta): HP3", wilson(int((h3.pain_intensity>=3).sum()), n1), "| HP4", wilson(int((h4.pain_intensity>=3).sum()), n2))

print("\n--- E2. Demanda por aprendizado (mentions_learning - MESMO codificador IA, ver caveat) ---")
tab = pd.crosstab(pt.persona_fit.where(pt.persona_fit.isin(["HP3_iniciante_estrategica","HP4_sommelier_fim_semana"])), pt.mentions_learning)
chi2, pchi, dof, _ = stats.chi2_contingency(tab)
print(tab.to_string())
print(f"HP3 learning: {wilson(208, 274)} | HP4: {wilson(93, 173)} | chi2={chi2:.1f} p={pchi:.2e}")

print("\n--- E3. Sentimento 'duvida' ---")
t3 = [int(h3.sent_duvida.sum()), int(h4.sent_duvida.sum())]
print(f"HP3: {wilson(t3[0], len(h3))} | HP4: {wilson(t3[1], len(h4))}")
chi2b, pchib, _, _ = stats.chi2_contingency([[t3[0], len(h3)-t3[0]], [t3[1], len(h4)-t3[1]]])
print(f"chi2={chi2b:.1f} p={pchib:.2e}")

print("\n--- E4. Engajamento real (primario) por persona ---")
e3 = eng_pt[eng_pt.persona_fit=="HP3_iniciante_estrategica"].upv_pctile.dropna()
e4 = eng_pt[eng_pt.persona_fit=="HP4_sommelier_fim_semana"].upv_pctile.dropna()
u2, pmw2 = stats.mannwhitneyu(e3, e4, alternative="two-sided")
print(f"percentil mediano de upvotes: HP3={e3.median():.2f} (n={len(e3)}) vs HP4={e4.median():.2f} (n={len(e4)}) | MW p={pmw2:.3f} | delta Cliff={2*u2/(len(e3)*len(e4))-1:.3f}")

print("\n--- E5. JTBD top-5 por persona (rotulo IA) ---")
for h, nome in [(h3, "HP3 iniciante"), (h4, "HP4 entendido")]:
    tt = h.jtbd_primary.value_counts(normalize=True).head(5).mul(100).round(1)
    print(f"  {nome}: " + "; ".join(f"{i}={v}%" for i, v in tt.items()))

print("\n--- E6. Pain x persona (todas as 6 HP, pt) ---")
tmp = pt[pt.persona_fit.notna() & (pt.persona_fit!="indefinido")]
kw_ = stats.kruskal(*[g.pain_intensity.dropna() for _, g in tmp.groupby("persona_fit") if g.pain_intensity.notna().sum()>2])
print("Kruskal-Wallis H=%.1f p=%.2e" % kw_)
print(tmp.groupby("persona_fit").pain_intensity.agg(["count","mean","median"]).round(2).to_string())
