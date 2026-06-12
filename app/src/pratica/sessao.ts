/**
 * Montagem da rodada de pratica: 8 exercicios do banco da fabrica,
 * puxando a habilidade mais fraca do Score de Paladar, evitando repetir
 * itens vistos ha pouco e abrindo/fechando facil (arco da sessao).
 */
import type { Habilidade, ScorePaladar } from '../engine';
import type { ItemPratica } from './tipos';

export const TAMANHO_RODADA = 8;
/** Quantos itens da rodada vem da habilidade mais fraca. */
const FOCO_FRACA = 4;
/** Memoria de itens recentes (nao repetir ate sair da janela). */
const CHAVE_VISTOS = 'tp.pratica.v1';
const MAX_VISTOS = 240;

export type Rng = () => number;

function lerVistos(): string[] {
  try {
    const cru = localStorage.getItem(CHAVE_VISTOS);
    const dado: unknown = cru ? JSON.parse(cru) : null;
    if (dado && typeof dado === 'object' && Array.isArray((dado as { vistos?: unknown }).vistos)) {
      return (dado as { vistos: unknown[] }).vistos.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    /* sem storage */
  }
  return [];
}

export function marcarVistos(ids: string[]): void {
  const todos = [...lerVistos(), ...ids].slice(-MAX_VISTOS);
  try {
    localStorage.setItem(CHAVE_VISTOS, JSON.stringify({ vistos: todos }));
  } catch {
    /* sem storage */
  }
}

/** Habilidade mais fraca do score, entre as que o banco cobre. */
export function habilidadeMaisFraca(
  score: ScorePaladar,
  cobertas: readonly Habilidade[],
): Habilidade {
  let fraca = cobertas[0];
  for (const h of cobertas) {
    if (score[h] < score[fraca]) fraca = h;
  }
  return fraca;
}

function embaralhar<T>(itens: T[], rng: Rng): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Ordena a rodada com o arco da sessao: abre facil, esquenta no meio e
 * fecha facil (a ultima impressao e de vitoria).
 */
function ordenarArco(itens: ItemPratica[]): ItemPratica[] {
  const asc = [...itens].sort((a, b) => a.dificuldade - b.dificuldade);
  const faceis = asc.filter((e) => e.dificuldade === 1);
  if (faceis.length < 2) return asc;
  const fecho = faceis[faceis.length - 1];
  const resto = asc.filter((e) => e !== fecho);
  return [...resto, fecho];
}

/**
 * Monta a rodada: 4 itens da habilidade mais fraca + 4 das demais,
 * fora da janela de vistos recentes (cai para o banco inteiro se faltar).
 */
export function montarRodada(
  banco: readonly ItemPratica[],
  score: ScorePaladar,
  rng: Rng = Math.random,
): { itens: ItemPratica[]; foco: Habilidade } {
  const vistos = new Set(lerVistos());
  const cobertas = [...new Set(banco.map((e) => e.habilidade))];
  const foco = habilidadeMaisFraca(score, cobertas);

  const frescos = banco.filter((e) => !vistos.has(e.id));
  const fonte = frescos.length >= TAMANHO_RODADA ? frescos : banco;

  const daFraca = embaralhar(
    fonte.filter((e) => e.habilidade === foco),
    rng,
  ).slice(0, FOCO_FRACA);

  /* Demais habilidades em rodizio, das mais fracas para as mais fortes */
  const outras = cobertas
    .filter((h) => h !== foco)
    .sort((a, b) => score[a] - score[b]);
  const porHabilidade = new Map(
    outras.map((h) => [h, embaralhar(fonte.filter((e) => e.habilidade === h), rng)]),
  );
  const complemento: ItemPratica[] = [];
  let rodada = 0;
  while (complemento.length < TAMANHO_RODADA - daFraca.length && rodada < 32) {
    for (const h of outras) {
      const fila = porHabilidade.get(h) ?? [];
      const item = fila[rodada];
      if (item) complemento.push(item);
      if (complemento.length >= TAMANHO_RODADA - daFraca.length) break;
    }
    rodada++;
  }

  /* Se ainda faltar (banco curto), completa com qualquer item fresco */
  const escolhidos = [...daFraca, ...complemento];
  if (escolhidos.length < TAMANHO_RODADA) {
    const ids = new Set(escolhidos.map((e) => e.id));
    for (const e of embaralhar([...fonte], rng)) {
      if (escolhidos.length >= TAMANHO_RODADA) break;
      if (!ids.has(e.id)) escolhidos.push(e);
    }
  }

  return { itens: ordenarArco(escolhidos.slice(0, TAMANHO_RODADA)), foco };
}

/** Rng deterministico (mulberry32) para as cenas de screenshot. */
export function rngDeterministico(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
