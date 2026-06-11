/**
 * Types do contrato de conteudo + estado do engine.
 *
 * Contrato de conteudo: `../content/types.ts` ainda nao existe; os types
 * abaixo seguem EXATAMENTE o contrato dos JSONs de licao
 * (`src/content/unidade-1/licao-0N.json` + `unidade-1.meta.json`).
 * Quando `../content/types.ts` nascer, basta trocar as definicoes daqui
 * por re-export (a forma e identica).
 */

/* ----------------------------- Conteudo ----------------------------- */

export type Habilidade =
  | 'tanino'
  | 'acidez'
  | 'corpo'
  | 'docura'
  | 'frutado'
  | 'rotulo'
  | 'harmonizacao';

export type Dificuldade = 1 | 2 | 3;

interface ExercicioBase {
  dificuldade: Dificuldade;
  /** A UI pergunta "certeza ou chute?" antes do reveal. */
  calibrar?: boolean;
}

export interface ExercicioMC extends ExercicioBase {
  tipo: 'mc';
  pergunta: string;
  opcoes: string[];
  correta: number;
  okMsg: string;
  erroMsg: string;
  porque: string;
}

export interface CartaSwipe {
  texto: string;
  verdade: boolean;
  porque: string;
}

export interface ExercicioSwipe extends ExercicioBase {
  tipo: 'swipe';
  instrucao: string;
  cartas: CartaSwipe[];
}

export interface ExercicioSlider extends ExercicioBase {
  tipo: 'slider';
  pergunta: string;
  labelMin: string;
  labelMax: string;
  alvo: number;
  tolerancia: number;
  porque: string;
}

export interface ExercicioOrdenar extends ExercicioBase {
  tipo: 'ordenar';
  instrucao: string;
  itens: string[];
  ordemCorreta: number[];
  porque: string;
}

export interface ExercicioIntruso extends ExercicioBase {
  tipo: 'intruso';
  pergunta: string;
  opcoes: string[];
  intruso: number;
  regra: string;
}

export interface ExercicioDuasVerdades extends ExercicioBase {
  tipo: 'duasverdades';
  tema: string;
  afirmacoes: string[];
  mentira: number;
  porque: string;
}

export type Exercicio =
  | ExercicioMC
  | ExercicioSwipe
  | ExercicioSlider
  | ExercicioOrdenar
  | ExercicioIntruso
  | ExercicioDuasVerdades;

export type TipoExercicio = Exercicio['tipo'];

export interface Licao {
  id: string;
  unidade: string;
  ordem: number;
  titulo: string;
  habilidade: Habilidade;
  hook: string;
  fichaCanonica: string[];
  exercicios: Exercicio[];
  aplicacao: string;
  recap: string;
  voceAgoraSabe: string[];
  curiosidade: string;
  teaser: string;
}

export interface UnidadeMeta {
  id: string;
  titulo: string;
  subtitulo: string;
  cor: string;
  ordemLicoes: string[];
}

/* ------------------------------ Estado ------------------------------ */

export type Objetivo = 'mercado' | 'restaurante' | 'receber' | 'hobby';

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
  objetivo: Objetivo | null;
  nivelDeclarado: Nivel | null;
  onboardingCompleto: boolean;
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
