/**
 * Contrato do banco de pratica gerado pela fabrica de questoes
 * (scripts/fabrica_questoes.py -> src/content/pratica/banco-pratica.json).
 * Os payloads sao os mesmos do contrato de licao (mc/intruso) acrescidos
 * dos campos de catalogo da fabrica.
 */
import type { ExercicioIntruso, ExercicioMC, Habilidade } from '../content/types';

interface CatalogoFabrica {
  id: string;
  template: string;
  habilidade: Habilidade;
  vinhoId?: string;
  vinhoIdB?: string;
  variante?: string;
}

export type ItemPratica = (ExercicioMC | ExercicioIntruso) & CatalogoFabrica;

export interface BancoPratica {
  geradoEm: string;
  seed: number;
  total: number;
  porTemplate: Record<string, number>;
  porDificuldade: Record<string, number>;
  porHabilidade: Record<string, number>;
  exercicios: ItemPratica[];
}

/** Nome de gente para cada habilidade (UI da pratica e do perfil). */
export const NOME_HABILIDADE: Record<Habilidade, string> = {
  tanino: 'tanino',
  acidez: 'acidez',
  corpo: 'corpo',
  docura: 'doçura',
  frutado: 'frutado',
  rotulo: 'leitura de rótulo',
  harmonizacao: 'harmonização',
};
