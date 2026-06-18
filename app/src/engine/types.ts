/**
 * Types do engine.
 *
 * O contrato de conteudo agora vive em `../content/types.ts` (fonte da
 * verdade); aqui ele e re-exportado para o engine e para quem o importa.
 * Os types de ESTADO (Wallet, ProgressoLicao, EstadoV1...) sao do engine.
 */

/* ------------------------ Contrato de conteudo ---------------------- */

export type {
  CartaSwipe,
  Dificuldade,
  Exercicio,
  ExercicioDuasVerdades,
  ExercicioIntruso,
  ExercicioMC,
  ExercicioOrdenar,
  ExercicioSlider,
  ExercicioSwipe,
  Habilidade,
  Licao,
  TipoExercicio,
  UnidadeMeta,
} from '../content/types';

import type { Habilidade } from '../content/types';

/* ------------------------------ Estado ------------------------------ */

export type Objetivo =
  | 'mercado'
  | 'restaurante'
  | 'receber'
  | 'presente'
  | 'trabalho'
  | 'outros';

export const OBJETIVOS: readonly Objetivo[] = [
  'mercado',
  'restaurante',
  'receber',
  'presente',
  'trabalho',
  'outros',
] as const;

export type Nivel = 'iniciante' | 'intermediario' | 'avancado';

export interface Wallet {
  /** Placar. Nunca se gasta. */
  xpTotal: number;
  /** Carteira. Sempre se gasta. */
  cristais: number;
  vidas: number;
  /** Ancora de regeneracao: instante (ms) do ultimo tick de vida. */
  vidasTs: number;
  streak: number;
  bestStreak: number;
  /** Freezes equipados (protegem 1 dia pulado cada). */
  freezes: number;
  /** Ultimo dia local (YYYY-MM-DD) com licao concluida. */
  lastDone: string | null;
  /** Meta diaria de XP. */
  metaDiaria: number;
  xpHoje: number;
  /** Dia local (YYYY-MM-DD) a que xpHoje/licoesHoje se referem. */
  dataHoje: string;
  /** Licoes NOVAS concluidas hoje (revisao nao conta para o soft cap). */
  licoesHoje: number;
  /** Sessoes de pratica livre concluidas hoje (soft cap proprio). */
  praticasHoje: number;
  /** Instante (ms) de criacao da conta. D0 e isento de soft cap. */
  criadoEm: number;
}

export type Coroas = 0 | 1 | 2 | 3;

export interface ProgressoLicao {
  coroas: Coroas;
  vezesConcluida: number;
  /** Instante (ms) da ultima conclusao, ou null. */
  ultimaConclusao: number | null;
  /** Instante (ms) da proxima revisao agendada, ou null. */
  proximaRevisao: number | null;
  /** Indices de exercicios que terminaram errados na ultima sessao. */
  errosPendentes: number[];
}

export type ScorePaladar = Record<Habilidade, number>;

export interface EstadoV1 {
  versao: 1;
  wallet: Wallet;
  progresso: Record<string, ProgressoLicao>;
  scorePaladar: ScorePaladar;
  /** Instante (ms) da ultima atividade por dimensao, para o decaimento lazy. */
  scorePaladarTs: Record<Habilidade, number>;
  /** Unidades cujo checkpoint (XP 50) ja foi pago. */
  checkpoints: string[];
  /** Unidades cuja micro-aula assistida inteira (XP 5) ja foi paga. */
  microAulas: string[];
  /** Dia (YYYY-MM-DD em America/Sao_Paulo) do ultimo Desafio do Dia premiado. */
  ultimoDesafioXp: string | null;
  objetivo: Objetivo | null;
  nivelDeclarado: Nivel | null;
  onboardingCompleto: boolean;
  /** Nome de exibicao (perfil + Mesa). null = ainda nao escolhido. */
  nome: string | null;
  /** Id do avatar-preset escolhido (ver components/Avatar). null = inicial. */
  avatar: string | null;
  /** Instante (ms) da ultima edicao de nome/avatar (merge: mais recente vence). */
  perfilTs: number;
}

export const HABILIDADES: readonly Habilidade[] = [
  'tanino',
  'acidez',
  'corpo',
  'docura',
  'frutado',
  'rotulo',
  'harmonizacao',
] as const;
