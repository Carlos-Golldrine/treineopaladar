/**
 * Merge campo-a-campo do estado (local-first): combina a copia local com a da
 * nuvem SEM perder progresso e SEM inflar moeda/vidas. Substitui o pull
 * destrutivo (commit cego do remoto) que a hidratacao da F3 fazia.
 *
 * Regras: onboardingCompleto e monotonico (OR, nunca regride); XP/streak/coroas
 * pegam o melhor; progresso/checkpoints/microAulas sao uniao; o dia
 * (xpHoje/licoesHoje/...) viaja junto do dataHoje vencedor; e um perfil-semente
 * (recem-criado na nuvem, so com defaults de boas-vindas) nunca impoe sua
 * carteira (cristais/vidas) sobre uma copia com historico real.
 */
import type { EstadoV1, Habilidade, ProgressoLicao, ScorePaladar, Wallet } from './types';
import { HABILIDADES } from './types';
import { streakEfetivo } from './streak';

const max = (a: number, b: number) => Math.max(a, b);
const min = (a: number, b: number) => Math.min(a, b);

/** Datas YYYY-MM-DD: comparacao lexicografica == cronologica. */
function dataMaisRecente(a: string | null, b: string | null): string | null {
  if (a == null) return b;
  if (b == null) return a;
  return a >= b ? a : b;
}

/** Preferir nao-nulo; se ambos definidos e diferentes, o lado mais ativo decide. */
function escolherNaoNulo<T>(a: T | null, b: T | null, ativo: T | null): T | null {
  if (a == null) return b;
  if (b == null) return a;
  return a === b ? a : ativo;
}

/** Perfil sem historico real (so defaults): nao deve impor a carteira de boas-vindas. */
function ehSemente(e: EstadoV1): boolean {
  return (
    e.wallet.xpTotal === 0 &&
    Object.keys(e.progresso).length === 0 &&
    e.checkpoints.length === 0 &&
    e.microAulas.length === 0
  );
}

function mesclarWallet(l: Wallet, r: Wallet, agora: number): Wallet {
  /* Streak: vence o lado com maior streak VIVO (contra o relogio). Se so um esta
     vivo, vence esse; se os dois morreram, fica o de conclusao mais recente.
     lastDone/freezes acompanham o lado escolhido. */
  const vivoL = streakEfetivo(l, agora);
  const vivoR = streakEfetivo(r, agora);
  let ladoStreak: Wallet;
  if (vivoL <= 0 && vivoR <= 0) ladoStreak = (l.lastDone ?? '') >= (r.lastDone ?? '') ? l : r;
  else if (vivoR <= 0) ladoStreak = l;
  else if (vivoL <= 0) ladoStreak = r;
  else ladoStreak = vivoL >= vivoR ? l : r;

  /* Moeda: do lado de maior xpTotal (mais avancado), nunca max cego — assim nao
     revive cristais ja gastos nem soma a carteira-semente. */
  const economico = l.xpTotal >= r.xpTotal ? l : r;

  /* Bloco do dia: contadores viajam JUNTOS com o dataHoje vencedor. */
  const mesmoDia = l.dataHoje === r.dataHoje;
  const dia = l.dataHoje >= r.dataHoje ? l : r;

  /* Bloco da semana (placar da Mesa): mesma logica do dia, chaveada por semanaXp. */
  const mesmaSemana = l.semanaXp === r.semanaXp;
  const sem = l.semanaXp >= r.semanaXp ? l : r;

  return {
    xpTotal: max(l.xpTotal, r.xpTotal),
    cristais: economico.cristais,
    vidas: max(l.vidas, r.vidas),
    /* Ancora de regen mais ANTIGA: so adianta a proxima vida, nunca atrasa. */
    vidasTs: min(l.vidasTs, r.vidasTs),
    streak: ladoStreak.streak,
    bestStreak: max(l.bestStreak, r.bestStreak),
    freezes: ladoStreak.freezes,
    lastDone: ladoStreak.lastDone,
    metaDiaria: dia.metaDiaria,
    xpHoje: mesmoDia ? max(l.xpHoje, r.xpHoje) : dia.xpHoje,
    dataHoje: dia.dataHoje,
    licoesHoje: mesmoDia ? max(l.licoesHoje, r.licoesHoje) : dia.licoesHoje,
    praticasHoje: mesmoDia ? max(l.praticasHoje, r.praticasHoje) : dia.praticasHoje,
    xpSemana: mesmaSemana ? max(l.xpSemana, r.xpSemana) : sem.xpSemana,
    semanaXp: sem.semanaXp,
    criadoEm: min(l.criadoEm, r.criadoEm),
  };
}

function mesclarProgressoLicao(l: ProgressoLicao, r: ProgressoLicao): ProgressoLicao {
  const lc = l.ultimaConclusao ?? -1;
  const rc = r.ultimaConclusao ?? -1;
  const lNovo = lc >= rc;
  const novo = lNovo ? l : r;
  const ultima = max(lc, rc);
  return {
    coroas: max(l.coroas, r.coroas) as ProgressoLicao['coroas'],
    vezesConcluida: max(l.vezesConcluida, r.vezesConcluida),
    ultimaConclusao: ultima === -1 ? null : ultima,
    proximaRevisao: novo.proximaRevisao ?? (lNovo ? r.proximaRevisao : l.proximaRevisao),
    errosPendentes: novo.errosPendentes,
  };
}

/**
 * Mescla o estado LOCAL com o REMOTO da nuvem, preservando o melhor dos dois.
 * `agora` (ms) e obrigatorio: o streak vivo se decide contra o relogio.
 */
export function mesclarEstado(local: EstadoV1, remoto: EstadoV1, agora: number): EstadoV1 {
  const localSemente = ehSemente(local);
  const remotoSemente = ehSemente(remoto);
  const wallet =
    localSemente && !remotoSemente
      ? remoto.wallet
      : remotoSemente && !localSemente
        ? local.wallet
        : mesclarWallet(local.wallet, remoto.wallet, agora);

  /* Progresso: uniao por licaoId; colisao mescla (nunca perde licao concluida). */
  const progresso: Record<string, ProgressoLicao> = { ...local.progresso };
  for (const [id, p] of Object.entries(remoto.progresso)) {
    progresso[id] = progresso[id] ? mesclarProgressoLicao(progresso[id], p) : p;
  }

  /* Score de Paladar por dimensao: o mais recente por timestamp; empate -> o maior. */
  const scorePaladar = {} as ScorePaladar;
  const scorePaladarTs = {} as Record<Habilidade, number>;
  for (const h of HABILIDADES) {
    const tl = local.scorePaladarTs[h] ?? 0;
    const tr = remoto.scorePaladarTs[h] ?? 0;
    const vl = local.scorePaladar[h] ?? 0;
    const vr = remoto.scorePaladar[h] ?? 0;
    scorePaladar[h] = tl > tr ? vl : tr > tl ? vr : max(vl, vr);
    scorePaladarTs[h] = max(tl, tr);
  }

  /* Empate de objetivo/nivel: decide o lado de maior atividade (dataHoje). */
  const ladoAtivo = local.wallet.dataHoje >= remoto.wallet.dataHoje ? local : remoto;

  /* Perfil (nome/avatar): vence a edicao mais recente (perfilTs); se o lado
     vencedor nao definiu o campo, cai no outro. */
  const perfilLocalNovo = local.perfilTs >= remoto.perfilTs;
  const nome = perfilLocalNovo ? (local.nome ?? remoto.nome) : (remoto.nome ?? local.nome);
  const avatar = perfilLocalNovo ? (local.avatar ?? remoto.avatar) : (remoto.avatar ?? local.avatar);

  return {
    versao: 1,
    wallet,
    progresso,
    scorePaladar,
    scorePaladarTs,
    checkpoints: [...new Set([...local.checkpoints, ...remoto.checkpoints])],
    microAulas: [...new Set([...local.microAulas, ...remoto.microAulas])],
    ultimoDesafioXp: dataMaisRecente(local.ultimoDesafioXp, remoto.ultimoDesafioXp),
    objetivo: escolherNaoNulo(local.objetivo, remoto.objetivo, ladoAtivo.objetivo),
    nivelDeclarado: escolherNaoNulo(local.nivelDeclarado, remoto.nivelDeclarado, ladoAtivo.nivelDeclarado),
    onboardingCompleto: local.onboardingCompleto || remoto.onboardingCompleto,
    nome,
    avatar,
    perfilTs: max(local.perfilTs, remoto.perfilTs),
  };
}
