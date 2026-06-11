/**
 * Revisao espacada (DECISOES-PRODUTO-V2.md, secao 2):
 * agenda D+1, D+3, D+7, D+21 (gap de Cepeda 2008) por conclusao.
 * A 1a conclusao agenda D+1, a 2a D+3, a 3a D+7, da 4a em diante D+21.
 */

import { MS_DIA } from './tempo';
import type { ProgressoLicao } from './types';

export const INTERVALOS_REVISAO_DIAS = [1, 3, 7, 21] as const;

/**
 * Instante (ms) da proxima revisao, dado o total de conclusoes ja feitas
 * (incluindo a que esta sendo registrada agora).
 */
export function proximaRevisaoTs(vezesConcluida: number, agora: number): number {
  const indice = Math.min(Math.max(vezesConcluida, 1), INTERVALOS_REVISAO_DIAS.length) - 1;
  return agora + INTERVALOS_REVISAO_DIAS[indice] * MS_DIA;
}

/** Ids de licoes com revisao vencida, da mais atrasada para a mais recente. */
export function revisoesVencidas(
  progresso: Record<string, ProgressoLicao>,
  agora: number,
): string[] {
  return Object.entries(progresso)
    .filter(([, p]) => p.proximaRevisao !== null && p.proximaRevisao <= agora)
    .sort(([, a], [, b]) => (a.proximaRevisao ?? 0) - (b.proximaRevisao ?? 0))
    .map(([id]) => id);
}
