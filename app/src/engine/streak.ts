/**
 * Streak: dia com >= 1 licao concluida (nova ou revisao).
 * Quebra com 1 dia pulado, salvo freeze equipado (consome 1 ao voltar).
 * Dois ou mais dias pulados quebram sempre.
 */

import { dataLocal, diffDias, horaLocal } from './tempo';

/** A partir desta hora local, sem licao no dia, o streak esta em risco. */
export const HORA_RISCO = 20;

export interface EstadoStreak {
  streak: number;
  bestStreak: number;
  freezes: number;
  lastDone: string | null;
}

/**
 * Registra um dia com licao concluida. Idempotente dentro do mesmo dia.
 * diff 1 = dia seguinte (continua). diff 2 = pulou exatamente 1 dia:
 * freeze equipado salva (consome 1). Qualquer outro caso recomeca em 1.
 */
export function registrarDiaConcluido(e: EstadoStreak, agora: number): EstadoStreak {
  const hoje = dataLocal(agora);
  if (e.lastDone === hoje) return e;

  let streak: number;
  let freezes = e.freezes;
  if (e.lastDone === null) {
    streak = 1;
  } else {
    const dias = diffDias(e.lastDone, hoje);
    if (dias === 1) {
      streak = e.streak + 1;
    } else if (dias === 2 && freezes > 0) {
      freezes -= 1;
      streak = e.streak + 1;
    } else {
      streak = 1;
    }
  }
  return {
    streak,
    bestStreak: Math.max(e.bestStreak, streak),
    freezes,
    lastDone: hoje,
  };
}

/**
 * Streak para exibicao, sem mutar nada: 0 se ja quebrou.
 * Pulo de exatamente 1 dia com freeze equipado ainda conta (da para salvar hoje).
 */
export function streakEfetivo(e: EstadoStreak, agora: number): number {
  if (e.lastDone === null) return 0;
  const dias = diffDias(e.lastDone, dataLocal(agora));
  if (dias <= 1) return e.streak;
  if (dias === 2 && e.freezes > 0) return e.streak;
  return 0;
}

/** Streak em risco: ainda vivo, sem licao hoje e ja passou das 20h locais. */
export function streakEmRisco(e: EstadoStreak, agora: number): boolean {
  if (streakEfetivo(e, agora) <= 0) return false;
  if (e.lastDone === dataLocal(agora)) return false;
  return horaLocal(agora) >= HORA_RISCO;
}
