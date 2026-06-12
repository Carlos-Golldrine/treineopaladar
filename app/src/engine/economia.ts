/**
 * Economia (DECISOES-PRODUTO-V2.md, secao 6) + soft cap de pacing (secao 3).
 * XP e placar e nunca se gasta. Cristais sao carteira e sempre se gastam.
 */

import { dataLocal } from './tempo';

/* ------------------------------- XP -------------------------------- */

export const XP_LICAO = 20;
export const XP_LICAO_PERFEITA = 25;
export const XP_REVISAO = 10;
export const XP_DESAFIO_DIA = 30;
export const XP_CHECKPOINT = 50;
/** Micro-aula da unidade assistida inteira (uma vez por unidade). */
export const XP_MICRO_AULA = 5;

/** Meta diaria sugerida (~10 min). */
export const META_DIARIA_PADRAO = 50;

/* ----------------------------- Cristais ----------------------------- */

export const CRISTAIS_LICAO = 5;
export const CRISTAIS_BONUS_PERFEITA = 2;
export const CRISTAIS_META_DIARIA = 10;
/** Apresentado na UI como barra do primeiro item ja cheia (paga exatamente 1 freeze). */
export const CRISTAIS_BOAS_VINDAS = 60;

/* ------------------------------- Loja ------------------------------- */

export const PRECOS_LOJA = {
  freeze: 60,
  recargaVidas: 50,
  vidaAvulsa: 15,
  dobroXp: 30,
  desbloqueioUnidade: 200,
  desbloqueioModo: 300,
  /** Dica no exercicio (elimina alternativa / revela regra / estreita faixa). */
  dica: 10,
} as const;

export type ItemLoja = keyof typeof PRECOS_LOJA;

/** Copy de pacing no tom da marca (sem travessao, sem emoji). */
export const MENSAGEM_PACING =
  'Seu cérebro fixa melhor dormindo em cima disso, amanhã tem mais.';

/* ----------------------------- Soft cap ----------------------------- */

/**
 * Multiplicador de XP da PROXIMA licao nova, dado quantas licoes novas
 * ja foram concluidas hoje: licoes 1-3 do dia 100%, 4-5 50%, 6+ 25%.
 * Revisao nunca passa por aqui (XP integral sempre, secao 3).
 */
export function multiplicadorSoftCap(licoesConcluidasHoje: number): number {
  if (licoesConcluidasHoje < 3) return 1;
  if (licoesConcluidasHoje < 5) return 0.5;
  return 0.25;
}

/** D0 = mesmo dia local do criadoEm. Ativacao primeiro: pacing comeca no dia 2. */
export function ehD0(criadoEm: number, agora: number): boolean {
  return dataLocal(criadoEm) === dataLocal(agora);
}

/** XP de uma licao nova concluida, ja com soft cap aplicado (arredondado). */
export function xpDeLicaoNova(
  perfeita: boolean,
  licoesConcluidasHoje: number,
  isentoD0: boolean,
): number {
  const base = perfeita ? XP_LICAO_PERFEITA : XP_LICAO;
  const mult = isentoD0 ? 1 : multiplicadorSoftCap(licoesConcluidasHoje);
  return Math.round(base * mult);
}

/** Cristais de uma licao nova concluida. */
export function cristaisDeLicao(perfeita: boolean): number {
  return CRISTAIS_LICAO + (perfeita ? CRISTAIS_BONUS_PERFEITA : 0);
}
