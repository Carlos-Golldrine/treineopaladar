import { describe, expect, it } from 'vitest';
import {
  MAX_REINSERCOES,
  aplicarPaladar,
  decairPaladar,
  exercicioAtual,
  finalizarSessao,
  indiceAtual,
  iniciarSessao,
  responder,
  sessaoConcluida,
} from '../sessao';
import type { Sessao } from '../sessao';
import { MS_SEMANA } from '../tempo';
import { licaoFixture, ts } from './fixtures';

const licao = licaoFixture();
const T0 = ts(2026, 6, 11, 9);
const semCap = { licoesConcluidasHoje: 0, isentoD0: false };

function jogarTudo(s: Sessao, certo: (indice: number, vez: number) => boolean): Sessao {
  const vezes: Record<number, number> = {};
  let atual = s;
  while (!sessaoConcluida(atual)) {
    const i = indiceAtual(atual)!;
    vezes[i] = (vezes[i] ?? 0) + 1;
    atual = responder(atual, certo(i, vezes[i]), licao).sessao;
  }
  return atual;
}

describe('fila da sessao', () => {
  it('segue a ordem do JSON da licao', () => {
    const s = iniciarSessao(licao, 'nova', T0);
    expect(s.fila).toEqual([0, 1, 2, 3]);
    expect(exercicioAtual(s, licao)).toBe(licao.exercicios[0]);
  });

  it('errosPendentes da sessao anterior voltam primeiro, sem duplicar', () => {
    const s = iniciarSessao(licao, 'nova', T0, [2, 2, 99]);
    expect(s.fila).toEqual([2, 0, 1, 3]);
  });
});

describe('reinsercao de errados (max 2 por exercicio)', () => {
  it('errado volta para o fim da fila', () => {
    const s = iniciarSessao(licao, 'nova', T0);
    const efeito = responder(s, false, licao);
    expect(efeito.reinserido).toBe(true);
    expect(efeito.sessao.fila).toEqual([0, 1, 2, 3, 0]);
  });

  it('depois de 2 reinsercoes o exercicio nao volta mais', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    let e = responder(s, false, licao); // erro 1: reinsere
    expect(e.reinserido).toBe(true);
    s = jogarTudo(e.sessao, (i, vez) => !(i === 0 && vez <= MAX_REINSERCOES));
    // exercicio 0 errou 3 vezes (1 original + 2 reinsercoes) e parou de voltar
    expect(s.fila.filter((i) => i === 0)).toHaveLength(3);
    expect(sessaoConcluida(s)).toBe(true);
  });

  it('quem termina errado vira errosPendentes; quem corrige sai da lista', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    // erra o 0 uma vez e acerta na volta; erra o 3 sempre
    s = jogarTudo(s, (i, vez) => {
      if (i === 0) return vez > 1;
      return i !== 3;
    });
    const r = finalizarSessao(s, T0 + 60_000, semCap);
    expect(r.errosPendentes).toEqual([3]);
  });
});

describe('grace do primeiro erro', () => {
  it('primeiro erro nao custa vida, segundo custa', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    const e1 = responder(s, false, licao);
    expect(e1.custouVida).toBe(false);
    s = e1.sessao;
    const e2 = responder(s, false, licao);
    expect(e2.custouVida).toBe(true);
  });

  it('acertos nunca custam vida', () => {
    const s = iniciarSessao(licao, 'nova', T0);
    expect(responder(s, true, licao).custouVida).toBe(false);
  });
});

describe('resultado: perfeita vs nao, XP, cristais, duracao', () => {
  it('sessao perfeita: 25 XP, 7 cristais, perfeita true', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    s = jogarTudo(s, () => true);
    const r = finalizarSessao(s, T0 + 90_000, semCap);
    expect(r).toMatchObject({ acertos: 4, erros: 0, perfeita: true, xp: 25, cristais: 7 });
    expect(r.duracao).toBe(90_000);
    expect(r.errosPendentes).toEqual([]);
  });

  it('com erro corrigido: 20 XP, 5 cristais, perfeita false', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    s = jogarTudo(s, (i, vez) => !(i === 1 && vez === 1));
    const r = finalizarSessao(s, T0 + 120_000, semCap);
    expect(r).toMatchObject({ acertos: 4, erros: 1, perfeita: false, xp: 20, cristais: 5 });
    expect(r.errosPendentes).toEqual([]); // corrigiu na volta
  });

  it('revisao rende 10 XP integral, sem cristais, mesmo sob soft cap', () => {
    let s = iniciarSessao(licao, 'revisao', T0);
    s = jogarTudo(s, () => true);
    const r = finalizarSessao(s, T0 + 60_000, { licoesConcluidasHoje: 9, isentoD0: false });
    expect(r.xp).toBe(10);
    expect(r.cristais).toBe(0);
  });

  it('licao nova sob soft cap usa a posicao do dia', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    s = jogarTudo(s, () => true);
    expect(finalizarSessao(s, T0, { licoesConcluidasHoje: 3, isentoD0: false }).xp).toBe(13);
    expect(finalizarSessao(s, T0, { licoesConcluidasHoje: 5, isentoD0: false }).xp).toBe(6);
    expect(finalizarSessao(s, T0, { licoesConcluidasHoje: 5, isentoD0: true }).xp).toBe(25);
  });
});

describe('score de paladar', () => {
  it('sobe ponderado por dificuldade e nunca passa de 1000', () => {
    let s = iniciarSessao(licao, 'nova', T0);
    s = jogarTudo(s, () => true);
    const a = aplicarPaladar(0, s);
    // dificuldades 1+2+2+3: ganho composto sobre o gap de 1000
    expect(a).toBeGreaterThan(35);
    expect(a).toBeLessThan(45);
    // assintotico: perto do teto o ganho murcha mas nao estoura
    const b = aplicarPaladar(990, s);
    expect(b).toBeGreaterThan(990);
    expect(b).toBeLessThanOrEqual(1000);
  });

  it('decai 1% por semana cheia de inatividade (lazy)', () => {
    expect(decairPaladar(500, T0, T0 + MS_SEMANA - 1)).toBe(500);
    expect(decairPaladar(500, T0, T0 + MS_SEMANA)).toBeCloseTo(495, 5);
    expect(decairPaladar(500, T0, T0 + 3 * MS_SEMANA)).toBeCloseTo(500 * 0.99 ** 3, 5);
  });
});
