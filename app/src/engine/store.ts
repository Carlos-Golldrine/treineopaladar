/**
 * Persistencia e orquestracao do engine.
 * localStorage, chave "tp.v1", com versionamento e migracao.
 * Tudo lazy: rollover de dia, regen de vidas e decaimento de paladar
 * acontecem por timestamp, nunca por timer.
 */

import type {
  Coroas,
  Dificuldade,
  EstadoV1,
  Habilidade,
  Licao,
  Nivel,
  Objetivo,
  ProgressoLicao,
  ScorePaladar,
  Wallet,
} from './types';
import { HABILIDADES, OBJETIVOS } from './types';
import {
  CRISTAIS_BOAS_VINDAS,
  CRISTAIS_META_DIARIA,
  META_DIARIA_PADRAO,
  PRECOS_LOJA,
  XP_CHECKPOINT,
  XP_DESAFIO_DIA,
  XP_MICRO_AULA,
  XP_REVISAO,
  ehD0,
  multiplicadorSoftCap,
} from './economia';
import type { ItemLoja } from './economia';
import { VIDAS_MAX, ganhar, perder, podeIniciar, proximaVidaEmMs, regenerar } from './vidas';
import { registrarDiaConcluido, streakEfetivo, streakEmRisco } from './streak';
import { mesclarEstado } from './merge';
import { proximaRevisaoTs, revisoesVencidas } from './revisao';
import {
  PALADAR_GANHO,
  PALADAR_MAX,
  aplicarPaladar,
  decairPaladar,
  finalizarSessao,
  iniciarSessao,
  responder,
  sessaoConcluida,
} from './sessao';
import type { EfeitoResposta, ResultadoSessao, Sessao, TipoSessao } from './sessao';
import { dataLocal } from './tempo';

export const CHAVE_STORE = 'tp.v1';
export const VERSAO_ESTADO = 1 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/* --------------------- Estado inicial e migracao -------------------- */

function walletInicial(agora: number): Wallet {
  return {
    xpTotal: 0,
    cristais: CRISTAIS_BOAS_VINDAS,
    vidas: VIDAS_MAX,
    vidasTs: agora,
    streak: 0,
    bestStreak: 0,
    freezes: 0,
    lastDone: null,
    metaDiaria: META_DIARIA_PADRAO,
    xpHoje: 0,
    dataHoje: dataLocal(agora),
    licoesHoje: 0,
    praticasHoje: 0,
    criadoEm: agora,
  };
}

function scoreZerado(): ScorePaladar {
  const score = {} as ScorePaladar;
  for (const h of HABILIDADES) score[h] = 0;
  return score;
}

function tsZerado(agora: number): Record<Habilidade, number> {
  const ts = {} as Record<Habilidade, number>;
  for (const h of HABILIDADES) ts[h] = agora;
  return ts;
}

export function estadoInicial(agora: number): EstadoV1 {
  return {
    versao: VERSAO_ESTADO,
    wallet: walletInicial(agora),
    progresso: {},
    scorePaladar: scoreZerado(),
    scorePaladarTs: tsZerado(agora),
    checkpoints: [],
    microAulas: [],
    ultimoDesafioXp: null,
    objetivo: null,
    nivelDeclarado: null,
    onboardingCompleto: false,
    nome: null,
    avatar: null,
    perfilTs: 0,
  };
}

/**
 * Migra o objetivo persistido para o conjunto vigente de 6 valores.
 * 'hobby' (conjunto original de 4) vira 'outros'; valor desconhecido
 * volta a null (o app pergunta de novo, nunca quebra).
 */
function migrarObjetivo(bruto: unknown): Objetivo | null {
  if (bruto === 'hobby') return 'outros';
  return OBJETIVOS.includes(bruto as Objetivo) ? (bruto as Objetivo) : null;
}

/**
 * Migra qualquer dado bruto para o formato vigente.
 * Store vazio ou corrompido vira estado inicial (com boas-vindas).
 * Versao igual a vigente: campos faltantes ganham default (forward-compat).
 * Versao desconhecida: recomeca (v1 e a primeira versao publicada).
 */
export function migrar(bruto: unknown, agora: number): EstadoV1 {
  const base = estadoInicial(agora);
  if (bruto === null || typeof bruto !== 'object') return base;
  const dado = bruto as Record<string, unknown>;
  if (dado.versao !== VERSAO_ESTADO) return base;
  const wallet = (dado.wallet ?? {}) as Partial<Wallet>;
  const progressoBruto = (dado.progresso ?? {}) as Record<string, Partial<ProgressoLicao>>;
  const progresso: Record<string, ProgressoLicao> = {};
  for (const [id, p] of Object.entries(progressoBruto)) {
    progresso[id] = {
      coroas: (p.coroas ?? 0) as Coroas,
      vezesConcluida: p.vezesConcluida ?? 0,
      ultimaConclusao: p.ultimaConclusao ?? null,
      proximaRevisao: p.proximaRevisao ?? null,
      errosPendentes: Array.isArray(p.errosPendentes) ? p.errosPendentes : [],
    };
  }
  return {
    versao: VERSAO_ESTADO,
    wallet: { ...base.wallet, ...wallet },
    progresso,
    scorePaladar: { ...base.scorePaladar, ...((dado.scorePaladar ?? {}) as Partial<ScorePaladar>) },
    scorePaladarTs: {
      ...base.scorePaladarTs,
      ...((dado.scorePaladarTs ?? {}) as Partial<Record<Habilidade, number>>),
    },
    checkpoints: Array.isArray(dado.checkpoints)
      ? dado.checkpoints.filter((c): c is string => typeof c === 'string')
      : [],
    microAulas: Array.isArray(dado.microAulas)
      ? dado.microAulas.filter((m): m is string => typeof m === 'string')
      : [],
    ultimoDesafioXp: typeof dado.ultimoDesafioXp === 'string' ? dado.ultimoDesafioXp : null,
    objetivo: migrarObjetivo(dado.objetivo),
    nivelDeclarado: (dado.nivelDeclarado as Nivel | undefined) ?? null,
    onboardingCompleto: dado.onboardingCompleto === true,
    nome: typeof dado.nome === 'string' ? dado.nome : null,
    avatar: typeof dado.avatar === 'string' ? dado.avatar : null,
    perfilTs: typeof dado.perfilTs === 'number' ? dado.perfilTs : 0,
  };
}

function carregar(storage: StorageLike, agora: number): EstadoV1 {
  let bruto: unknown = null;
  try {
    const cru = storage.getItem(CHAVE_STORE);
    if (cru) bruto = JSON.parse(cru);
  } catch {
    bruto = null;
  }
  return migrar(bruto, agora);
}

/* ------------------------------ Store ------------------------------- */

export interface SessaoAtiva {
  sessao: Sessao;
  licao: Licao;
}

/** Resposta de um exercicio do modo pratica (drill do banco da fabrica). */
export interface RespostaPratica {
  correto: boolean;
  dificuldade: Dificuldade;
  habilidade: Habilidade;
}

export interface ResultadoPratica {
  acertos: number;
  erros: number;
  /** XP de revisao (10), com soft cap proprio do dia (D0 isento). */
  xp: number;
  /** True quando a sessao devolveu 1 vida (regra de revisao do engine). */
  vidaRecuperada: boolean;
}

type Ouvinte = () => void;

export class TPStore {
  private estado: EstadoV1;
  private sessaoAtiva: SessaoAtiva | null = null;
  private ultimoResultado: ResultadoSessao | null = null;
  private ouvintes = new Set<Ouvinte>();
  private storage: StorageLike;
  private agora: () => number;

  constructor(storage: StorageLike, agora: () => number = Date.now) {
    this.storage = storage;
    this.agora = agora;
    this.estado = carregar(storage, agora());
    this.persistir();
  }

  /* ------------------------- Leitura ------------------------- */

  getEstado(): EstadoV1 {
    return this.estado;
  }

  getWallet(): Wallet {
    return this.estado.wallet;
  }

  getSessao(): SessaoAtiva | null {
    return this.sessaoAtiva;
  }

  getUltimoResultado(): ResultadoSessao | null {
    return this.ultimoResultado;
  }

  /** Score por dimensao ja com o decaimento lazy aplicado (sem persistir). */
  scorePaladarAtual(): ScorePaladar {
    const agora = this.agora();
    const atual = {} as ScorePaladar;
    for (const h of HABILIDADES) {
      atual[h] = decairPaladar(this.estado.scorePaladar[h], this.estado.scorePaladarTs[h], agora);
    }
    return atual;
  }

  revisoesVencidas(): string[] {
    return revisoesVencidas(this.estado.progresso, this.agora());
  }

  streakEfetivo(): number {
    return streakEfetivo(this.estado.wallet, this.agora());
  }

  streakEmRisco(): boolean {
    return streakEmRisco(this.estado.wallet, this.agora());
  }

  proximaVidaEmMs(): number | null {
    const { vidas, vidasTs } = this.estado.wallet;
    return proximaVidaEmMs({ vidas, vidasTs }, this.agora());
  }

  podeIniciar(tipo: TipoSessao): boolean {
    const { vidas, vidasTs } = this.estado.wallet;
    const r = regenerar({ vidas, vidasTs }, this.agora());
    return podeIniciar(r.vidas, tipo);
  }

  subscribe(ouvinte: Ouvinte): () => void {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

  /* ----------------------- Sincronizacao ---------------------- */

  /**
   * Aplica o tempo que passou: rollover do dia (zera xpHoje/licoesHoje) e
   * regeneracao de vidas. Chamar ao abrir o app e antes de mutacoes.
   */
  sincronizar(): void {
    const agora = this.agora();
    let w = this.estado.wallet;
    let mudou = false;

    const hoje = dataLocal(agora);
    if (w.dataHoje !== hoje) {
      w = { ...w, dataHoje: hoje, xpHoje: 0, licoesHoje: 0, praticasHoje: 0 };
      mudou = true;
    }

    const r = regenerar({ vidas: w.vidas, vidasTs: w.vidasTs }, agora);
    if (r.vidas !== w.vidas || r.vidasTs !== w.vidasTs) {
      w = { ...w, vidas: r.vidas, vidasTs: r.vidasTs };
      mudou = true;
    }

    if (mudou) this.commit({ ...this.estado, wallet: w });
  }

  /**
   * Mescla o estado local com o vindo da nuvem (hidratacao da F3), preservando o
   * melhor dos dois: onboardingCompleto nunca regride, progresso/XP/streak nunca
   * se perdem e a moeda nao infla. Apos o merge, sincronizar() aplica o rollover
   * de dia e a regen de vidas sobre o estado ja combinado.
   */
  hidratar(estado: EstadoV1): void {
    this.commit(mesclarEstado(this.estado, estado, this.agora()));
    this.sincronizar();
  }

  /* ------------------------- Sessao --------------------------- */

  /**
   * Inicia uma sessao da licao. Com 0 vidas, so revisao e liberada
   * (retorna null para nova). Sessao anterior nao finalizada e descartada.
   */
  iniciarLicao(licao: Licao, tipo: TipoSessao): Sessao | null {
    this.sincronizar();
    if (!podeIniciar(this.estado.wallet.vidas, tipo)) return null;
    const pendentes = this.estado.progresso[licao.id]?.errosPendentes ?? [];
    const sessao = iniciarSessao(licao, tipo, this.agora(), pendentes);
    this.sessaoAtiva = { sessao, licao };
    this.ultimoResultado = null;
    this.notificar();
    return sessao;
  }

  /**
   * Registra a resposta do exercicio atual. O primeiro erro da licao nao
   * custa vida (grace); os seguintes custam 1 cada, mas a sessao segue ate
   * o fim mesmo zerando as vidas (o bloqueio e so para INICIAR licao nova).
   */
  responder(correto: boolean): EfeitoResposta | null {
    if (!this.sessaoAtiva) return null;
    const { sessao, licao } = this.sessaoAtiva;
    if (sessaoConcluida(sessao)) return null;
    const efeito = responder(sessao, correto, licao);
    this.sessaoAtiva = { sessao: efeito.sessao, licao };
    if (efeito.custouVida) {
      const agora = this.agora();
      const w = this.estado.wallet;
      const r = perder({ vidas: w.vidas, vidasTs: w.vidasTs }, agora);
      this.commit({ ...this.estado, wallet: { ...w, vidas: r.vidas, vidasTs: r.vidasTs } });
    } else {
      this.notificar();
    }
    return efeito;
  }

  /**
   * Finaliza a sessao concluida e aplica tudo: XP (com soft cap, D0 isento),
   * cristais (+10 ao cruzar a meta diaria), streak, progresso da licao,
   * agenda de revisao espacada, Score de Paladar e a vida recuperada por
   * concluir revisao.
   */
  finalizarLicao(): ResultadoSessao | null {
    if (!this.sessaoAtiva) return null;
    const { sessao, licao } = this.sessaoAtiva;
    if (!sessaoConcluida(sessao)) return null;

    this.sincronizar();
    const agora = this.agora();
    let w = this.estado.wallet;

    const resultado = finalizarSessao(sessao, agora, {
      licoesConcluidasHoje: w.licoesHoje,
      isentoD0: ehD0(w.criadoEm, agora),
    });

    /* XP e meta diaria (cristais +10 uma vez, ao cruzar a meta) */
    const xpAntes = w.xpHoje;
    const xpHoje = xpAntes + resultado.xp;
    let cristais = w.cristais + resultado.cristais;
    if (xpAntes < w.metaDiaria && xpHoje >= w.metaDiaria) {
      cristais += CRISTAIS_META_DIARIA;
    }
    w = {
      ...w,
      xpTotal: w.xpTotal + resultado.xp,
      xpHoje,
      cristais,
      licoesHoje: sessao.tipo === 'nova' ? w.licoesHoje + 1 : w.licoesHoje,
    };

    /* Streak: dia com >= 1 licao concluida (nova ou revisao) */
    const s = registrarDiaConcluido(w, agora);
    w = { ...w, streak: s.streak, bestStreak: s.bestStreak, freezes: s.freezes, lastDone: s.lastDone };

    /* Revisao concluida recupera 1 vida */
    if (sessao.tipo === 'revisao') {
      const r = ganhar({ vidas: w.vidas, vidasTs: w.vidasTs }, 1, agora);
      w = { ...w, vidas: r.vidas, vidasTs: r.vidasTs };
    }

    /* Progresso da licao + agenda de revisao espacada */
    const anterior: ProgressoLicao = this.estado.progresso[licao.id] ?? {
      coroas: 0,
      vezesConcluida: 0,
      ultimaConclusao: null,
      proximaRevisao: null,
      errosPendentes: [],
    };
    const vezesConcluida = anterior.vezesConcluida + 1;
    const progresso: Record<string, ProgressoLicao> = {
      ...this.estado.progresso,
      [licao.id]: {
        coroas:
          sessao.tipo === 'nova'
            ? (Math.min(3, anterior.coroas + 1) as Coroas)
            : anterior.coroas,
        vezesConcluida,
        ultimaConclusao: agora,
        proximaRevisao: proximaRevisaoTs(vezesConcluida, agora),
        errosPendentes: resultado.errosPendentes,
      },
    };

    /* Score de Paladar: decai lazy, depois soma os acertos da sessao */
    const h = licao.habilidade;
    const decaido = decairPaladar(this.estado.scorePaladar[h], this.estado.scorePaladarTs[h], agora);
    const scorePaladar: ScorePaladar = {
      ...this.estado.scorePaladar,
      [h]: aplicarPaladar(decaido, sessao),
    };
    const scorePaladarTs = { ...this.estado.scorePaladarTs, [h]: agora };

    this.sessaoAtiva = null;
    this.ultimoResultado = resultado;
    this.commit({ ...this.estado, wallet: w, progresso, scorePaladar, scorePaladarTs });
    return resultado;
  }

  /** Abandona a sessao ativa sem aplicar nada (sem penalidade extra). */
  abandonarSessao(): void {
    if (!this.sessaoAtiva) return;
    this.sessaoAtiva = null;
    this.notificar();
  }

  /* --------------- Eventos de XP fora de sessao --------------- */

  /**
   * Paga o checkpoint da unidade (XP 50), uma unica vez por unidade.
   * Chamar quando a ultima licao da unidade for concluida.
   * Retorna o XP pago, ou null se este checkpoint ja foi pago.
   */
  concluirCheckpoint(unidadeId: string): number | null {
    this.sincronizar();
    if (this.estado.checkpoints.includes(unidadeId)) return null;
    const wallet = this.aplicarXpAvulso(this.estado.wallet, XP_CHECKPOINT);
    this.commit({
      ...this.estado,
      wallet,
      checkpoints: [...this.estado.checkpoints, unidadeId],
    });
    return XP_CHECKPOINT;
  }

  /**
   * Paga a micro-aula da unidade assistida INTEIRA (XP 5), uma unica vez
   * por unidade. Pular nao paga; reassistir inteira depois paga (se ainda
   * nao pagou). Retorna o XP pago, ou null se esta unidade ja foi paga.
   */
  concluirMicroAula(unidadeId: string): number | null {
    this.sincronizar();
    if (this.estado.microAulas.includes(unidadeId)) return null;
    const wallet = this.aplicarXpAvulso(this.estado.wallet, XP_MICRO_AULA);
    this.commit({
      ...this.estado,
      wallet,
      microAulas: [...this.estado.microAulas, unidadeId],
    });
    return XP_MICRO_AULA;
  }

  /**
   * Paga o XP do Desafio do Dia (30), uma unica vez por dia.
   * `dia` e a data oficial do desafio (YYYY-MM-DD em America/Sao_Paulo).
   * Retorna o XP pago, ou null se o desafio de hoje ja foi premiado.
   */
  concluirDesafioDia(dia: string): number | null {
    this.sincronizar();
    if (this.estado.ultimoDesafioXp === dia) return null;
    const wallet = this.aplicarXpAvulso(this.estado.wallet, XP_DESAFIO_DIA);
    this.commit({ ...this.estado, wallet, ultimoDesafioXp: dia });
    return XP_DESAFIO_DIA;
  }

  /**
   * Conclui uma sessao do modo pratica (drill do banco da fabrica):
   * XP de revisao (10) com soft cap proprio por sessoes de pratica do dia
   * (D0 isento), +1 vida (regra de revisao), streak do dia e Score de
   * Paladar por habilidade de cada acerto. Nunca exige vidas.
   */
  concluirPratica(respostas: readonly RespostaPratica[]): ResultadoPratica {
    this.sincronizar();
    const agora = this.agora();
    let w = this.estado.wallet;

    const mult = ehD0(w.criadoEm, agora) ? 1 : multiplicadorSoftCap(w.praticasHoje);
    const xp = Math.round(XP_REVISAO * mult);
    w = this.aplicarXpAvulso(w, xp);
    w = { ...w, praticasHoje: w.praticasHoje + 1 };

    /* Streak: pratica tambem garante o dia (e revisao) */
    const s = registrarDiaConcluido(w, agora);
    w = { ...w, streak: s.streak, bestStreak: s.bestStreak, freezes: s.freezes, lastDone: s.lastDone };

    /* Concluir sessao de revisao recupera 1 vida */
    const antes = w.vidas;
    const r = ganhar({ vidas: w.vidas, vidasTs: w.vidasTs }, 1, agora);
    w = { ...w, vidas: r.vidas, vidasTs: r.vidasTs };

    /* Score de Paladar: decai lazy e soma acerto a acerto, por habilidade */
    const scorePaladar = { ...this.estado.scorePaladar };
    const scorePaladarTs = { ...this.estado.scorePaladarTs };
    for (const resposta of respostas) {
      if (!resposta.correto) continue;
      const h = resposta.habilidade;
      const decaido = decairPaladar(scorePaladar[h], scorePaladarTs[h], agora);
      scorePaladar[h] = Math.min(
        PALADAR_MAX,
        decaido + (PALADAR_MAX - decaido) * PALADAR_GANHO * resposta.dificuldade,
      );
      scorePaladarTs[h] = agora;
    }

    this.commit({ ...this.estado, wallet: w, scorePaladar, scorePaladarTs });
    const acertos = respostas.filter((resposta) => resposta.correto).length;
    return {
      acertos,
      erros: respostas.length - acertos,
      xp,
      vidaRecuperada: w.vidas > antes,
    };
  }

  /** Aplica XP no placar e no dia, pagando +10 cristais ao cruzar a meta. */
  private aplicarXpAvulso(w: Wallet, xp: number): Wallet {
    const xpHoje = w.xpHoje + xp;
    let cristais = w.cristais;
    if (w.xpHoje < w.metaDiaria && xpHoje >= w.metaDiaria) {
      cristais += CRISTAIS_META_DIARIA;
    }
    return { ...w, xpTotal: w.xpTotal + xp, xpHoje, cristais };
  }

  /* -------------------------- Loja ---------------------------- */

  /**
   * Compra um item da loja. Freeze, recarga e vida avulsa aplicam efeito
   * aqui; dobro de XP e desbloqueios so debitam (o efeito e da camada de
   * produto/UI). Retorna false se faltam cristais.
   */
  comprar(item: ItemLoja): boolean {
    this.sincronizar();
    const preco = PRECOS_LOJA[item];
    const w = this.estado.wallet;
    if (w.cristais < preco) return false;
    const agora = this.agora();
    let novo: Wallet = { ...w, cristais: w.cristais - preco };
    if (item === 'freeze') {
      novo = { ...novo, freezes: novo.freezes + 1 };
    } else if (item === 'recargaVidas') {
      novo = { ...novo, vidas: VIDAS_MAX, vidasTs: agora };
    } else if (item === 'vidaAvulsa') {
      const r = ganhar({ vidas: novo.vidas, vidasTs: novo.vidasTs }, 1, agora);
      novo = { ...novo, vidas: r.vidas, vidasTs: r.vidasTs };
    }
    this.commit({ ...this.estado, wallet: novo });
    return true;
  }

  /**
   * Debita a dica de exercicio (10 cristais). O EFEITO (eliminar
   * alternativa, revelar regra, estreitar faixa) e da camada de UI.
   * Retorna false sem debitar quando faltam cristais.
   */
  usarDica(): boolean {
    return this.comprar('dica');
  }

  /* ----------------------- Onboarding ------------------------- */

  definirObjetivo(objetivo: Objetivo): void {
    this.commit({ ...this.estado, objetivo });
  }

  definirNivel(nivel: Nivel): void {
    this.commit({ ...this.estado, nivelDeclarado: nivel });
  }

  definirMetaDiaria(metaDiaria: number): void {
    this.commit({ ...this.estado, wallet: { ...this.estado.wallet, metaDiaria } });
  }

  /** Nome de exibicao (perfil + Mesa). String vazia limpa o nome. */
  definirNome(nome: string): void {
    const limpo = nome.trim().slice(0, 30);
    this.commit({ ...this.estado, nome: limpo.length ? limpo : null, perfilTs: this.agora() });
  }

  /** Avatar-preset escolhido (id curto). */
  definirAvatar(avatar: string): void {
    this.commit({ ...this.estado, avatar, perfilTs: this.agora() });
  }

  concluirOnboarding(): void {
    this.commit({ ...this.estado, onboardingCompleto: true });
  }

  /* ------------------------ Internos -------------------------- */

  private commit(estado: EstadoV1): void {
    this.estado = estado;
    this.persistir();
    this.notificar();
  }

  private persistir(): void {
    try {
      this.storage.setItem(CHAVE_STORE, JSON.stringify(this.estado));
    } catch {
      /* quota cheia ou modo privado: o estado em memoria segue valendo */
    }
  }

  private notificar(): void {
    for (const ouvinte of this.ouvintes) ouvinte();
  }
}

/* ------------------- Fabrica e singleton padrao --------------------- */

export interface OpcoesStore {
  storage?: StorageLike;
  agora?: () => number;
}

export function criarStore(opcoes: OpcoesStore = {}): TPStore {
  return new TPStore(opcoes.storage ?? storagePadrao(), opcoes.agora ?? Date.now);
}

function storagePadrao(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    /* ambiente sem localStorage */
  }
  const memoria = new Map<string, string>();
  return {
    getItem: (k) => memoria.get(k) ?? null,
    setItem: (k, v) => {
      memoria.set(k, v);
    },
  };
}

let instanciaPadrao: TPStore | null = null;

/** Store unico do app (localStorage real). Hooks usam este. */
export function obterStore(): TPStore {
  if (!instanciaPadrao) instanciaPadrao = criarStore();
  return instanciaPadrao;
}

/** So para testes: derruba o singleton. */
export function resetarStorePadrao(): void {
  instanciaPadrao = null;
}
