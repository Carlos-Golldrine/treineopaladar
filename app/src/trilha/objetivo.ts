/**
 * Apresentacao do objetivo declarado (J3, Perfil, trilha).
 * Modulo leve de proposito: NAO importa o conteudo das unidades, para
 * nao inchar o chunk do FTUE (orcamento de performance do brief).
 */
import type { Objetivo } from '../engine';
import type { NomeIcone } from '../icones/Icones';

/** Rotulo humano do objetivo. Mesma copy dos cards da J3. */
export const ROTULO_OBJETIVO: Record<Objetivo, string> = {
  mercado: 'No mercado',
  restaurante: 'No restaurante',
  receber: 'Recebendo em casa',
  presente: 'Presentear',
  trabalho: 'Trabalho com vinho',
  outros: 'Outro motivo',
};

/** Icone do set proprio por objetivo (J3 e Perfil usam o mesmo). */
export const ICONE_OBJETIVO: Record<Objetivo, NomeIcone> = {
  mercado: 'cesta-mercado',
  restaurante: 'restaurante',
  receber: 'casa',
  presente: 'presente-bau',
  trabalho: 'taca',
  outros: 'ajuda',
};

/** Nota discreta no topo da trilha. So trabalho pede urgencia (prazo real). */
export const NOTA_OBJETIVO: Partial<Record<Objetivo, string>> = {
  trabalho:
    'Trilha no ritmo do balcão: rótulo e compra vêm logo depois dos fundamentos, prontos para o próximo turno.',
};
