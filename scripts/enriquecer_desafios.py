# -*- coding: utf-8 -*-
"""
Enriquece app/src/content/pratica/desafios.json com o bloco `vinho`
(nome, uva, pais, faixa de preco) lido de data/vinhos_clean.csv, para a
tela de revelacao pos-conclusao do Desafio do Dia.

Idempotente: roda quantas vezes quiser, o resultado e o mesmo.
Todo fato vem do banco; nenhum texto e inventado.
"""
import csv
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
CSV = RAIZ / "data" / "vinhos_clean.csv"
DESAFIOS = RAIZ / "app" / "src" / "content" / "pratica" / "desafios.json"

# Faixas de preco amigaveis (derivadas do preco_referencia do banco)
def faixa_preco(preco: float) -> str:
    if preco <= 40:
        return "ate R$ 40"
    if preco <= 80:
        return "R$ 40 a 80"
    if preco <= 150:
        return "R$ 80 a 150"
    if preco <= 300:
        return "R$ 150 a 300"
    return "acima de R$ 300"


def limpar_nome(nome: str) -> str:
    """Tira sufixos de volume do nome de e-commerce (750ml, 375 ml, 1,5L)."""
    nome = re.sub(r"\s*\d+(?:[.,]\d+)?\s*(?:ml|l|litros?)\s*$", "", nome, flags=re.I)
    return nome.strip()


def titulo_uva(uva: str) -> str:
    """Normaliza capitalizacao de uva vinda em caixa baixa do banco."""
    if not uva:
        return ""
    if uva != uva.lower():
        return uva  # ja veio capitalizada do banco
    minusculas = {"de", "da", "do", "e", "di", "del", "la", "le"}
    palavras = []
    for i, p in enumerate(uva.split()):
        palavras.append(p if (i > 0 and p in minusculas) else p.capitalize())
    return " ".join(palavras)


def main() -> None:
    vinhos = {}
    with open(CSV, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            vinhos[row["id"]] = row

    dados = json.loads(DESAFIOS.read_text(encoding="utf-8"))
    for desafio in dados["desafios"]:
        v = vinhos[desafio["vinhoId"]]
        preco = float(v["preco_referencia"])
        uva_card = titulo_uva(v["uva_principal"])
        # A pergunta de uva usa o nome canonico da fabrica (ex. Tempranillo);
        # se o CSV traz um sinonimo (ex. Aragonez), o card mostra os dois para
        # nao contradizer a resposta que a pessoa acabou de dar (auditoria f2).
        for q in desafio["perguntas"]:
            if "uva principal" in q["pergunta"]:
                canonica = q["opcoes"][q["correta"]]
                if canonica.casefold() != uva_card.casefold():
                    uva_card = f"{uva_card} ({canonica})"
                break
        desafio["vinho"] = {
            "nome": limpar_nome(v["nome"]),
            "uva": uva_card,
            "pais": v["pais"],
            "faixaPreco": faixa_preco(preco),
        }

    texto = json.dumps(dados, ensure_ascii=False, indent=1)
    # Auditoria de copy: sem travessao no que acabou de entrar
    assert "–" not in texto and "—" not in texto, "travessao detectado"
    DESAFIOS.write_text(texto + "\n", encoding="utf-8")
    print(f"ok: {len(dados['desafios'])} desafios enriquecidos com bloco vinho")


if __name__ == "__main__":
    main()
