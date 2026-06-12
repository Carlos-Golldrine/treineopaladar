# -*- coding: utf-8 -*-
"""Gera os icones da PWA em app/public/icons/ com a taca-personagem do mascote.

Desenho fiel ao TchinDuo (src/onboarding/Mascote.tsx): duas tacas brindando
com faisca de ouro, sobre fundo wine-700. Ainda PROVISORIO de marca (trocar
quando a logo oficial do Gabriel entrar), mas com cara de produto.

Uso: python src/icones/gen-icone-app.py  (a partir da raiz do app)
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

# Paleta travada do brief
WINE_700 = (114, 47, 55, 255)   # fundo do icone
WINE_900 = (74, 31, 36, 255)    # vinho dentro da taca (profundidade)
GOLD_500 = (212, 165, 116, 255) # faisca do brinde
CREAM = (250, 250, 248, 255)    # traco das tacas (bg do app)

S = 1024  # canvas supersample
T = 30    # espessura do traco em px no canvas 1024

OUT = Path(__file__).resolve().parent.parent.parent / "public" / "icons"


def draw_glass_layer(angle: float, cx: int, cy: int) -> Image.Image:
    """Taca upright desenhada num layer transparente, rotacionada em torno
    do proprio centro (cx, cy) e devolvida pronta para compor."""
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    # Geometria local (taca centrada em cx; topo do bojo em cy-230)
    top = cy - 230          # borda superior do bojo
    wall_bot = cy - 60      # fim da parede reta
    bowl_w = 280            # largura externa do bojo
    x0, x1 = cx - bowl_w // 2, cx + bowl_w // 2
    r_out = bowl_w // 2

    # --- bojo externo (cream) ---
    d.rectangle([x0, top, x1, wall_bot], fill=CREAM)
    d.pieslice([x0, wall_bot - r_out, x1, wall_bot + r_out], 0, 180, fill=CREAM)

    # --- miolo (vinho-900: vidro escavado) ---
    xi0, xi1 = x0 + T, x1 - T
    r_in = r_out - T
    d.rectangle([xi0, top + T, xi1, wall_bot], fill=WINE_900)
    d.pieslice([xi0, wall_bot - r_in, xi1, wall_bot + r_in], 0, 180, fill=WINE_900)

    # --- vinho (gold? nao: liquido em wine-700 nao contrasta; usa GOLD suave) ---
    # Liquido: preenche da metade do bojo para baixo em dourado (brinde de festa)
    liq_top = top + 150
    d.rectangle([xi0, liq_top, xi1, wall_bot], fill=GOLD_500)
    d.pieslice([xi0, wall_bot - r_in, xi1, wall_bot + r_in], 0, 180, fill=GOLD_500)

    # --- brilho do vidro (o "olhinho" do mascote) ---
    eye_x = cx + 86
    eye_y = top + 88
    d.ellipse([eye_x - 22, eye_y - 22, eye_x + 22, eye_y + 22], fill=CREAM)

    # --- haste ---
    stem_top = wall_bot + r_out - 8
    stem_bot = stem_top + 150
    d.rounded_rectangle([cx - T // 2, stem_top, cx + T // 2, stem_bot], radius=T // 2, fill=CREAM)

    # --- pe (arco sorridente) ---
    foot_w = 230
    d.arc(
        [cx - foot_w // 2, stem_bot - 30, cx + foot_w // 2, stem_bot + 110],
        205,
        335,
        fill=CREAM,
        width=T,
    )

    return layer.rotate(angle, resample=Image.BICUBIC, center=(cx, cy))


def star(d: ImageDraw.ImageDraw, cx: float, cy: float, R: float, r: float) -> None:
    """Faisca de 4 pontas (a do brinde do mascote)."""
    pts = []
    for i in range(8):
        rad = math.pi / 4 * i - math.pi / 2
        rr = R if i % 2 == 0 else r
        pts.append((cx + rr * math.cos(rad), cy + rr * math.sin(rad)))
    d.polygon(pts, fill=GOLD_500)


def draw_scene() -> Image.Image:
    """Cena completa (transparente): duas tacas brindando + faisca."""
    scene = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # Tacas: esquerda inclina para fora (CCW), direita espelha (eco do mascote)
    left = draw_glass_layer(+13, 372, 560)
    right = draw_glass_layer(-13, 652, 560)
    scene.alpha_composite(left)
    scene.alpha_composite(right)

    d = ImageDraw.Draw(scene)
    star(d, 512, 180, 86, 28)
    d.ellipse([292 - 16, 158 - 16, 292 + 16, 158 + 16], fill=GOLD_500)
    d.ellipse([732 - 16, 158 - 16, 732 + 16, 158 + 16], fill=GOLD_500)
    return scene


def make_icon(scene: Image.Image, path: Path, size: int, k: float) -> None:
    """Compoe a cena sobre wine-700, escalada por k em torno do centro."""
    img = Image.new("RGBA", (S, S), WINE_700)
    if k == 1.0:
        img.alpha_composite(scene)
    else:
        w = int(S * k)
        small = scene.resize((w, w), Image.LANCZOS)
        img.alpha_composite(small, ((S - w) // 2, (S - w) // 2))
    img = img.resize((size, size), Image.LANCZOS)
    img.convert("RGB").save(path, "PNG")
    print(f"ok {path.name} ({size}x{size})")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    scene = draw_scene()
    make_icon(scene, OUT / "icon-192.png", 192, 1.0)
    make_icon(scene, OUT / "icon-512.png", 512, 1.0)
    # Maskable: conteudo dentro da zona segura (~80% central)
    make_icon(scene, OUT / "icon-maskable-192.png", 192, 0.74)
    make_icon(scene, OUT / "icon-maskable-512.png", 512, 0.74)
    make_icon(scene, OUT / "apple-touch-icon.png", 180, 0.95)


if __name__ == "__main__":
    main()
