import { describe, expect, it } from 'vitest';
import { CHAVE_STORE, VERSAO_ESTADO, criarStore, estadoInicial, migrar } from '../store';
import type { TPStore } from '../store';
import { CRISTAIS_BOAS_VINDAS, META_DIARIA_PADRAO } from '../economia';
import { VIDAS_MAX } from '../vidas';
import { MS_DIA, MS_HORA } from '../tempo';
import { licaoFixture, memStorage, relogio, ts } from './fixtures';

const T0 = ts(2026, 6, 10, 9); // D0 da conta
const D1 = ts(2026, 6, 11, 9);

function jogarLicaoInteira(store: TPStore, errarUmaVez = false): void {
  let errou = false;
  while (store.getSessao() && store.getSessao()!.sessao.posicao < store.getSessao()!.sessao.fila.length) {
    if (errarUmaVez && !errou) {
      errou = true;
      store.responder(false);
    } else {
      store.responder(true);
    }
  }
}

describe('migracao do store', () => {
  it('store vazio vira estado inicial: versao 1, boas-vindas 60, 5 vidas, zero progresso', () => {
    const storage = memStorage();
    const store = criarStore({ storage, agora: () => T0 });
    const e = store.getEstado();
    expect(e.versao).toBe(VERSAO_ESTADO);
    expect(e.wallet.cristais).toBe(CRISTAIS_BOAS_VINDAS);
    expect(e.wallet.vidas).toBe(VIDAS_MAX);
    expect(e.wallet.xpTotal).toBe(0);
    expect(e.wallet.streak).toBe(0);
    expect(e.wallet.metaDiaria).toBe(META_DIARIA_PADRAO);
    expect(e.wallet.criadoEm).toBe(T0);
    expect(e.progresso).toEqual({});
    expect(e.scorePaladar.tanino).toBe(0);
    expect(e.onboardingCompleto).toBe(false);
    // ja persiste na chave tp.v1
    expect(JSON.parse(storage.dados.get(CHAVE_STORE)!).versao).toBe(1);
  });

  it('JSON corrompido e versao desconhecida recomecam do estado inicial', () => {
    expect(migrar('isso nao e um estado', T0)).toEqual(estadoInicial(T0));
    expect(migrar({ versao: 99, wallet: { cristais: 9000 } }, T0)).toEqual(estadoInicial(T0));
    const storage = memStorage();
    storage.setItem(CHAVE_STORE, '{quebrado');
    const store = criarStore({ storage, agora: () => T0 });
    expect(store.getEstado().wallet.cristais).toBe(CRISTAIS_BOAS_VINDAS);
  });

  it('estado v1 persistido sobrevive a um reload, com defaults para campos novos', () => {
    const storage = memStorage();
    const r = relogio(T0);
    const a = criarStore({ storage, agora: r.agora });
    a.iniciarLicao(licaoFixture(), 'nova');
    jogarLicaoInteira(a);
    a.finalizarLicao();
    const b = criarStore({ storage, agora: r.agora });
    expect(b.getEstado().wallet.xpTotal).toBe(25);
    expect(b.getEstado().progresso['u1-l1'].vezesConcluida).toBe(1);
  });
});

describe('fluxo de licao no store', () => {
  it('licao perfeita: XP, cristais, streak, coroa, agenda D+1 e paladar', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    store.iniciarLicao(licaoFixture(), 'nova');
    jogarLicaoInteira(store);
    const resultado = store.finalizarLicao()!;
    expect(resultado.perfeita).toBe(true);
    const e = store.getEstado();
    expect(e.wallet.xpTotal).toBe(25);
    expect(e.wallet.cristais).toBe(CRISTAIS_BOAS_VINDAS + 7);
    expect(e.wallet.streak).toBe(1);
    expect(e.wallet.licoesHoje).toBe(1);
    const p = e.progresso['u1-l1'];
    expect(p.coroas).toBe(1);
    expect(p.proximaRevisao).toBe(T0 + MS_DIA);
    expect(p.errosPendentes).toEqual([]);
    expect(e.scorePaladar.tanino).toBeGreaterThan(0);
  });

  it('grace: o primeiro erro da licao nao tira vida, o segundo tira', () => {
    const store = criarStore({ storage: memStorage(), agora: () => T0 });
    store.iniciarLicao(licaoFixture(), 'nova');
    store.responder(false);
    expect(store.getWallet().vidas).toBe(5);
    store.responder(false);
    expect(store.getWallet().vidas).toBe(4);
  });

  it('meta diaria batida da +10 cristais, uma vez so', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const licao = licaoFixture();
    // meta 50: a 2a licao perfeita cruza (25 + 25), a 3a nao paga de novo
    for (let i = 0; i < 3; i++) {
      store.iniciarLicao(licao, 'nova');
      jogarLicaoInteira(store);
      store.finalizarLicao();
    }
    // 60 boas-vindas + 3 * 7 de licao + 10 da meta (so uma vez)
    expect(store.getWallet().cristais).toBe(60 + 21 + 10);
  });

  it('soft cap por posicao do dia, com D0 isento', () => {
    const storage = memStorage();
    const r = relogio(T0);
    const store = criarStore({ storage, agora: r.agora });
    const licao = licaoFixture();

    // D0: 6 licoes perfeitas, todas a 25 XP (isencao)
    for (let i = 0; i < 6; i++) {
      store.iniciarLicao(licao, 'nova');
      jogarLicaoInteira(store);
      store.finalizarLicao();
    }
    expect(store.getWallet().xpTotal).toBe(150);

    // D1: pacing valendo: 25, 25, 25, 13, 13, 6
    r.ir(D1);
    for (let i = 0; i < 6; i++) {
      store.iniciarLicao(licao, 'nova');
      jogarLicaoInteira(store);
      store.finalizarLicao();
    }
    expect(store.getWallet().xpTotal).toBe(150 + 25 + 25 + 25 + 13 + 13 + 6);
    expect(store.getWallet().licoesHoje).toBe(6);
  });

  it('revisao: XP 10 integral, recupera 1 vida, nao conta no soft cap nem da coroa', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const licao = licaoFixture();
    store.iniciarLicao(licao, 'nova');
    jogarLicaoInteira(store);
    store.finalizarLicao();

    r.ir(D1);
    // queima 2 vidas em outra licao para ver a recuperacao
    store.iniciarLicao(licaoFixture('u1-l2'), 'nova');
    store.responder(false); // grace
    store.responder(false); // -1
    store.responder(false); // -1
    store.abandonarSessao();
    expect(store.getWallet().vidas).toBe(3);

    store.iniciarLicao(licao, 'revisao');
    jogarLicaoInteira(store);
    const res = store.finalizarLicao()!;
    expect(res.xp).toBe(10);
    expect(res.cristais).toBe(0);
    const e = store.getEstado();
    expect(e.wallet.vidas).toBe(4); // recuperou 1
    expect(e.wallet.licoesHoje).toBe(0); // revisao nao conta para o cap
    expect(e.progresso['u1-l1'].coroas).toBe(1); // coroa so em licao nova
    expect(e.progresso['u1-l1'].vezesConcluida).toBe(2);
    expect(e.progresso['u1-l1'].proximaRevisao).toBe(D1 + 3 * MS_DIA); // 2a conclusao: D+3
  });

  it('com 0 vidas, licao nova nao abre e revisao abre', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const licao = licaoFixture();
    // zera as vidas: 1 grace + 5 erros pagos
    store.iniciarLicao(licao, 'nova');
    for (let i = 0; i < 6; i++) store.responder(false);
    store.abandonarSessao();
    expect(store.getWallet().vidas).toBe(0);
    expect(store.iniciarLicao(licao, 'nova')).toBeNull();
    expect(store.iniciarLicao(licao, 'revisao')).not.toBeNull();
    // 4h depois, regen lazy devolve 1 vida e a licao nova abre de novo
    r.avancar(4 * MS_HORA);
    expect(store.iniciarLicao(licao, 'nova')).not.toBeNull();
  });

  it('errosPendentes voltam no comeco da sessao seguinte', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const licao = licaoFixture();
    store.iniciarLicao(licao, 'nova');
    // erra o exercicio 2 nas 3 chances (1 + 2 reinsercoes), acerta o resto
    let protecao = 0;
    while (store.getSessao() && protecao < 20) {
      protecao += 1;
      const ativa = store.getSessao()!;
      const indice = ativa.sessao.fila[ativa.sessao.posicao];
      if (indice === undefined) break;
      store.responder(indice !== 2);
    }
    store.finalizarLicao();
    expect(store.getEstado().progresso['u1-l1'].errosPendentes).toEqual([2]);
    const sessao = store.iniciarLicao(licao, 'nova')!;
    expect(sessao.fila).toEqual([2, 0, 1, 3]); // o errado volta primeiro
  });

  it('comprar freeze debita 60 e protege 1 dia pulado de streak', () => {
    const r = relogio(T0);
    const store = criarStore({ storage: memStorage(), agora: r.agora });
    const licao = licaoFixture();
    expect(store.comprar('freeze')).toBe(true);
    expect(store.getWallet().cristais).toBe(0);
    expect(store.getWallet().freezes).toBe(1);
    expect(store.comprar('freeze')).toBe(false); // sem saldo

    store.iniciarLicao(licao, 'nova');
    jogarLicaoInteira(store);
    store.finalizarLicao();
    expect(store.getWallet().streak).toBe(1);

    r.ir(ts(2026, 6, 12, 9)); // pulou o dia 11
    store.iniciarLicao(licao, 'nova');
    jogarLicaoInteira(store);
    store.finalizarLicao();
    const w = store.getWallet();
    expect(w.streak).toBe(2); // freeze salvou
    expect(w.freezes).toBe(0); // e foi consumido
    expect(w.bestStreak).toBe(2);
  });
});
