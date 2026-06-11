# -*- coding: utf-8 -*-
"""Gera os icones da PWA em public/icons/.

PLACEHOLDER DE MARCA: taca de vinho geometrica em #722F37 sobre #FAFAF8.
Substituir pela ilustracao proprietaria do mascote Tchin quando existir.

Uso: python scripts/gen-icons.py  (a partir da raiz do app)
"""
from pathlib import Path

from PIL import Image, ImageDraw

WINE = (114, 47, 55, 255)  # --wine-700
BG = (250, 250, 248, 255)  # --bg
S = 1024  # canvas de desenho (supersample, depois reduz)

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"


def draw_glass(draw: ImageDraw.ImageDraw, k: float) -> None:
    """Desenha a taca centrada, escalada por k em torno do centro do canvas."""

    def sc(v: float) -> float:
        return S / 2 + (v - S / 2) * k

    def box(x0: float, y0: float, x1: float, y1: float) -> list[float]:
        return [sc(x0), sc(y0), sc(x1), sc(y1)]

    # Bojo: parede reta + meia-circunferencia (formas limpas)
    draw.rectangle(box(312, 250, 712, 332), fill=WINE)
    draw.pieslice(box(312, 130, 712, 530), 0, 180, fill=WINE)
    # Haste
    draw.rectangle(box(492, 520, 532, 730), fill=WINE)
    # Base
    draw.rounded_rectangle(box(362, 730, 662, 774), radius=22 * k, fill=WINE)


def make_icon(path: Path, size: int, k: float) -> None:
    img = Image.new("RGBA", (S, S), BG)
    draw_glass(ImageDraw.Draw(img), k)
    img = img.resize((size, size), Image.LANCZOS)
    img.convert("RGB").save(path, "PNG")
    print(f"ok {path.name} ({size}x{size})")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_icon(OUT / "icon-192.png", 192, 1.0)
    make_icon(OUT / "icon-512.png", 512, 1.0)
    # Maskable: conteudo dentro da zona segura (~80% central)
    make_icon(OUT / "icon-maskable-192.png", 192, 0.70)
    make_icon(OUT / "icon-maskable-512.png", 512, 0.70)
    make_icon(OUT / "apple-touch-icon.png", 180, 0.92)


if __name__ == "__main__":
    main()
