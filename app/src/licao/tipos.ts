/**
 * Contrato compartilhado dos componentes de exercicio do player.
 * Cada componente e dono da propria interacao (selecao, arraste, conferir)
 * e entrega ao player um unico veredito via onResolver.
 */

/**
 * respondendo: aceitando input.
 * aguardando: resposta travada, "Certeza ou chute?" na tela (sem reveal).
 * revelado: feedback visivel, opcoes pintadas de certo/errado.
 */
export type FaseExercicio = 'respondendo' | 'aguardando' | 'revelado';

export type Calibracao = 'certeza' | 'chute';

export interface ResolucaoExercicio {
  correto: boolean;
  /** Frase principal do reveal (okMsg/erroMsg ou equivalente do formato). */
  titulo: string;
  /** Explicacao de 1 frase. */
  porque: string;
}

/** Vibracao curta no reveal (Android; iOS ignora). */
export function vibrar(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15);
  }
}
