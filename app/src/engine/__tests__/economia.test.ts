import { describe, expect, it } from 'vitest';
import {
  CRISTAIS_BOAS_VINDAS,
  PRECOS_LOJA,
  cristaisDeLicao,
  ehD0,
  multiplicadorSoftCap,
  xpDeLicaoNova,
} from '../economia';
import { MS_DIA } from '../tempo';
import { ts } from './fixtures';

describe('soft cap diario (secao 3/6)', () => {
  it('licoes 1-3 do dia rendem 100%', () => {
    expect(multiplicadorSoftCap(0)).toBe(1);
    expect(multiplicadorSoftCap(1)).toBe(1);
    expect(multiplicadorSoftCap(2)).toBe(1);
    expect(xpDeLicaoNova(false, 0, false)).toBe(20);
    expect(xpDeLicaoNova(true, 2, false)).toBe(25);
  });

  it('licoes 4-5 do dia rendem 50%', () => {
    expect(multiplicadorSoftCap(3)).toBe(0.5);
    expect(multiplicadorSoftCap(4)).toBe(0.5);
    expect(xpDeLicaoNova(false, 3, false)).toBe(10);
    expect(xpDeLicaoNova(true, 4, false)).toBe(13); // 25 * 0.5 arredondado
  });

  it('da 6a licao em diante rende 25%', () => {
    expect(multiplicadorSoftCap(5)).toBe(0.25);
    expect(multiplicadorSoftCap(42)).toBe(0.25);
    expect(xpDeLicaoNova(false, 5, false)).toBe(5);
    expect(xpDeLicaoNova(true, 9, false)).toBe(6); // 25 * 0.25 arredondado
  });

  it('D0 e isento do soft cap (ativacao primeiro)', () => {
    expect(xpDeLicaoNova(false, 7, true)).toBe(20);
    expect(xpDeLicaoNova(true, 7, true)).toBe(25);
  });

  it('ehD0 compara dia local do criadoEm com o agora', () => {
    const criadoEm = ts(2026, 6, 10, 9);
    expect(ehD0(criadoEm, ts(2026, 6, 10, 23, 59))).toBe(true);
    expect(ehD0(criadoEm, criadoEm + MS_DIA)).toBe(false);
  });
});

describe('XP e cristais (secao 6)', () => {
  it('perfeita rende 25 XP e 7 cristais; normal 20 XP e 5 cristais', () => {
    expect(xpDeLicaoNova(true, 0, false)).toBe(25);
    expect(xpDeLicaoNova(false, 0, false)).toBe(20);
    expect(cristaisDeLicao(true)).toBe(7);
    expect(cristaisDeLicao(false)).toBe(5);
  });

  it('precos da loja e boas-vindas seguem a secao 6 (+ dica da F2.5)', () => {
    expect(PRECOS_LOJA).toEqual({
      freeze: 60,
      recargaVidas: 50,
      vidaAvulsa: 15,
      dobroXp: 30,
      desbloqueioUnidade: 200,
      desbloqueioModo: 300,
      dica: 10,
    });
    expect(CRISTAIS_BOAS_VINDAS).toBe(60); // paga exatamente 1 freeze
  });
});
