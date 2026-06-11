/**
 * Vidas (DECISOES-PRODUTO-V2.md, secao 3, recalibradas para 73% iniciantes):
 * max 5, regenera 1 a cada 4h (calculo lazy por timestamp), primeiro erro de
 * cada licao nao custa vida (grace tratado em sessao.ts), concluir revisao
 * recupera 1, com 0 vidas so revisao liberada (caminho triste vira estudo).
 */

import { MS_HORA } from './tempo';

export const VIDAS_MAX = 5;
export const REGEN_MS = 4 * MS_HORA;

export interface EstadoVidas {
  vidas: number;
  /** Ancora: instante do ultimo tick de regeneracao (ou de quando encheu). */
  vidasTs: number;
}

/** Aplica a regeneracao pendente desde a ancora. Lazy: chamar antes de ler ou mexer. */
export function regenerar(v: EstadoVidas, agora: number): EstadoVidas {
  if (v.vidas >= VIDAS_MAX) return { vidas: VIDAS_MAX, vidasTs: agora };
  const ticks = Math.floor((agora - v.vidasTs) / REGEN_MS);
  if (ticks <= 0) return v;
  const vidas = Math.min(VIDAS_MAX, v.vidas + ticks);
  const vidasTs = vidas >= VIDAS_MAX ? agora : v.vidasTs + ticks * REGEN_MS;
  return { vidas, vidasTs };
}

/** Perde 1 vida (nunca abaixo de 0). Se estava cheio, o relogio de regen comeca agora. */
export function perder(v: EstadoVidas, agora: number): EstadoVidas {
  const r = regenerar(v, agora);
  if (r.vidas <= 0) return r;
  const vidasTs = r.vidas >= VIDAS_MAX ? agora : r.vidasTs;
  return { vidas: r.vidas - 1, vidasTs };
}

/** Ganha vidas (recuperacao por revisao, vida avulsa da loja), teto em 5. */
export function ganhar(v: EstadoVidas, quantidade: number, agora: number): EstadoVidas {
  const r = regenerar(v, agora);
  const vidas = Math.min(VIDAS_MAX, r.vidas + quantidade);
  return { vidas, vidasTs: vidas >= VIDAS_MAX ? agora : r.vidasTs };
}

/** Com 0 vidas, so revisao liberada. */
export function podeIniciar(vidas: number, tipo: 'nova' | 'revisao'): boolean {
  return tipo === 'revisao' || vidas > 0;
}

/** Ms ate a proxima vida, ou null se ja esta cheio. Para o contador da UI. */
export function proximaVidaEmMs(v: EstadoVidas, agora: number): number | null {
  const r = regenerar(v, agora);
  if (r.vidas >= VIDAS_MAX) return null;
  return r.vidasTs + REGEN_MS - agora;
}
