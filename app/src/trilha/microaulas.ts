/**
 * Micro-aulas vistas (abertura de unidade): flag de UI em chave propria.
 * O XP (+5, uma vez por unidade, so quando assistida inteira) e do engine
 * (concluirMicroAula); aqui vive apenas o "ja apresentei esta unidade",
 * que vale mesmo quando a pessoa pulou.
 */
import { useCallback, useSyncExternalStore } from 'react';

const CHAVE = 'tp.microaulas.v1';

let cache: readonly string[] | null = null;
const ouvintes = new Set<() => void>();

function ler(): readonly string[] {
  if (cache) return cache;
  try {
    const cru = localStorage.getItem(CHAVE);
    const dado: unknown = cru ? JSON.parse(cru) : [];
    cache = Array.isArray(dado) ? dado.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
}

export function microAulasVistas(): readonly string[] {
  return ler();
}

export function marcarMicroAulaVista(unidadeId: string): void {
  const atuais = ler();
  if (atuais.includes(unidadeId)) return;
  cache = [...atuais, unidadeId];
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cache));
  } catch {
    /* modo privado: o cache em memoria segue valendo */
  }
  for (const fn of ouvintes) fn();
}

/** Lista reativa das unidades ja apresentadas. */
export function useMicroAulasVistas(): readonly string[] {
  const subscribe = useCallback((cb: () => void) => {
    ouvintes.add(cb);
    return () => {
      ouvintes.delete(cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, ler, ler);
}
