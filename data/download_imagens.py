# -*- coding: utf-8 -*-
"""
Downloader standalone das imagens de rotulo — Treine seu Paladar.

Le data/imagens_manifest.csv (id, url, ext) e baixa para data/imagens/{id}.{ext}.
- Concorrencia 8 (ThreadPoolExecutor)
- Timeout 20s, 2 retries com backoff exponencial
- User-Agent de navegador
- Resume: pula ids que ja tem arquivo em data/imagens/ (qualquer extensao)
- Valida Content-Type image/* e tamanho > 2KB
- Falhas em data/imagens_falhas.csv; progresso a cada 200

Uso:
  python download_imagens.py              # download completo (resume)
  python download_imagens.py --limit 10   # teste (tambem grava imagens_teste_resultado.json)
"""
import argparse
import csv
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

BASE = Path(__file__).resolve().parent  # .../data
MANIFEST = BASE / "imagens_manifest.csv"
DEST = BASE / "imagens"
FALHAS = BASE / "imagens_falhas.csv"
TESTE_JSON = BASE / "imagens_teste_resultado.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.7",
}

CT_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
}

MIN_BYTES = 2048
TIMEOUT = 20
RETRIES = 2  # tentativas extras alem da primeira
CONCORRENCIA = 8
PROGRESSO_A_CADA = 200

_lock = threading.Lock()
_contadores = {"ok": 0, "falha": 0, "pulada": 0, "feitas": 0}
_falhas_rows = []

_session_local = threading.local()


def get_session():
    if not hasattr(_session_local, "s"):
        s = requests.Session()
        s.headers.update(HEADERS)
        _session_local.s = s
    return _session_local.s


def ja_existe(vid):
    return any(DEST.glob(f"{vid}.*"))


def baixar(item):
    vid, url, ext = item["id"], item["url"], (item.get("ext") or "jpg").lower()
    if ja_existe(vid):
        return ("pulada", vid, url, "")
    ultimo_erro = ""
    for tentativa in range(RETRIES + 1):
        try:
            r = get_session().get(url, timeout=TIMEOUT, stream=False)
            if r.status_code != 200:
                ultimo_erro = f"http {r.status_code}"
            else:
                ct = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                if not ct.startswith("image/"):
                    ultimo_erro = f"content-type nao-imagem: {ct or 'vazio'}"
                elif len(r.content) <= MIN_BYTES:
                    ultimo_erro = f"arquivo pequeno demais ({len(r.content)} bytes)"
                else:
                    ext_final = CT_EXT.get(ct, ext)
                    destino = DEST / f"{vid}.{ext_final}"
                    destino.write_bytes(r.content)
                    return ("ok", vid, url, "")
        except requests.RequestException as e:
            ultimo_erro = f"{type(e).__name__}: {e}"
        if tentativa < RETRIES:
            time.sleep(1.5 * (2 ** tentativa))  # backoff 1.5s, 3s
    return ("falha", vid, url, ultimo_erro)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="baixar apenas N itens (teste)")
    args = ap.parse_args()

    if not MANIFEST.exists():
        print(f"ERRO: manifest nao encontrado: {MANIFEST}", file=sys.stderr)
        sys.exit(1)
    DEST.mkdir(parents=True, exist_ok=True)

    with open(MANIFEST, encoding="utf-8-sig", newline="") as f:
        itens = list(csv.DictReader(f))
    total_manifest = len(itens)
    if args.limit:
        itens = itens[: args.limit]

    print(f"Manifest: {total_manifest} | nesta execucao: {len(itens)} | destino: {DEST}")
    inicio = time.time()

    with ThreadPoolExecutor(max_workers=CONCORRENCIA) as ex:
        futuros = [ex.submit(baixar, it) for it in itens]
        for fut in as_completed(futuros):
            status, vid, url, erro = fut.result()
            with _lock:
                _contadores[status if status != "ok" else "ok"] += 1
                _contadores["feitas"] += 1
                if status == "falha":
                    _falhas_rows.append({"id": vid, "url": url, "erro": erro})
                if _contadores["feitas"] % PROGRESSO_A_CADA == 0:
                    c = _contadores
                    taxa = c["feitas"] / max(time.time() - inicio, 1)
                    print(
                        f"[{c['feitas']}/{len(itens)}] ok={c['ok']} "
                        f"falha={c['falha']} pulada={c['pulada']} ({taxa:.1f}/s)",
                        flush=True,
                    )

    c = _contadores
    print(f"FIM: ok={c['ok']} falha={c['falha']} pulada={c['pulada']} "
          f"em {time.time() - inicio:.0f}s")

    if _falhas_rows:
        novo = not FALHAS.exists()
        with open(FALHAS, "a", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["id", "url", "erro"])
            if novo:
                w.writeheader()
            w.writerows(_falhas_rows)
        print(f"Falhas registradas em {FALHAS}")

    if args.limit:
        resumo = {
            "tentadas": len(itens),
            "ok": c["ok"],
            "falhas": c["falha"],
            "puladas": c["pulada"],
            "detalhe": "; ".join(f"{r['id']}: {r['erro']}" for r in _falhas_rows) or "todas baixadas com sucesso",
        }
        TESTE_JSON.write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Resumo do teste salvo em {TESTE_JSON}")


if __name__ == "__main__":
    main()
