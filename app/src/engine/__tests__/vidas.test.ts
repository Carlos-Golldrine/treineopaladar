import { describe, expect, it } from 'vitest';
import { REGEN_MS, VIDAS_MAX, ganhar, perder, podeIniciar, proximaVidaEmMs, regenerar } from '../vidas';
import { MS_HORA } from '../tempo';

const T0 = 1_750_000_000_000;

describe('regen de vidas 1 a cada 4h (lazy)', () => {
  it('nao regenera antes de completar 4h', () => {
    const v = perder({ vidas: 5, vidasTs: T0 }, T0); // 4 vidas, relogio comeca em T0
    const r = regenerar(v, T0 + 4 * MS_HORA - 1);
    expect(r.vidas).toBe(4);
  });

  it('regenera exatamente 1 apos 4h', () => {
    const v = perder({ vidas: 5, vidasTs: T0 }, T0);
    const r = regenerar(v, T0 + 4 * MS_HORA);
    expect(r.vidas).toBe(5);
  });

  it('acumula ticks e guarda o resto na ancora', () => {
    let v = { vidas: 5, vidasTs: T0 };
    v = perder(v, T0);
    v = perder(v, T0);
    v = perder(v, T0); // 2 vidas, ancora T0
    const r = regenerar(v, T0 + 9 * MS_HORA); // 2 ticks completos (8h), sobra 1h
    expect(r.vidas).toBe(4);
    expect(r.vidasTs).toBe(T0 + 8 * MS_HORA);
    // a proxima vida chega 4h depois do ultimo tick, nao 4h depois da leitura
    expect(proximaVidaEmMs(r, T0 + 9 * MS_HORA)).toBe(3 * MS_HORA);
  });

  it('teto em 5: nunca passa do maximo', () => {
    const v = perder({ vidas: 5, vidasTs: T0 }, T0);
    const r = regenerar(v, T0 + 100 * MS_HORA);
    expect(r.vidas).toBe(VIDAS_MAX);
    expect(proximaVidaEmMs(r, T0 + 100 * MS_HORA)).toBeNull();
  });

  it('perder com o estoque cheio reinicia o relogio de regen agora', () => {
    const depois = T0 + 50 * MS_HORA;
    const v = perder({ vidas: 5, vidasTs: T0 }, depois);
    expect(v.vidas).toBe(4);
    expect(v.vidasTs).toBe(depois);
    expect(regenerar(v, depois + REGEN_MS).vidas).toBe(5);
  });

  it('ganhar recupera ate o teto (revisao recupera 1)', () => {
    let v = { vidas: 5, vidasTs: T0 };
    v = perder(v, T0);
    v = perder(v, T0);
    expect(ganhar(v, 1, T0).vidas).toBe(4);
    expect(ganhar(v, 9, T0).vidas).toBe(5);
  });
});

describe('com 0 vidas so revisao liberada', () => {
  it('bloqueia licao nova e libera revisao', () => {
    expect(podeIniciar(0, 'nova')).toBe(false);
    expect(podeIniciar(0, 'revisao')).toBe(true);
    expect(podeIniciar(1, 'nova')).toBe(true);
  });
});
