/**
 * Ordenacao das unidades da trilha pelo objetivo declarado (DD C4 +
 * DECISOES secao 2: trilha unica adaptativa, unidades REORDENADAS pelo
 * objetivo). O gating continua sequencial: a unidade N abre quando a
 * anterior DESTA ordem fechar.
 *
 * Leitura do mapa (titulos): u1 Fundamentos · u2 Uvas tintas ·
 * u3 Brancos/roses/bolhas · u4 Comprar sem errar · u5 Harmonizacao ·
 * u6 Brasil e vizinhos.
 */
import type { Objetivo } from '../engine';
import { unidades } from '../content';
import type { Unidade } from '../content';

export const ORDEM_PADRAO: readonly string[] = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];

export const ORDEM_POR_OBJETIVO: Record<Objetivo, readonly string[]> = {
  /* compra cedo: a dor da prateleira nao espera a teoria inteira */
  mercado: ['u1', 'u4', 'u2', 'u3', 'u5', 'u6'],
  restaurante: ['u1', 'u5', 'u2', 'u3', 'u4', 'u6'],
  receber: ['u1', 'u5', 'u3', 'u2', 'u4', 'u6'],
  presente: ['u1', 'u4', 'u5', 'u2', 'u3', 'u6'],
  /* urgencia real (atendimento): rotulo e compra logo apos os fundamentos */
  trabalho: ['u1', 'u4', 'u2', 'u3', 'u5', 'u6'],
  outros: ORDEM_PADRAO,
};

/** Unidades na ordem da trilha do objetivo (null = ordem padrao). */
export function unidadesDoObjetivo(objetivo: Objetivo | null): readonly Unidade[] {
  const ordem = objetivo ? ORDEM_POR_OBJETIVO[objetivo] : ORDEM_PADRAO;
  const porId = new Map(unidades.map((u) => [u.meta.id, u]));
  const ordenadas = ordem
    .map((id) => porId.get(id))
    .filter((u): u is Unidade => u !== undefined);
  /* rede de seguranca: unidade fora do mapa nunca some da trilha */
  return ordenadas.length === unidades.length ? ordenadas : unidades;
}
