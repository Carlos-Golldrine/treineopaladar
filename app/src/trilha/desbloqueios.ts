/**
 * Desbloqueio antecipado de unidades (comprado por 200 cristais).
 * O debito e do engine (comprar('desbloqueioUnidade')); o EFEITO e da
 * camada de produto e persiste aqui, em chave propria.
 */
import { useCallback, useSyncExternalStore } from 'react';

const CHAVE = 'tp.desbloqueios.v1';

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

function gravar(ids: readonly string[]): void {
  cache = ids;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(ids));
  } catch {
    /* modo privado: o cache em memoria segue valendo */
  }
  for (const fn of ouvintes) fn();
}

export function unidadesDesbloqueadas(): readonly string[] {
  return ler();
}

export function desbloquearUnidade(unidadeId: string): void {
  const atuais = ler();
  if (atuais.includes(unidadeId)) return;
  gravar([...atuais, unidadeId]);
}

/** Lista reativa dos ids de unidade desbloqueados por cristais. */
export function useDesbloqueios(): readonly string[] {
  const subscribe = useCallback((cb: () => void) => {
    ouvintes.add(cb);
    return () => {
      ouvintes.delete(cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, ler, ler);
}
