/**
 * Badge no icone do app (o "1" da ofensiva em risco).
 * navigator.setAppBadge / clearAppBadge, guarded: a API so existe em PWA
 * instalado (Android Chrome + iOS 16.4+ instalado). Em qualquer outro
 * lugar vira no-op silencioso, nunca quebra (NOTIFICACOES secao 1).
 *
 * Regra de produto: setBadge(1) quando a ofensiva entra em risco;
 * clearBadge() ao treinar (concluir licao/pratica).
 */

interface BadgeNavigator {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

function nav(): BadgeNavigator | null {
  if (typeof navigator === 'undefined') return null;
  return navigator as unknown as BadgeNavigator;
}

/** True se a Badging API existe neste ambiente. */
export function temBadge(): boolean {
  const n = nav();
  return n !== null && typeof n.setAppBadge === 'function';
}

/**
 * Marca o icone com `contagem` (default 1). Promise que nunca rejeita:
 * falha de permissao/ambiente e engolida, o app segue normal.
 */
export async function setBadge(contagem = 1): Promise<void> {
  const n = nav();
  if (!n?.setAppBadge) return;
  try {
    await n.setAppBadge(contagem);
  } catch {
    /* sem permissao ou nao instalado: badge simplesmente nao aparece */
  }
}

/** Limpa o badge do icone. Nunca rejeita. */
export async function clearBadge(): Promise<void> {
  const n = nav();
  if (!n?.clearAppBadge) return;
  try {
    await n.clearAppBadge();
  } catch {
    /* idem: no-op seguro */
  }
}

/**
 * Sincroniza o badge com o estado da ofensiva: acende quando em risco,
 * apaga caso contrario. Chamado da Trilha (na montagem) e ao fim da
 * licao. Um unico ponto pra logica de produto nao se espalhar.
 */
export async function sincronizarBadge(streakEmRisco: boolean): Promise<void> {
  if (streakEmRisco) {
    await setBadge(1);
  } else {
    await clearBadge();
  }
}
