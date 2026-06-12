/**
 * Engine de regras do Treine seu Paladar.
 * API publica: economia (secao 6), pacing e vidas (secao 3), revisao
 * espacada (secao 2), sessao de licao, store persistente e hooks React.
 * Zero dependencia de UI (hooks importam react, nunca JSX).
 */

/* Types do contrato de conteudo e do estado */
export type {
  CartaSwipe,
  Coroas,
  Dificuldade,
  EstadoV1,
  Exercicio,
  ExercicioDuasVerdades,
  ExercicioIntruso,
  ExercicioMC,
  ExercicioOrdenar,
  ExercicioSlider,
  ExercicioSwipe,
  Habilidade,
  Licao,
  Nivel,
  Objetivo,
  ProgressoLicao,
  ScorePaladar,
  TipoExercicio,
  UnidadeMeta,
  Wallet,
} from './types';
export { HABILIDADES, OBJETIVOS } from './types';

/* Economia (secao 6) */
export {
  CRISTAIS_BOAS_VINDAS,
  CRISTAIS_BONUS_PERFEITA,
  CRISTAIS_LICAO,
  CRISTAIS_META_DIARIA,
  MENSAGEM_PACING,
  META_DIARIA_PADRAO,
  PRECOS_LOJA,
  XP_CHECKPOINT,
  XP_DESAFIO_DIA,
  XP_LICAO,
  XP_LICAO_PERFEITA,
  XP_MICRO_AULA,
  XP_REVISAO,
  cristaisDeLicao,
  ehD0,
  multiplicadorSoftCap,
  xpDeLicaoNova,
} from './economia';
export type { ItemLoja } from './economia';

/* Vidas (secao 3) */
export {
  REGEN_MS,
  VIDAS_MAX,
  ganhar as ganharVidas,
  perder as perderVida,
  podeIniciar as podeIniciarComVidas,
  proximaVidaEmMs,
  regenerar as regenerarVidas,
} from './vidas';
export type { EstadoVidas } from './vidas';

/* Streak */
export { HORA_RISCO, registrarDiaConcluido, streakEfetivo, streakEmRisco } from './streak';
export type { EstadoStreak } from './streak';

/* Revisao espacada (secao 2) */
export { INTERVALOS_REVISAO_DIAS, proximaRevisaoTs, revisoesVencidas } from './revisao';

/* Sessao de licao + Score de Paladar */
export {
  MAX_REINSERCOES,
  PALADAR_DECAIMENTO_SEMANAL,
  PALADAR_GANHO,
  PALADAR_MAX,
  aplicarPaladar,
  decairPaladar,
  exercicioAtual,
  finalizarSessao,
  indiceAtual,
  iniciarSessao,
  responder,
  sessaoConcluida,
} from './sessao';
export type {
  EfeitoResposta,
  RespostaSessao,
  ResultadoSessao,
  Sessao,
  TipoSessao,
} from './sessao';

/* Store persistente (localStorage "tp.v1") */
export {
  CHAVE_STORE,
  TPStore,
  VERSAO_ESTADO,
  criarStore,
  estadoInicial,
  migrar,
  obterStore,
  resetarStorePadrao,
} from './store';
export type {
  OpcoesStore,
  RespostaPratica,
  ResultadoPratica,
  SessaoAtiva,
  StorageLike,
} from './store';

/* Hooks React finos */
export { useProgresso, useSessao, useWallet } from './hooks';
export type { UseProgresso, UseSessao, UseWallet } from './hooks';

/* Helpers de tempo */
export { MS_DIA, MS_HORA, MS_SEMANA, dataLocal, diffDias, horaLocal } from './tempo';
