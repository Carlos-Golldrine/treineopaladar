/**
 * Barrel tipado do conteudo autoral: 6 unidades x 5 licoes.
 * Importa os JSON e os expoe com os types do contrato (./types).
 * Fatos enologicos vivem SOMENTE na fichaCanonica de cada licao.
 * O banco de pratica e os desafios do dia NAO moram aqui: sao lazy
 * (import dinamico nas rotas), fora do caminho critico.
 */
import type { Licao, UnidadeMeta } from './types';

import unidade1MetaJson from './unidade-1.meta.json';
import unidade2MetaJson from './unidade-2.meta.json';
import unidade3MetaJson from './unidade-3.meta.json';
import unidade4MetaJson from './unidade-4.meta.json';
import unidade5MetaJson from './unidade-5.meta.json';
import unidade6MetaJson from './unidade-6.meta.json';

import u1l1 from './unidade-1/licao-01.json';
import u1l2 from './unidade-1/licao-02.json';
import u1l3 from './unidade-1/licao-03.json';
import u1l4 from './unidade-1/licao-04.json';
import u1l5 from './unidade-1/licao-05.json';
import u2l1 from './unidade-2/licao-01.json';
import u2l2 from './unidade-2/licao-02.json';
import u2l3 from './unidade-2/licao-03.json';
import u2l4 from './unidade-2/licao-04.json';
import u2l5 from './unidade-2/licao-05.json';
import u3l1 from './unidade-3/licao-01.json';
import u3l2 from './unidade-3/licao-02.json';
import u3l3 from './unidade-3/licao-03.json';
import u3l4 from './unidade-3/licao-04.json';
import u3l5 from './unidade-3/licao-05.json';
import u4l1 from './unidade-4/licao-01.json';
import u4l2 from './unidade-4/licao-02.json';
import u4l3 from './unidade-4/licao-03.json';
import u4l4 from './unidade-4/licao-04.json';
import u4l5 from './unidade-4/licao-05.json';
import u5l1 from './unidade-5/licao-01.json';
import u5l2 from './unidade-5/licao-02.json';
import u5l3 from './unidade-5/licao-03.json';
import u5l4 from './unidade-5/licao-04.json';
import u5l5 from './unidade-5/licao-05.json';
import u6l1 from './unidade-6/licao-01.json';
import u6l2 from './unidade-6/licao-02.json';
import u6l3 from './unidade-6/licao-03.json';
import u6l4 from './unidade-6/licao-04.json';
import u6l5 from './unidade-6/licao-05.json';

const asLicao = (raw: unknown): Licao => raw as Licao;
const asMeta = (raw: unknown): UnidadeMeta => raw as UnidadeMeta;

/** Uma unidade da trilha: meta + licoes na ordem de jogo. */
export interface Unidade {
  meta: UnidadeMeta;
  licoes: readonly Licao[];
}

/**
 * Monta a unidade respeitando meta.ordemLicoes (a ordem de JOGO pode
 * diferir da ordem autoral dos arquivos; ex.: u1 abre pela docura, C6).
 * Id fora do meta ou faltando: cai na ordem dos arquivos, nada some.
 */
function montarUnidade(metaRaw: unknown, licoesRaw: unknown[]): Unidade {
  const meta = asMeta(metaRaw);
  const licoes = licoesRaw.map(asLicao);
  const porId = new Map(licoes.map((l) => [l.id, l]));
  const ordenadas = meta.ordemLicoes
    .map((id) => porId.get(id))
    .filter((l): l is Licao => l !== undefined);
  return { meta, licoes: ordenadas.length === licoes.length ? ordenadas : licoes };
}

/** As 6 unidades, na ordem da trilha. */
export const unidades: readonly Unidade[] = [
  montarUnidade(unidade1MetaJson, [u1l1, u1l2, u1l3, u1l4, u1l5]),
  montarUnidade(unidade2MetaJson, [u2l1, u2l2, u2l3, u2l4, u2l5]),
  montarUnidade(unidade3MetaJson, [u3l1, u3l2, u3l3, u3l4, u3l5]),
  montarUnidade(unidade4MetaJson, [u4l1, u4l2, u4l3, u4l4, u4l5]),
  montarUnidade(unidade5MetaJson, [u5l1, u5l2, u5l3, u5l4, u5l5]),
  montarUnidade(unidade6MetaJson, [u6l1, u6l2, u6l3, u6l4, u6l5]),
];

export const unidade1Meta: UnidadeMeta = unidades[0].meta;

export const licoesUnidade1: readonly Licao[] = unidades[0].licoes;

/** Todas as 30 licoes, na ordem da trilha. */
export const todasLicoes: readonly Licao[] = unidades.flatMap((u) => [...u.licoes]);

export const licoesPorId: Readonly<Record<string, Licao>> = Object.fromEntries(
  todasLicoes.map((licao) => [licao.id, licao]),
);

/** Unidade dona de uma licao (ex.: "u3-l2" -> unidade u3), ou undefined. */
export function unidadeDaLicao(licaoId: string): Unidade | undefined {
  return unidades.find((u) => u.licoes.some((l) => l.id === licaoId));
}

export * from './types';
