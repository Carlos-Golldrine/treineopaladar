# -*- coding: utf-8 -*-
"""
Processa a logo oficial (logo/logo_tchin.jpg, fundo branco) em assets do app:
  - app/public/marca/logo-tchin.png        (lockup completo, fundo transparente)
  - app/public/marca/logo-tchin-glifo.png  (so as tacas, sem wordmark)
  - app/public/icons/icon-192.png, icon-512.png, icon-maskable-192/512.png,
    apple-touch-icon.png (glifo real sobre #FAFAF8)
Idempotente. Fonte nunca e alterada.
"""
from pathlib import Path

from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parents[1]
FONTE = RAIZ / "logo" / "logo_tchin.jpg"
MARCA = RAIZ / "app" / "public" / "marca"
ICONS = RAIZ / "app" / "public" / "icons"
MARCA.mkdir(parents=True, exist_ok=True)

BG = (250, 250, 248, 255)  # --bg #FAFAF8


def com_alpha(img: Image.Image) -> Image.Image:
    """Fundo branco -> transparente, com alpha suave na borda do tracado."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum = (r + g + b) / 3
            if lum >= 246:
                px[x, y] = (r, g, b, 0)
            elif lum >= 200:
                # transicao: quanto mais claro, mais transparente (mata o halo)
                a = int(255 * (246 - lum) / 46)
                px[x, y] = (r, g, b, a)
    return rgba


def recortar(img: Image.Image, pad: int = 8) -> Image.Image:
    caixa = img.getbbox()
    if not caixa:
        return img
    l, t, r, b = caixa
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))


def quadrado(img: Image.Image) -> Image.Image:
    lado = max(img.size)
    base = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    base.paste(img, ((lado - img.width) // 2, (lado - img.height) // 2), img)
    return base


def icone(glifo: Image.Image, lado: int, ocupacao: float, destino: Path) -> None:
    base = Image.new("RGBA", (lado, lado), BG)
    alvo = int(lado * ocupacao)
    g = quadrado(glifo).resize((alvo, alvo), Image.LANCZOS)
    base.paste(g, ((lado - alvo) // 2, (lado - alvo) // 2), g)
    base.convert("RGB").save(destino, "PNG")
    print(f"  {destino.relative_to(RAIZ)}")


def main() -> None:
    bruto = Image.open(FONTE)
    cheio = recortar(com_alpha(bruto))
    cheio.save(MARCA / "logo-tchin.png")
    print(f"  {(MARCA / 'logo-tchin.png').relative_to(RAIZ)}  {cheio.size}")

    # Glifo = parte de cima (tacas). O wordmark comeca no vale horizontal de
    # alpha entre as tacas e o texto; achamos a linha vazia mais baixa.
    colunas_alpha = [
        sum(cheio.getpixel((x, y))[3] for x in range(0, cheio.width, 4))
        for y in range(cheio.height)
    ]
    vazias = [y for y, soma in enumerate(colunas_alpha) if soma == 0]
    meio = cheio.height // 2
    corte = min((y for y in vazias if y > meio), default=meio)
    glifo = recortar(cheio.crop((0, 0, cheio.width, corte)))
    glifo = glifo.filter(ImageFilter.SMOOTH_MORE)
    glifo.save(MARCA / "logo-tchin-glifo.png")
    print(f"  {(MARCA / 'logo-tchin-glifo.png').relative_to(RAIZ)}  {glifo.size}")

    icone(glifo, 192, 0.72, ICONS / "icon-192.png")
    icone(glifo, 512, 0.72, ICONS / "icon-512.png")
    icone(glifo, 192, 0.56, ICONS / "icon-maskable-192.png")
    icone(glifo, 512, 0.56, ICONS / "icon-maskable-512.png")
    icone(glifo, 180, 0.72, ICONS / "apple-touch-icon.png")


if __name__ == "__main__":
    main()
