/**
 * Sessao de licao: fila de exercicios na ordem do JSON, errados pendentes da
 * sessao anterior voltam primeiro, errado da sessao volta antes do fim
 * (max 2 reinsercoes por exercicio), grace do primeiro erro, resultado e
 * Score de Paladar (0-1000, assintotico, decai 1% por semana parada).
 *
 * O engine nao corrige formato: a UI sabe o que e acerto em cada tipo
 * (swipe tem varias cartas, slider tem tolerancia) e entrega um boolean.
 */

import type { Exercicio, Habilidade, Licao } from './types';
import { XP_REVISAO, cristaisDeLicao, xpDeLicaoNova } from './economia';
import { MS_SEMANA } from './tempo';

export type TipoSessao = 'nova' | 'revisao';

/** Cada exercicio errado volta para a fila no maximo 2 vezes. */
export const MAX_REINSERCOES = 2;

export interface RespostaSessao {
  exercicio: number;
  correto: boolean;
  dificuldade: number;
}

export interface Sessao {
  licaoId: string;
  habilidade: Habilidade;
  tipo: TipoSessao;
  /** Indices de exercicios da licao, na ordem em que serao jogados. */
  fila: number[];
  posicao: number;
  /** Quantas vezes cada exercicio ja foi reinserido. */
  reinsercoes: Record<number, number>;
  respostas: RespostaSessao[];
  /** Resultado da ultima resposta de cada exercicio (para errosPendentes). */
  ultimoResultado: Record<number, boolean>;
  /** O primeiro erro da licao nao custa vida. */
  graceUsado: boolean;
  acertos: number;
  erros: number;
  inicioTs: number;
}

export interface EfeitoResposta {
  sessao: Sessao;
  /** True quando o erro custa vida (a partir do segundo erro da sessao). */
  custouVida: boolean;
  /** True quando o exercicio voltou para o fim da fila. */
  reinserido: boolean;
}

export interface ResultadoSessao {
  acertos: number;
  erros: number;
  perfeita: boolean;
  xp: number;
  cristais: number;
  /** Duracao da sessao em ms. */
  duracao: number;
  /** Exercicios que terminaram errados (voltam na proxima sessao). */
  errosPendentes: number[];
}

/**
 * Monta a sessao: fila na ordem do JSON, com os errosPendentes da sessao
 * anterior promovidos para o inicio (itens errados voltam na sessao seguinte).
 */
export function iniciarSessao(
  licao: Licao,
  tipo: TipoSessao,
  agora: number,
  errosPendentes: number[] = [],
): Sessao {
  const todos = licao.exercicios.map((_, i) => i);
  const pendentes = [...new Set(errosPendentes)].filter((i) => i >= 0 && i < todos.length);
  const fila = [...pendentes, ...todos.filter((i) => !pendentes.includes(i))];
  return {
    licaoId: licao.id,
    habilidade: licao.habilidade,
    tipo,
    fila,
    posicao: 0,
    reinsercoes: {},
    respostas: [],
    ultimoResultado: {},
    graceUsado: false,
    acertos: 0,
    erros: 0,
    inicioTs: agora,
  };
}

export function sessaoConcluida(s: Sessao): boolean {
  return s.posicao >= s.fila.length;
}

/** Indice (na licao) do exercicio atual, ou null se a sessao acabou. */
export function indiceAtual(s: Sessao): number | null {
  const indice = s.fila[s.posicao];
  return indice === undefined ? null : indice;
}

/** Exercicio atual, ou null se a sessao acabou. */
export function exercicioAtual(s: Sessao, licao: Licao): Exercicio | null {
  const indice = indiceAtual(s);
  return indice === null ? null : (licao.exercicios[indice] ?? null);
}

/**
 * Registra a resposta do exercicio atual e avanca a fila.
 * Erro: o primeiro da sessao nao custa vida (grace); errados voltam para o
 * fim da fila ate 2 vezes cada.
 */
export function responder(s: Sessao, correto: boolean, licao: Licao): EfeitoResposta {
  const indice = indiceAtual(s);
  if (indice === null) return { sessao: s, custouVida: false, reinserido: false };

  const dificuldade = licao.exercicios[indice]?.dificuldade ?? 1;
  const respostas = [...s.respostas, { exercicio: indice, correto, dificuldade }];
  const ultimoResultado = { ...s.ultimoResultado, [indice]: correto };

  let fila = s.fila;
  let reinsercoes = s.reinsercoes;
  let graceUsado = s.graceUsado;
  let custouVida = false;
  let reinserido = false;

  if (!correto) {
    if (!graceUsado) {
      graceUsado = true;
    } else {
      custouVida = true;
    }
    const usadas = reinsercoes[indice] ?? 0;
    if (usadas < MAX_REINSERCOES) {
      reinsercoes = { ...reinsercoes, [indice]: usadas + 1 };
      fila = [...fila, indice];
      reinserido = true;
    }
  }

  return {
    sessao: {
      ...s,
      fila,
      posicao: s.posicao + 1,
      reinsercoes,
      respostas,
      ultimoResultado,
      graceUsado,
      acertos: s.acertos + (correto ? 1 : 0),
      erros: s.erros + (correto ? 0 : 1),
    },
    custouVida,
    reinserido,
  };
}

/**
 * Calcula o resultado da sessao concluida.
 * Nova: XP 20 (25 perfeita) com soft cap do dia (D0 isento), cristais 5 (+2).
 * Revisao: XP 10 integral sempre (secao 3), sem cristais de licao.
 */
export function finalizarSessao(
  s: Sessao,
  agora: number,
  contexto: { licoesConcluidasHoje: number; isentoD0: boolean },
): ResultadoSessao {
  const perfeita = s.erros === 0;
  const xp =
    s.tipo === 'revisao'
      ? XP_REVISAO
      : xpDeLicaoNova(perfeita, contexto.licoesConcluidasHoje, contexto.isentoD0);
  const cristais = s.tipo === 'revisao' ? 0 : cristaisDeLicao(perfeita);
  const errosPendentes = Object.entries(s.ultimoResultado)
    .filter(([, ok]) => !ok)
    .map(([i]) => Number(i))
    .sort((a, b) => a - b);
  return {
    acertos: s.acertos,
    erros: s.erros,
    perfeita,
    xp,
    cristais,
    duracao: Math.max(0, agora - s.inicioTs),
    errosPendentes,
  };
}

/* ------------------------- Score de Paladar ------------------------- */

export const PALADAR_MAX = 1000;
/** Fracao do gap ate 1000 ganha por acerto, por ponto de dificuldade. */
export const PALADAR_GANHO = 0.005;
/** Decaimento de 1% por semana cheia de inatividade na dimensao. */
export const PALADAR_DECAIMENTO_SEMANAL = 0.01;

/** Aplica o decaimento lazy: 1% ao multiplicar por semana cheia parada. */
export function decairPaladar(score: number, ultimaAtividade: number, agora: number): number {
  const semanas = Math.floor((agora - ultimaAtividade) / MS_SEMANA);
  if (semanas <= 0) return score;
  return score * Math.pow(1 - PALADAR_DECAIMENTO_SEMANAL, semanas);
}

/**
 * Aplica os acertos da sessao ao score da habilidade da licao.
 * Cada acerto soma (1000 - score) * 0.005 * dificuldade: cresce rapido no
 * comeco e chega perto de 1000 de forma assintotica, sem nunca passar.
 */
export function aplicarPaladar(score: number, s: Sessao): number {
  let valor = score;
  for (const r of s.respostas) {
    if (!r.correto) continue;
    valor += (PALADAR_MAX - valor) * PALADAR_GANHO * r.dificuldade;
  }
  return Math.min(PALADAR_MAX, valor);
}
