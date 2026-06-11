/**
 * Barrel tipado do conteudo autoral.
 * Importa os JSON da Unidade 1 e os expoe com os types do contrato (./types).
 * Fatos enologicos vivem SOMENTE na fichaCanonica de cada licao.
 */
import type { Licao, UnidadeMeta } from './types';

import unidade1MetaJson from './unidade-1.meta.json';
import licao01Json from './unidade-1/licao-01.json';
import licao02Json from './unidade-1/licao-02.json';
import licao03Json from './unidade-1/licao-03.json';
import licao04Json from './unidade-1/licao-04.json';
import licao05Json from './unidade-1/licao-05.json';

const asLicao = (raw: unknown): Licao => raw as Licao;

export const unidade1Meta: UnidadeMeta = unidade1MetaJson as UnidadeMeta;

export const licaoTanino: Licao = asLicao(licao01Json);
export const licaoAcidez: Licao = asLicao(licao02Json);
export const licaoCorpo: Licao = asLicao(licao03Json);
export const licaoDocura: Licao = asLicao(licao04Json);
export const licaoQuatroEixos: Licao = asLicao(licao05Json);

export const licoesUnidade1: readonly Licao[] = [
  licaoTanino,
  licaoAcidez,
  licaoCorpo,
  licaoDocura,
  licaoQuatroEixos,
];

export const licoesPorId: Readonly<Record<string, Licao>> = Object.fromEntries(
  licoesUnidade1.map((licao) => [licao.id, licao]),
);

export * from './types';
