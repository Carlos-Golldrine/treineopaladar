/**
 * Hooks React finos sobre o TPStore (sem JSX, zero logica de UI).
 * Todos usam useSyncExternalStore com snapshots estaveis por referencia.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { EstadoV1, Licao, ProgressoLicao, ScorePaladar, Wallet } from './types';
import { obterStore } from './store';
import type { SessaoAtiva, TPStore } from './store';
import { exercicioAtual, sessaoConcluida } from './sessao';
import type { EfeitoResposta, ResultadoSessao, Sessao, TipoSessao } from './sessao';
import type { Exercicio } from './types';

function useEstado(store: TPStore): EstadoV1 {
  return useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), [store]),
    () => store.getEstado(),
    () => store.getEstado(),
  );
}

export interface UseWallet {
  wallet: Wallet;
  streakEfetivo: number;
  streakEmRisco: boolean;
  proximaVidaEmMs: number | null;
}

/** Carteira ao vivo, ja sincronizada (rollover de dia e regen de vidas). */
export function useWallet(): UseWallet {
  const store = obterStore();
  useEffect(() => {
    store.sincronizar();
  }, [store]);
  const estado = useEstado(store);
  return useMemo(
    () => ({
      wallet: estado.wallet,
      streakEfetivo: store.streakEfetivo(),
      streakEmRisco: store.streakEmRisco(),
      proximaVidaEmMs: store.proximaVidaEmMs(),
    }),
    [store, estado],
  );
}

export interface UseProgresso {
  progresso: Record<string, ProgressoLicao>;
  scorePaladar: ScorePaladar;
  revisoesVencidas: string[];
  objetivo: EstadoV1['objetivo'];
  nivelDeclarado: EstadoV1['nivelDeclarado'];
  onboardingCompleto: boolean;
}

/** Progresso por licao, score de paladar (com decaimento) e revisoes vencidas. */
export function useProgresso(): UseProgresso {
  const store = obterStore();
  const estado = useEstado(store);
  return useMemo(
    () => ({
      progresso: estado.progresso,
      scorePaladar: store.scorePaladarAtual(),
      revisoesVencidas: store.revisoesVencidas(),
      objetivo: estado.objetivo,
      nivelDeclarado: estado.nivelDeclarado,
      onboardingCompleto: estado.onboardingCompleto,
    }),
    [store, estado],
  );
}

export interface UseSessao {
  sessao: Sessao | null;
  licao: Licao | null;
  exercicio: Exercicio | null;
  concluida: boolean;
  resultado: ResultadoSessao | null;
  iniciar: (licao: Licao, tipo: TipoSessao) => Sessao | null;
  responder: (correto: boolean) => EfeitoResposta | null;
  finalizar: () => ResultadoSessao | null;
  abandonar: () => void;
}

/** Sessao de licao ao vivo: exercicio atual, responder, finalizar. */
export function useSessao(): UseSessao {
  const store = obterStore();
  const ativa: SessaoAtiva | null = useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), [store]),
    () => store.getSessao(),
    () => store.getSessao(),
  );
  const resultado = useSyncExternalStore(
    useCallback((cb: () => void) => store.subscribe(cb), [store]),
    () => store.getUltimoResultado(),
    () => store.getUltimoResultado(),
  );

  const iniciar = useCallback(
    (licao: Licao, tipo: TipoSessao) => store.iniciarLicao(licao, tipo),
    [store],
  );
  const responderCb = useCallback((correto: boolean) => store.responder(correto), [store]);
  const finalizar = useCallback(() => store.finalizarLicao(), [store]);
  const abandonar = useCallback(() => store.abandonarSessao(), [store]);

  return useMemo(
    () => ({
      sessao: ativa?.sessao ?? null,
      licao: ativa?.licao ?? null,
      exercicio: ativa ? exercicioAtual(ativa.sessao, ativa.licao) : null,
      concluida: ativa ? sessaoConcluida(ativa.sessao) : false,
      resultado,
      iniciar,
      responder: responderCb,
      finalizar,
      abandonar,
    }),
    [ativa, resultado, iniciar, responderCb, finalizar, abandonar],
  );
}
