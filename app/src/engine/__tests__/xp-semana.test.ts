/**
 * Placar semanal da Mesa: xpSemana (XP da semana ISO corrente) e o rollover semanal.
 * Garante que o XP de semanas anteriores NAO vaza pra semana nova (o bug do ranking).
 */
import { describe, expect, it } from 'vitest';
import { criarStore, estadoInicial } from '../store';
import { mesclarEstado } from '../merge';
import { semanaIso, MS_DIA } from '../tempo';
import type { EstadoV1, Wallet } from '../types';
import { memStorage, relogio, ts } from './fixtures';

describe('semanaIso (semana ISO em America/Sao_Paulo)', () => {
  it('bate com o servidor: 30/06/2026 = 2026-W27', () => {
    expect(semanaIso(Date.UTC(2026, 5, 30, 15))).toBe('2026-W27');
  });
  it('formato IYYY-Www com 2 digitos', () => {
    expect(semanaIso(Date.UTC(2026, 0, 5, 15))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('xpSemana acumula e reseta', () => {
  it('soma o XP da semana (varias fontes) e ZERA ao virar a semana; total preservado', () => {
    const r = relogio(ts(2026, 6, 8, 12));
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const semInicial = store.getWallet().semanaXp;

    store.concluirDesafioDia('2026-06-08'); // +30 (avulso)
    store.concluirMicroAula('u1'); // +5 (avulso)
    expect(store.getWallet().xpSemana).toBe(35);

    // 14 dias depois: outra semana ISO com certeza
    r.ir(ts(2026, 6, 22, 12));
    store.concluirDesafioDia('2026-06-22'); // +30 na semana nova
    const w = store.getWallet();
    expect(w.semanaXp).not.toBe(semInicial);
    expect(w.xpSemana).toBe(30); // zerou; conta SO o novo (XP antigo nao vaza)
    expect(w.xpTotal).toBe(65); // total acumula tudo
  });

  it('estado LEGADO (sem xpSemana/semanaXp) migra com xpSemana=0 na semana corrente; total intacto', () => {
    // Transicao do rollout: cliente antigo -> novo. O placar da semana recomeca do 0
    // (subcontagem transitoria de 1 semana, aceita), mas o xp_total NUNCA e perdido.
    const storage = memStorage();
    const agora = Date.UTC(2026, 5, 30, 15); // 2026-W27
    storage.setItem('tp.v1', JSON.stringify({ versao: 1, wallet: { xpTotal: 200, xpHoje: 40, dataHoje: '2026-06-30' } }));
    const store = criarStore({ storage, agora: () => agora });
    const w = store.getWallet();
    expect(w.semanaXp).toBe('2026-W27');
    expect(w.xpSemana).toBe(0);
    expect(w.xpTotal).toBe(200);
  });

  it('reabrir numa semana nova zera o xpSemana no sincronizar (sem novo XP)', () => {
    const storage = memStorage();
    const r = relogio(ts(2026, 6, 8, 12));
    const a = criarStore({ storage, agora: r.agora });
    a.concluirDesafioDia('2026-06-08');
    expect(a.getWallet().xpSemana).toBe(30);

    r.ir(ts(2026, 6, 22, 12));
    const b = criarStore({ storage, agora: r.agora });
    b.sincronizar();
    expect(b.getWallet().xpSemana).toBe(0);
    expect(b.getWallet().xpTotal).toBe(30); // total intacto
  });
});

describe('merge do xpSemana (multi-aparelho)', () => {
  const AGORA = Date.UTC(2026, 5, 30, 15);
  const semA = semanaIso(AGORA);
  const semB = semanaIso(AGORA - 7 * MS_DIA);
  const base = (o: Partial<Wallet>): EstadoV1 => {
    const e = estadoInicial(AGORA);
    return { ...e, wallet: { ...e.wallet, ...o } };
  };

  it('mesma semana: fica com o maior xpSemana', () => {
    const m = mesclarEstado(base({ semanaXp: semA, xpSemana: 40 }), base({ semanaXp: semA, xpSemana: 10 }), AGORA);
    expect(m.wallet.xpSemana).toBe(40);
  });

  it('semanas diferentes: vence a mais recente; o XP da semana antiga NAO vaza', () => {
    const m = mesclarEstado(base({ semanaXp: semB, xpSemana: 200 }), base({ semanaXp: semA, xpSemana: 10 }), AGORA);
    expect(m.wallet.semanaXp).toBe(semA);
    expect(m.wallet.xpSemana).toBe(10);
  });
});
