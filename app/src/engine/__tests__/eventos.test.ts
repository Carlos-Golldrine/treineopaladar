/**
 * Eventos de XP fora de sessao: checkpoint de unidade, Desafio do Dia
 * e sessao do modo pratica (drill do banco da fabrica).
 */
import { describe, expect, it } from 'vitest';
import { criarStore } from '../store';
import type { RespostaPratica } from '../store';
import { XP_CHECKPOINT, XP_DESAFIO_DIA, XP_REVISAO } from '../economia';
import { licaoFixture, memStorage, relogio, ts } from './fixtures';

const T0 = ts(2026, 6, 10, 9); // D0 da conta
const D1 = ts(2026, 6, 11, 9);

const OITO_CERTAS: RespostaPratica[] = Array.from({ length: 8 }, (_, i) => ({
  correto: true,
  dificuldade: ((i % 3) + 1) as 1 | 2 | 3,
  habilidade: i % 2 === 0 ? 'rotulo' : 'harmonizacao',
}));

describe('checkpoint de unidade', () => {
  it('paga XP 50 uma unica vez por unidade e persiste', () => {
    const storage = memStorage();
    const store = criarStore({ storage, agora: () => T0 });
    expect(store.concluirCheckpoint('u1')).toBe(XP_CHECKPOINT);
    expect(store.getWallet().xpTotal).toBe(50);
    // repetir a mesma unidade nao paga de novo
    expect(store.concluirCheckpoint('u1')).toBeNull();
    expect(store.getWallet().xpTotal).toBe(50);
    // outra unidade paga
    expect(store.concluirCheckpoint('u2')).toBe(XP_CHECKPOINT);
    expect(store.getWallet().xpTotal).toBe(100);
    // sobrevive a reload (checkpoints persistidos no tp.v1)
    const reload = criarStore({ storage, agora: () => T0 });
    expect(reload.concluirCheckpoint('u1')).toBeNull();
    expect(reload.getEstado().checkpoints).toEqual(['u1', 'u2']);
  });

  it('checkpoint cruzando a meta diaria paga os +10 cristais, uma vez', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    const antes = store.getWallet().cristais;
    store.concluirCheckpoint('u1'); // 50 cruza a meta padrao de 50
    expect(store.getWallet().cristais).toBe(antes + 10);
    store.concluirCheckpoint('u2'); // ja acima da meta: sem cristais extras
    expect(store.getWallet().cristais).toBe(antes + 10);
    expect(store.getWallet().xpHoje).toBe(100);
  });
});

describe('Desafio do Dia', () => {
  it('paga XP 30 uma vez por dia, destravando no dia seguinte', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    expect(store.concluirDesafioDia('2026-06-10')).toBe(XP_DESAFIO_DIA);
    expect(store.concluirDesafioDia('2026-06-10')).toBeNull();
    expect(store.getWallet().xpTotal).toBe(30);
    expect(store.concluirDesafioDia('2026-06-11')).toBe(XP_DESAFIO_DIA);
    expect(store.getWallet().xpTotal).toBe(60);
  });

  it('persiste o dia premiado no tp.v1', () => {
    const storage = memStorage();
    const a = criarStore({ storage, agora: () => T0 });
    a.concluirDesafioDia('2026-06-10');
    const b = criarStore({ storage, agora: () => T0 });
    expect(b.concluirDesafioDia('2026-06-10')).toBeNull();
  });
});

describe('modo pratica', () => {
  it('sessao concluida: XP 10 integral em D0, streak do dia e paladar por habilidade', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    const cristaisAntes = store.getWallet().cristais;
    const res = store.concluirPratica(OITO_CERTAS);
    expect(res.xp).toBe(XP_REVISAO);
    expect(res.acertos).toBe(8);
    expect(res.erros).toBe(0);
    expect(res.vidaRecuperada).toBe(false); // vidas ja estavam no teto
    const e = store.getEstado();
    expect(e.wallet.xpTotal).toBe(10);
    expect(e.wallet.praticasHoje).toBe(1);
    expect(e.wallet.streak).toBe(1); // pratica garante o dia
    expect(e.wallet.cristais).toBe(cristaisAntes); // pratica nao paga cristais de licao
    expect(e.scorePaladar.rotulo).toBeGreaterThan(0);
    expect(e.scorePaladar.harmonizacao).toBeGreaterThan(0);
    expect(e.scorePaladar.tanino).toBe(0);
  });

  it('soft cap proprio: fora do D0, sessoes 1-3 pagam 10, 4-5 pagam 5, 6+ pagam 3', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    r.ir(D1); // fora do D0
    const xps = Array.from({ length: 6 }, () => store.concluirPratica(OITO_CERTAS).xp);
    expect(xps).toEqual([10, 10, 10, 5, 5, 3]);
    expect(store.getWallet().praticasHoje).toBe(6);
    // rollover do dia zera o contador e o XP volta cheio
    r.ir(ts(2026, 6, 12, 9));
    expect(store.concluirPratica(OITO_CERTAS).xp).toBe(10);
    expect(store.getWallet().praticasHoje).toBe(1);
  });

  it('concluir pratica recupera 1 vida quando ha vida faltando', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    // queima 2 vidas numa licao (grace + 2 erros pagos)
    store.iniciarLicao(licaoFixture(), 'nova');
    store.responder(false); // grace
    store.responder(false); // -1
    store.responder(false); // -1
    store.abandonarSessao();
    expect(store.getWallet().vidas).toBe(3);
    const res = store.concluirPratica(OITO_CERTAS);
    expect(res.vidaRecuperada).toBe(true);
    expect(store.getWallet().vidas).toBe(4);
  });
});
