/**
 * Features de aprendizado da F2.5: dica por cristais (debito de 10) e
 * micro-aula da unidade (XP 5, uma vez por unidade, persistido).
 */
import { describe, expect, it } from 'vitest';
import { criarStore } from '../store';
import { CRISTAIS_BOAS_VINDAS, PRECOS_LOJA, XP_MICRO_AULA } from '../economia';
import { memStorage, ts } from './fixtures';

const T0 = ts(2026, 6, 10, 9);

describe('dica por cristais', () => {
  it('usarDica debita exatamente o preco da loja (10)', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    expect(store.getWallet().cristais).toBe(CRISTAIS_BOAS_VINDAS);
    expect(store.usarDica()).toBe(true);
    expect(store.getWallet().cristais).toBe(CRISTAIS_BOAS_VINDAS - PRECOS_LOJA.dica);
  });

  it('sem saldo a dica nao debita e retorna false', () => {
    const storage = memStorage();
    const store = criarStore({ storage, agora: () => T0 });
    // gasta as boas-vindas inteiras: 6 dicas de 10
    for (let i = 0; i < 6; i++) expect(store.usarDica()).toBe(true);
    expect(store.getWallet().cristais).toBe(0);
    expect(store.usarDica()).toBe(false);
    expect(store.getWallet().cristais).toBe(0);
  });

  it('o debito persiste no tp.v1', () => {
    const storage = memStorage();
    const a = criarStore({ storage, agora: () => T0 });
    a.usarDica();
    const b = criarStore({ storage, agora: () => T0 });
    expect(b.getWallet().cristais).toBe(CRISTAIS_BOAS_VINDAS - PRECOS_LOJA.dica);
  });
});

describe('micro-aula da unidade', () => {
  it('paga XP 5 uma unica vez por unidade', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    expect(store.concluirMicroAula('u1')).toBe(XP_MICRO_AULA);
    expect(store.getWallet().xpTotal).toBe(5);
    // reassistir a mesma unidade nao paga de novo
    expect(store.concluirMicroAula('u1')).toBeNull();
    expect(store.getWallet().xpTotal).toBe(5);
    // outra unidade paga
    expect(store.concluirMicroAula('u2')).toBe(XP_MICRO_AULA);
    expect(store.getWallet().xpTotal).toBe(10);
  });

  it('persiste as unidades pagas no tp.v1 (forward-compat na migracao)', () => {
    const storage = memStorage();
    const a = criarStore({ storage, agora: () => T0 });
    a.concluirMicroAula('u3');
    const b = criarStore({ storage, agora: () => T0 });
    expect(b.concluirMicroAula('u3')).toBeNull();
    expect(b.getEstado().microAulas).toEqual(['u3']);
  });

  it('estado antigo sem o campo microAulas migra com lista vazia', () => {
    const storage = memStorage();
    storage.setItem('tp.v1', JSON.stringify({ versao: 1, onboardingCompleto: true }));
    const store = criarStore({ storage, agora: () => T0 });
    expect(store.getEstado().microAulas).toEqual([]);
    expect(store.concluirMicroAula('u1')).toBe(XP_MICRO_AULA);
  });

  it('XP da micro-aula conta para a meta diaria (cristais ao cruzar)', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    store.definirMetaDiaria(5);
    const antes = store.getWallet().cristais;
    store.concluirMicroAula('u1'); // 5 cruza a meta de 5
    expect(store.getWallet().cristais).toBe(antes + 10);
  });
});
