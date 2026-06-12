# -*- coding: utf-8 -*-
"""Recontagem independente da distribuicao de preco do bundle (verificacao C3)."""
import csv
import json
from collections import Counter

precos = {}
with open('data/vinhos_clean.csv', encoding='utf-8-sig', newline='') as f:
    for row in csv.DictReader(f):
        try:
            precos[row['id']] = float(row['preco_referencia'])
        except (ValueError, KeyError):
            pass

banco = json.load(open('app/src/content/pratica/banco-pratica.json', encoding='utf-8'))
exs = banco['exercicios'] if isinstance(banco, dict) else banco
faixas = Counter()
pordif = {}
for e in exs:
    vid = e.get('vinhoId')
    d = e['dificuldade']
    if not vid or vid not in precos:
        faixas['sem-vinho'] += 1
        continue
    p = precos[vid]
    fx = '<30' if p < 30 else '30-80' if p <= 80 else '80-150' if p <= 150 else '>150'
    faixas[fx] += 1
    pordif.setdefault(d, Counter())[fx] += 1

n = len(exs)
pct = faixas['30-80'] / n * 100
print('total:', n, '| 30-80:', faixas['30-80'], '({:.1f}%)'.format(pct), '| >150:', faixas['>150'], '| sem-vinho:', faixas['sem-vinho'])
for d in sorted(pordif):
    print(' dif', d, dict(pordif[d]))

hab = Counter(e['habilidade'] for e in exs)
print('habilidade max %:', round(max(hab.values()) / n * 100, 1))

des = json.load(open('app/src/content/pratica/desafios.json', encoding='utf-8'))
dp = sorted(precos[d['vinhoId']] for d in des['desafios'] if d['vinhoId'] in precos)
ok = sum(1 for p in dp if 30 <= p <= 150)
print('desafios em 30-150:', ok, '/', len(dp), '| min:', dp[0], '| mediana:', dp[len(dp) // 2], '| max:', dp[-1])

assert pct >= 45, 'meta C3 nao atingida'
assert max(hab.values()) / n <= 0.40, 'cap de habilidade estourado'
assert ok == len(dp), 'desafio fora da faixa de gondola'
print('VERIFICACAO C3: OK')
