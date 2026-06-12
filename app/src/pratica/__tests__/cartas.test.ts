/**
 * Flashcards: derivacao programatica das fichas canonicas (nenhum texto
 * inventado) e repeticao espacada D+1/3/7/21 por card.
 */
import { describe, expect, it } from 'vitest';
import { todasLicoes } from '../../content';
import { INTERVALOS_REVISAO_DIAS, MS_DIA } from '../../engine';
import {
  avaliarCarta,
  cartasVencidas,
  derivarCartas,
  montarSessaoCartas,
} from '../cartas';
import type { AgendaCartas } from '../cartas';

const T0 = new Date(2026, 5, 10, 9).getTime();

describe('derivacao das cartas (30 licoes)', () => {
  const cartas = derivarCartas(todasLicoes);

  it('gera 1 card por fato da ficha canonica, para as 30 licoes', () => {
    const totalFatos = todasLicoes.reduce((soma, l) => soma + l.fichaCanonica.length, 0);
    expect(cartas.length).toBe(totalFatos);
    const licoesCobertas = new Set(cartas.map((c) => c.licaoId));
    expect(licoesCobertas.size).toBe(30);
  });

  it('o verso e o fato canonico INTEGRO (zero texto inventado)', () => {
    const fatos = new Set(todasLicoes.flatMap((l) => l.fichaCanonica));
    for (const carta of cartas) {
      expect(fatos.has(carta.fato)).toBe(true);
    }
  });

  it('a frente e o fato com a chave virando lacuna (a chave some inteira)', () => {
    for (const carta of cartas) {
      expect(carta.frente).toContain('_____');
      const re = new RegExp(`(^|[^\\p{L}])${carta.chave}([^\\p{L}]|$)`, 'iu');
      expect(re.test(carta.frente)).toBe(false);
      /* a frente nasce do fato: trocando a lacuna de volta, recupera o fato */
      expect(carta.frente.length).toBeLessThan(carta.fato.length + 6);
    }
  });

  it('ids estaveis e unicos (licao:indiceDoFato)', () => {
    const ids = cartas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('u1-l1:0');
  });

  it('variedade: uma licao nao usa a mesma chave em todos os cards', () => {
    for (const licao of todasLicoes) {
      const daLicao = cartas.filter((c) => c.licaoId === licao.id);
      const chaves = new Set(daLicao.map((c) => c.chave.toLowerCase()));
      if (daLicao.length >= 3) expect(chaves.size).toBeGreaterThan(1);
    }
  });
});

describe('repeticao espacada por card', () => {
  it('"sabia" sobe a regua: D+1 -> D+3 -> D+7 -> D+21 (teto)', () => {
    let agenda: AgendaCartas = {};
    agenda = avaliarCarta(agenda, 'u1-l1:0', 'sabia', T0);
    expect(agenda['u1-l1:0']).toEqual({ fase: 1, proxima: T0 + 3 * MS_DIA });
    agenda = avaliarCarta(agenda, 'u1-l1:0', 'sabia', T0);
    expect(agenda['u1-l1:0'].fase).toBe(2);
    expect(agenda['u1-l1:0'].proxima).toBe(T0 + 7 * MS_DIA);
    agenda = avaliarCarta(agenda, 'u1-l1:0', 'sabia', T0);
    expect(agenda['u1-l1:0'].proxima).toBe(T0 + 21 * MS_DIA);
    agenda = avaliarCarta(agenda, 'u1-l1:0', 'sabia', T0);
    expect(agenda['u1-l1:0'].fase).toBe(INTERVALOS_REVISAO_DIAS.length - 1);
  });

  it('"quase" repete o degrau; "nao sabia" volta ao D+1', () => {
    let agenda: AgendaCartas = {};
    agenda = avaliarCarta(agenda, 'c', 'quase', T0);
    expect(agenda['c']).toEqual({ fase: 0, proxima: T0 + MS_DIA });
    agenda = avaliarCarta(agenda, 'c', 'sabia', T0);
    agenda = avaliarCarta(agenda, 'c', 'quase', T0);
    expect(agenda['c'].fase).toBe(1);
    agenda = avaliarCarta(agenda, 'c', 'naosabia', T0);
    expect(agenda['c']).toEqual({ fase: 0, proxima: T0 + MS_DIA });
  });
});

describe('sessao de cartas', () => {
  const cartas = derivarCartas(todasLicoes.slice(0, 3)); /* ~18 cards */
  const rng = () => 0.5;

  it('limita a 10 e poe vencidos na frente (mais atrasado primeiro)', () => {
    let agenda: AgendaCartas = {};
    agenda = avaliarCarta(agenda, cartas[4].id, 'sabia', T0 - 9 * MS_DIA);
    agenda = avaliarCarta(agenda, cartas[2].id, 'naosabia', T0 - 5 * MS_DIA);
    const sessao = montarSessaoCartas(cartas, agenda, T0, rng);
    expect(sessao.length).toBe(10);
    expect(sessao[0].id).toBe(cartas[4].id); /* vencido ha mais tempo */
    expect(sessao[1].id).toBe(cartas[2].id);
    expect(cartasVencidas(cartas, agenda, T0)).toBe(2);
  });

  it('sem vencidos nem novos, puxa os agendados mais proximos (rodada nunca vazia)', () => {
    let agenda: AgendaCartas = {};
    for (const c of cartas) agenda = avaliarCarta(agenda, c.id, 'sabia', T0);
    const sessao = montarSessaoCartas(cartas, agenda, T0, rng);
    expect(sessao.length).toBe(10);
    expect(cartasVencidas(cartas, agenda, T0)).toBe(0);
  });
});
