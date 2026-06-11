import { describe, expect, it } from 'vitest';
import { INTERVALOS_REVISAO_DIAS, proximaRevisaoTs, revisoesVencidas } from '../revisao';
import type { ProgressoLicao } from '../types';
import { MS_DIA } from '../tempo';
import { ts } from './fixtures';

const T0 = ts(2026, 6, 11, 9);

describe('agenda de revisao espacada D+1, D+3, D+7, D+21', () => {
  it('escada por conclusao: 1a D+1, 2a D+3, 3a D+7, 4a em diante D+21', () => {
    expect(INTERVALOS_REVISAO_DIAS).toEqual([1, 3, 7, 21]);
    expect(proximaRevisaoTs(1, T0)).toBe(T0 + 1 * MS_DIA);
    expect(proximaRevisaoTs(2, T0)).toBe(T0 + 3 * MS_DIA);
    expect(proximaRevisaoTs(3, T0)).toBe(T0 + 7 * MS_DIA);
    expect(proximaRevisaoTs(4, T0)).toBe(T0 + 21 * MS_DIA);
    expect(proximaRevisaoTs(12, T0)).toBe(T0 + 21 * MS_DIA); // trava no D+21
  });
});

describe('selecao de revisoes vencidas', () => {
  function prog(proximaRevisao: number | null): ProgressoLicao {
    return { coroas: 1, vezesConcluida: 1, ultimaConclusao: T0, proximaRevisao, errosPendentes: [] };
  }

  it('retorna so as vencidas, da mais atrasada para a mais recente', () => {
    const progresso = {
      'u1-l1': prog(T0 - 2 * MS_DIA),
      'u1-l2': prog(T0 - 5 * MS_DIA),
      'u1-l3': prog(T0 + MS_DIA), // ainda nao venceu
      'u1-l4': prog(null), // nunca concluida
      'u1-l5': prog(T0), // vence exatamente agora
    };
    expect(revisoesVencidas(progresso, T0)).toEqual(['u1-l2', 'u1-l1', 'u1-l5']);
  });

  it('sem nada vencido retorna vazio', () => {
    expect(revisoesVencidas({ 'u1-l1': prog(T0 + MS_DIA) }, T0)).toEqual([]);
    expect(revisoesVencidas({}, T0)).toEqual([]);
  });
});
