/**
 * Flashcards do modo "Revisar com cartas".
 *
 * Os cards sao derivados PROGRAMATICAMENTE das fichas canonicas das
 * licoes (1 card por fato): a frente e o proprio fato com a palavra-chave
 * ocultada (lacuna), o verso e o fato inteiro. Nenhum texto inventado:
 * a unica transformacao e esconder uma palavra.
 *
 * Repeticao espacada por card (D+1 / D+3 / D+7 / D+21, mesma regua das
 * licoes), em chave propria de localStorage (tp.cartas.v1):
 * - "Sabia"     sobe um degrau na regua
 * - "Quase"     repete o degrau atual
 * - "Nao sabia" volta ao D+1
 */

import type { Habilidade, Licao } from '../engine';
import { INTERVALOS_REVISAO_DIAS, MS_DIA } from '../engine';

/* --------------------------- Derivacao ------------------------------ */

export interface Carta {
  /** Estavel: "u1-l1:2" (licao + indice do fato na ficha). */
  id: string;
  licaoId: string;
  habilidade: Habilidade;
  /** Fato canonico integro (o verso do card). */
  fato: string;
  /** O fato com a palavra-chave trocada por lacuna (a frente do card). */
  frente: string;
  /** A palavra ocultada. */
  chave: string;
}

/** Palavras estruturais que nunca viram lacuna. */
const STOPWORDS = new Set([
  'sobre', 'entre', 'quando', 'onde', 'tambem', 'ainda', 'antes', 'depois',
  'desde', 'durante', 'enquanto', 'porque', 'apesar', 'assim', 'então',
  'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'outro', 'outra',
  'outros', 'outras', 'mesmo', 'mesma', 'mesmos', 'mesmas', 'aquele',
  'aquela', 'deles', 'delas', 'neste', 'nesta', 'desse', 'dessa', 'desta',
  'deste', 'pelos', 'pelas', 'geral', 'parte', 'partes', 'forma',
  'tende', 'tendem', 'costuma', 'costumam', 'podem', 'ficam', 'feito',
  'feita', 'feitos', 'feitas', 'grande', 'grandes', 'principal',
  'principais', 'principalmente', 'apenas', 'tanto', 'tanta', 'quanto',
  'qualquer', 'todos', 'todas', 'sempre', 'nunca', 'pelo', 'pela', 'como',
  'mais', 'menos', 'para', 'entao', 'quase', 'prevista', 'chamado', 'chamada',
  'presente', 'presentes', 'maior', 'menor', 'melhor', 'melhores',
  'depois', 'acima', 'abaixo', 'dentro', 'fora', 'lugar', 'vinho', 'vinhos',
  'sensacao', 'aroma', 'aromas', 'gosto', 'gostos', 'boca', 'taca', 'uvas',
]);

/** Minusculas sem acento, para comparar palavras. */
function normalizar(palavra: string): string {
  return palavra
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function tokens(texto: string): string[] {
  return texto.match(/[\p{L}][\p{L}'-]*/gu) ?? [];
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Troca TODAS as ocorrencias (palavra inteira) da chave pela lacuna. */
function ocultar(fato: string, chave: string): string {
  const re = new RegExp(`(^|[^\\p{L}])(${escaparRegex(chave)})(?=[^\\p{L}]|$)`, 'giu');
  return fato.replace(re, (_tudo, antes: string) => `${antes}_____`);
}

/**
 * Escolhe a palavra-chave de um fato, com variedade dentro da licao:
 * 1) nome proprio (maiuscula fora do inicio da frase, ex.: Bordeaux)
 * 2) palavra do titulo da licao presente no fato (ex.: tanino)
 * 3) palavra mais longa
 * Palavras ja usadas em outros cards da mesma licao perdem prioridade.
 */
function escolherChave(fato: string, titulo: string, usadas: Set<string>): string | null {
  const todas = tokens(fato);
  const candidatas = todas.filter((p) => p.length >= 5 && !STOPWORDS.has(normalizar(p)));
  if (candidatas.length === 0) return null;

  const doTitulo = new Set(tokens(titulo).map(normalizar));
  const primeiraDaFrase = normalizar(todas[0] ?? '');

  const pontuar = (p: string, indice: number): number => {
    const norm = normalizar(p);
    let pts = Math.min(p.length, 12); /* desempate: comprimento */
    if (/^\p{Lu}/u.test(p) && !(indice === 0 && norm === primeiraDaFrase)) pts += 40;
    if (doTitulo.has(norm)) pts += 24;
    /* adverbio/participio lembra pouco: lacuna fraca */
    if (/mente$/.test(norm)) pts -= 20;
    if (/^\p{Ll}/u.test(p) && /(ado|ada|ido|ida)s?$/.test(norm)) pts -= 10;
    if (usadas.has(norm)) pts -= 60; /* variedade dentro da licao */
    return pts;
  };

  let melhor: string | null = null;
  let melhorPts = -Infinity;
  candidatas.forEach((p) => {
    const indice = todas.indexOf(p);
    const pts = pontuar(p, indice);
    if (pts > melhorPts) {
      melhorPts = pts;
      melhor = p;
    }
  });
  return melhor;
}

/** Deriva os cards de um conjunto de licoes (1 por fato da ficha canonica). */
export function derivarCartas(licoes: readonly Licao[]): Carta[] {
  const cartas: Carta[] = [];
  for (const licao of licoes) {
    const usadas = new Set<string>();
    licao.fichaCanonica.forEach((fato, indice) => {
      const chave = escolherChave(fato, licao.titulo, usadas);
      if (!chave) return;
      usadas.add(normalizar(chave));
      cartas.push({
        id: `${licao.id}:${indice}`,
        licaoId: licao.id,
        habilidade: licao.habilidade,
        fato,
        frente: ocultar(fato, chave),
        chave,
      });
    });
  }
  return cartas;
}

/* ----------------------- Repeticao espacada -------------------------- */

export type AvaliacaoCarta = 'sabia' | 'quase' | 'naosabia';

export interface AgendaCarta {
  /** Degrau na regua D+1/3/7/21 (indice de INTERVALOS_REVISAO_DIAS). */
  fase: number;
  /** Instante (ms) da proxima revisao do card. */
  proxima: number;
}

export type AgendaCartas = Record<string, AgendaCarta>;

export const CHAVE_CARTAS = 'tp.cartas.v1';

export function lerAgenda(): AgendaCartas {
  try {
    const cru = localStorage.getItem(CHAVE_CARTAS);
    const dado: unknown = cru ? JSON.parse(cru) : null;
    if (dado && typeof dado === 'object' && !Array.isArray(dado)) {
      const agenda: AgendaCartas = {};
      for (const [id, item] of Object.entries(dado as Record<string, Partial<AgendaCarta>>)) {
        if (typeof item?.fase === 'number' && typeof item?.proxima === 'number') {
          agenda[id] = { fase: item.fase, proxima: item.proxima };
        }
      }
      return agenda;
    }
  } catch {
    /* sem storage */
  }
  return {};
}

export function gravarAgenda(agenda: AgendaCartas): void {
  try {
    localStorage.setItem(CHAVE_CARTAS, JSON.stringify(agenda));
  } catch {
    /* modo privado: a agenda vive so na sessao */
  }
}

/**
 * Aplica a autoavaliacao de um card e devolve a agenda nova (sem mutar).
 * Card nunca visto comeca no degrau 0 (D+1).
 */
export function avaliarCarta(
  agenda: AgendaCartas,
  cartaId: string,
  avaliacao: AvaliacaoCarta,
  agora: number,
): AgendaCartas {
  const atual = agenda[cartaId]?.fase ?? 0;
  const teto = INTERVALOS_REVISAO_DIAS.length - 1;
  const fase =
    avaliacao === 'naosabia' ? 0 : avaliacao === 'quase' ? Math.min(atual, teto) : Math.min(atual + 1, teto);
  return {
    ...agenda,
    [cartaId]: { fase, proxima: agora + INTERVALOS_REVISAO_DIAS[fase] * MS_DIA },
  };
}

/* --------------------------- Sessao ---------------------------------- */

export const TAMANHO_SESSAO_CARTAS = 10;

type Rng = () => number;

function embaralhar<T>(itens: T[], rng: Rng): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Quantos cards estao vencidos agora (para o convite da Pratica). */
export function cartasVencidas(cartas: readonly Carta[], agenda: AgendaCartas, agora: number): number {
  return cartas.filter((c) => agenda[c.id] !== undefined && agenda[c.id].proxima <= agora).length;
}

/**
 * Monta a sessao de ate 10 cards: vencidos primeiro (mais atrasado na
 * frente), depois cards nunca vistos (embaralhados), e por fim os
 * agendados mais proximos (para "mais uma rodada" nunca sair vazia).
 */
export function montarSessaoCartas(
  cartas: readonly Carta[],
  agenda: AgendaCartas,
  agora: number,
  rng: Rng = Math.random,
  tamanho: number = TAMANHO_SESSAO_CARTAS,
): Carta[] {
  const vencidas = cartas
    .filter((c) => agenda[c.id] !== undefined && agenda[c.id].proxima <= agora)
    .sort((a, b) => agenda[a.id].proxima - agenda[b.id].proxima);
  const novas = embaralhar(
    cartas.filter((c) => agenda[c.id] === undefined),
    rng,
  );
  const futuras = cartas
    .filter((c) => agenda[c.id] !== undefined && agenda[c.id].proxima > agora)
    .sort((a, b) => agenda[a.id].proxima - agenda[b.id].proxima);
  return [...vencidas, ...novas, ...futuras].slice(0, tamanho);
}
