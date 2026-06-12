# -*- coding: utf-8 -*-
"""
Prepara as imagens de rotulo usadas pela fabrica de questoes.

Le o bundle curado (banco-pratica.json) e os Desafios do Dia (desafios.json),
coleta todo id de vinho referenciado em campo "imagem", converte a imagem
original de data/imagens/{id}.{ext} para webp de largura 480 (qualidade 80)
em app/public/rotulos/{id}.webp.

Idempotente: pula arquivos ja convertidos cuja origem nao mudou.
Escreve data/_rotulos_stats.json (consumido pelo QA da fabrica).

Uso:  python scripts/preparar_rotulos.py
"""

import json
import os
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow ausente. Instale com: pip install Pillow")
    sys.exit(1)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(BASE, "data", "imagens")
OUT_DIR = os.path.join(BASE, "app", "public", "rotulos")
BUNDLE = os.path.join(BASE, "app", "src", "content", "pratica", "banco-pratica.json")
DESAFIOS = os.path.join(BASE, "app", "src", "content", "pratica", "desafios.json")
STATS = os.path.join(BASE, "data", "_rotulos_stats.json")

LARGURA = 480
QUALIDADE = 80


def ids_referenciados():
    ids = set()

    def do_imagem(campo):
        # "/rotulos/{id}.webp" -> id
        if campo and campo.startswith("/rotulos/"):
            ids.add(campo.split("/")[-1].rsplit(".", 1)[0])

    with open(BUNDLE, encoding="utf-8") as f:
        bundle = json.load(f)
    for ex in bundle["exercicios"]:
        do_imagem(ex.get("imagem"))
    with open(DESAFIOS, encoding="utf-8") as f:
        desafios = json.load(f)
    for d in desafios["desafios"]:
        do_imagem(d.get("imagem"))
    return ids


def origem_de(vinho_id):
    for ext in ("webp", "jpg", "jpeg", "png"):
        p = os.path.join(IMG_DIR, "{}.{}".format(vinho_id, ext))
        if os.path.exists(p):
            return p
    return None


def converter(src, dst):
    with Image.open(src) as im:
        # transparencia vira fundo branco (nunca preto), padrao de foto de produto
        if im.mode in ("P", "LA", "RGBA") or "transparency" in im.info:
            im = im.convert("RGBA")
            fundo = Image.new("RGB", im.size, (255, 255, 255))
            fundo.paste(im, mask=im.split()[-1])
            im = fundo
        else:
            im = im.convert("RGB")
        if im.width > LARGURA:
            alt = round(im.height * LARGURA / im.width)
            im = im.resize((LARGURA, alt), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALIDADE, method=6)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    ids = sorted(ids_referenciados())
    print("Imagens referenciadas no bundle + desafios: {}".format(len(ids)))

    convertidas = pulada = 0
    falhas = []
    for vid in ids:
        src = origem_de(vid)
        dst = os.path.join(OUT_DIR, vid + ".webp")
        if not src:
            falhas.append((vid, "origem_ausente"))
            continue
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            pulada += 1
            continue
        try:
            converter(src, dst)
            convertidas += 1
        except Exception as e:  # imagem corrompida etc.
            falhas.append((vid, str(e)[:80]))

    # remove webp orfaos (rotulos que sairam do bundle em re-execucoes)
    orfas = 0
    validos = set(ids)
    for fn in os.listdir(OUT_DIR):
        if fn.endswith(".webp") and fn[:-5] not in validos:
            os.remove(os.path.join(OUT_DIR, fn))
            orfas += 1

    arquivos = [os.path.join(OUT_DIR, f) for f in os.listdir(OUT_DIR) if f.endswith(".webp")]
    peso = sum(os.path.getsize(p) for p in arquivos)
    peso_mb = peso / (1024.0 * 1024.0)
    media_kb = (peso / 1024.0 / len(arquivos)) if arquivos else 0.0

    stats = {
        "total": len(arquivos),
        "convertidas_agora": convertidas,
        "puladas_ja_existiam": pulada,
        "orfas_removidas": orfas,
        "falhas": len(falhas),
        "peso_mb": round(peso_mb, 2),
        "media_kb": round(media_kb, 1),
        "largura": LARGURA,
        "qualidade": QUALIDADE,
    }
    with open(STATS, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print("Convertidas agora: {} · puladas (ja ok): {} · orfas removidas: {}".format(
        convertidas, pulada, orfas))
    if falhas:
        print("Falhas ({}):".format(len(falhas)))
        for vid, motivo in falhas[:10]:
            print("  -", vid, motivo)
    print("Total em app/public/rotulos: {} arquivos · {:.2f} MB (alvo < 8 MB) · media {:.1f} KB".format(
        len(arquivos), peso_mb, media_kb))
    alvo = "OK" if peso_mb < 8 else "ESTOUROU"
    print("Alvo de peso: {}".format(alvo))


if __name__ == "__main__":
    main()
