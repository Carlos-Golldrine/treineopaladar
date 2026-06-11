import { describe, expect, it } from 'vitest';
import { registrarDiaConcluido, streakEfetivo, streakEmRisco } from '../streak';
import type { EstadoStreak } from '../streak';
import { ts } from './fixtures';

const base: EstadoStreak = { streak: 0, bestStreak: 0, freezes: 0, lastDone: null };

describe('streak: dia com >= 1 licao concluida', () => {
  it('primeiro dia vira streak 1 e e idempotente no mesmo dia', () => {
    let e = registrarDiaConcluido(base, ts(2026, 6, 1));
    expect(e.streak).toBe(1);
    e = registrarDiaConcluido(e, ts(2026, 6, 1, 22));
    expect(e.streak).toBe(1);
  });

  it('dias consecutivos somam e atualizam bestStreak', () => {
    let e = registrarDiaConcluido(base, ts(2026, 6, 1));
    e = registrarDiaConcluido(e, ts(2026, 6, 2));
    e = registrarDiaConcluido(e, ts(2026, 6, 3));
    expect(e.streak).toBe(3);
    expect(e.bestStreak).toBe(3);
  });

  it('1 dia pulado sem freeze quebra (recomeca em 1), bestStreak preservado', () => {
    let e = registrarDiaConcluido(base, ts(2026, 6, 1));
    e = registrarDiaConcluido(e, ts(2026, 6, 2));
    e = registrarDiaConcluido(e, ts(2026, 6, 4)); // pulou dia 3
    expect(e.streak).toBe(1);
    expect(e.bestStreak).toBe(2);
  });

  it('1 dia pulado com freeze equipado salva e consome 1', () => {
    let e: EstadoStreak = { streak: 5, bestStreak: 5, freezes: 2, lastDone: '2026-06-01' };
    e = registrarDiaConcluido(e, ts(2026, 6, 3)); // pulou dia 2
    expect(e.streak).toBe(6);
    expect(e.freezes).toBe(1);
  });

  it('2 dias pulados quebram mesmo com freeze', () => {
    let e: EstadoStreak = { streak: 5, bestStreak: 5, freezes: 3, lastDone: '2026-06-01' };
    e = registrarDiaConcluido(e, ts(2026, 6, 4)); // pulou dias 2 e 3
    expect(e.streak).toBe(1);
    expect(e.freezes).toBe(3); // freeze nao e desperdicado em quebra
  });
});

describe('streakEfetivo (leitura, sem mutar)', () => {
  it('mostra o streak ontem/hoje, segura com freeze e zera quando quebrou', () => {
    const e: EstadoStreak = { streak: 4, bestStreak: 4, freezes: 0, lastDone: '2026-06-10' };
    expect(streakEfetivo(e, ts(2026, 6, 10))).toBe(4);
    expect(streakEfetivo(e, ts(2026, 6, 11))).toBe(4); // ainda da para manter hoje
    expect(streakEfetivo(e, ts(2026, 6, 12))).toBe(0); // pulou ontem sem freeze
    expect(streakEfetivo({ ...e, freezes: 1 }, ts(2026, 6, 12))).toBe(4); // freeze segura
    expect(streakEfetivo({ ...e, freezes: 1 }, ts(2026, 6, 13))).toBe(0); // 2 pulados: ja era
  });
});

describe('streak em risco (sem licao hoje e >= 20h local)', () => {
  const e: EstadoStreak = { streak: 3, bestStreak: 3, freezes: 0, lastDone: '2026-06-10' };

  it('antes das 20h nao esta em risco', () => {
    expect(streakEmRisco(e, ts(2026, 6, 11, 19, 59))).toBe(false);
  });

  it('a partir das 20h sem licao hoje esta em risco', () => {
    expect(streakEmRisco(e, ts(2026, 6, 11, 20))).toBe(true);
  });

  it('com licao feita hoje nunca esta em risco', () => {
    expect(streakEmRisco(e, ts(2026, 6, 10, 23))).toBe(false);
  });

  it('streak ja quebrado nao tem o que arriscar', () => {
    expect(streakEmRisco(e, ts(2026, 6, 13, 22))).toBe(false);
  });
});
