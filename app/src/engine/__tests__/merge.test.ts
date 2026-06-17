import { describe, expect, it } from 'vitest';
import { estadoInicial } from '../store';
import { mesclarEstado } from '../merge';
import type { EstadoV1, ProgressoLicao, Wallet } from '../types';
import { dataLocal, MS_DIA } from '../tempo';

const AGORA = Date.UTC(2026, 5, 17, 15); // 17/06/2026, ~meio-dia em Sao Paulo
const HOJE = dataLocal(AGORA);
const ONTEM = dataLocal(AGORA - MS_DIA);
const VELHO = dataLocal(AGORA - 10 * MS_DIA);

function base(over: Partial<EstadoV1> = {}): EstadoV1 {
  return { ...estadoInicial(AGORA), ...over };
}
function comWallet(e: EstadoV1, over: Partial<Wallet>): EstadoV1 {
  return { ...e, wallet: { ...e.wallet, ...over } };
}
const lic = (over: Partial<ProgressoLicao> = {}): ProgressoLicao => ({
  coroas: 1,
  vezesConcluida: 1,
  ultimaConclusao: AGORA,
  proximaRevisao: null,
  errosPendentes: [],
  ...over,
});

describe('mesclarEstado', () => {
  it('onboardingCompleto e monotonico (OR): true nunca regride por um remoto false', () => {
    const concluido = base({ onboardingCompleto: true });
    const novo = base({ onboardingCompleto: false });
    // bug 1 e bug 2: o onboarding ja feito sobrevive ao pull da nuvem, dos dois lados
    expect(mesclarEstado(concluido, novo, AGORA).onboardingCompleto).toBe(true);
    expect(mesclarEstado(novo, concluido, AGORA).onboardingCompleto).toBe(true);
  });

  it('re-login num perfil-semente NAO infla moeda/vidas (mantem o lado com historico)', () => {
    const local = comWallet(base({ progresso: { a: lic() } }), { xpTotal: 120, cristais: 10, vidas: 2 });
    const remotoSemente = base(); // estado inicial: xp 0, cristais 60, vidas 5, sem progresso
    const m = mesclarEstado(local, remotoSemente, AGORA);
    expect(m.wallet.cristais).toBe(10);
    expect(m.wallet.vidas).toBe(2);
    expect(m.wallet.xpTotal).toBe(120);
    // idempotente: re-logar de novo nao volta a inflar
    const m2 = mesclarEstado(m, remotoSemente, AGORA);
    expect(m2.wallet.cristais).toBe(10);
    expect(m2.wallet.vidas).toBe(2);
  });

  it('nunca perde progresso: uniao das licoes e max de XP/coroas', () => {
    const local = comWallet(base({ progresso: { a: lic({ coroas: 2 }), b: lic({ coroas: 1 }) } }), { xpTotal: 300 });
    const remoto = comWallet(base({ progresso: { a: lic({ coroas: 3 }), c: lic({ coroas: 2 }) } }), { xpTotal: 200 });
    const m = mesclarEstado(local, remoto, AGORA);
    expect(Object.keys(m.progresso).sort()).toEqual(['a', 'b', 'c']);
    expect(m.progresso.a.coroas).toBe(3); // melhor das duas
    expect(m.progresso.b.coroas).toBe(1);
    expect(m.progresso.c.coroas).toBe(2);
    expect(m.wallet.xpTotal).toBe(300);
  });

  it('streak: vence o lado VIVO de maior valor; um streak morto perde pro vivo', () => {
    const vivo5 = comWallet(base({ progresso: { a: lic() } }), { streak: 5, lastDone: ONTEM });
    const vivo3 = comWallet(base({ progresso: { a: lic() } }), { streak: 3, lastDone: HOJE });
    expect(mesclarEstado(vivo5, vivo3, AGORA).wallet.streak).toBe(5);

    const morto10 = comWallet(base({ progresso: { a: lic() } }), { streak: 10, lastDone: VELHO });
    expect(mesclarEstado(morto10, vivo3, AGORA).wallet.streak).toBe(3); // o vivo manda
  });

  it('checkpoints e microAulas sao uniao, sem duplicar', () => {
    const local = base({ checkpoints: ['u1', 'u2'], microAulas: ['m1'] });
    const remoto = base({ checkpoints: ['u2', 'u3'], microAulas: ['m1', 'm2'] });
    const m = mesclarEstado(local, remoto, AGORA);
    expect(m.checkpoints.sort()).toEqual(['u1', 'u2', 'u3']);
    expect(m.microAulas.sort()).toEqual(['m1', 'm2']);
  });

  it('objetivo/nivel: prefere o nao-nulo (nao apaga a escolha local com um remoto vazio)', () => {
    const local = base({ objetivo: 'receber', nivelDeclarado: 'iniciante' });
    const remoto = base({ objetivo: null, nivelDeclarado: null });
    const m = mesclarEstado(local, remoto, AGORA);
    expect(m.objetivo).toBe('receber');
    expect(m.nivelDeclarado).toBe('iniciante');
  });
});
