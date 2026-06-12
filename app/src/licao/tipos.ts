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

/* ------------- Coreografias de marco na volta a Trilha ---------------- */

/** Chave de sessionStorage: o player avisa a Trilha do marco recem-ganho. */
export const CHAVE_ANIM_TRILHA = 'tp.anim.v1';

export interface AnimTrilha {
  /** Licao concluida agora: o no dela enche a taca com onda. */
  licao: string;
  /** True quando a conclusao rendeu coroa nova: ela cai com bounce. */
  coroa: boolean;
}

/** Grava o marco para a Trilha coreografar na proxima montagem. */
export function gravarAnimTrilha(anim: AnimTrilha): void {
  try {
    sessionStorage.setItem(CHAVE_ANIM_TRILHA, JSON.stringify(anim));
  } catch {
    /* sem sessionStorage: a coreografia simplesmente nao acontece */
  }
}

/** Le e consome (uma vez so) o marco pendente. */
export function consumirAnimTrilha(): AnimTrilha | null {
  try {
    const cru = sessionStorage.getItem(CHAVE_ANIM_TRILHA);
    if (!cru) return null;
    sessionStorage.removeItem(CHAVE_ANIM_TRILHA);
    const dado = JSON.parse(cru) as Partial<AnimTrilha>;
    if (typeof dado.licao === 'string') {
      return { licao: dado.licao, coroa: dado.coroa === true };
    }
  } catch {
    /* sem sessionStorage */
  }
  return null;
}
