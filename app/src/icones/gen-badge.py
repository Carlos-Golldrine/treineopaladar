# -*- coding: utf-8 -*-
"""Gera o BADGE monocromatico da notificacao (barra de status do Android).

O Android mascara o badge pelo canal alfa: tem que ser branco + transparente,
silhueta simples. Usar o icone colorido cheio vira um QUADRADO BRANCO solido.
Aqui desenhamos so a silhueta de UMA taca, branca, em fundo transparente.

Uso: python src/icones/gen-badge.py  (a partir da raiz do app)
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

WHITE = (255, 255, 255, 255)
S = 512  # supersample
OUT = Path(__file__).resolve().parent.parent.parent / "public" / "icons"


def draw_badge() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = S // 2

    # --- bojo (cup): paredes retas + fundo arredondado, silhueta cheia ---
    top = 118
    wall_bot = 250
    half = 92
    x0, x1 = cx - half, cx + half
    d.rectangle([x0, top, x1, wall_bot], fill=WHITE)
    d.pieslice([x0, wall_bot - half, x1, wall_bot + half], 0, 180, fill=WHITE)

    # --- haste ---
    stem_top = wall_bot + half - 6
    stem_bot = stem_top + 96
    d.rounded_rectangle([cx - 12, stem_top, cx + 12, stem_bot], radius=12, fill=WHITE)

    # --- pe (base solida) ---
    foot_half = 78
    d.rounded_rectangle(
        [cx - foot_half, stem_bot - 4, cx + foot_half, stem_bot + 22], radius=13, fill=WHITE
    )
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    badge = draw_badge()
    for size in (96, 72):
        nome = "badge-mono.png" if size == 96 else f"badge-mono-{size}.png"
        badge.resize((size, size), Image.LANCZOS).save(OUT / nome, "PNG")
        print(f"ok {nome} ({size}x{size})")


if __name__ == "__main__":
    main()
