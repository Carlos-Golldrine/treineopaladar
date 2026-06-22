/**
 * Flags locais da revelacao progressiva (fora do engine, que nao e
 * reescrito aqui): cristais coletados no HUD e tooltip de loja visto.
 * Chave propria no localStorage; o estado do jogo segue em "tp.v1".
 */

import { useCallback, useState } from 'react';

export const CHAVE_FTUE = 'tp.ftue.v1';

export interface FtueFlags {
  /** True depois do 1 toque de coleta (fim da Licao 2): chip de cristais visivel. */
  cristaisColetados: boolean;
  /** True depois do tooltip de loja (mostrado so ao zerar as vidas). */
  lojaVista: boolean;
  /** True depois do toast unico que aponta a ficha de bolso (1a licao aberta). */
  fichaApontada: boolean;
  /** True depois do convite de instalacao (PWA), mostrado uma vez pos-onboarding. */
  instalacaoVista: boolean;
  /** True depois do primer de notificacao ter sido respondido (sim ou nao), 1x (F3). */
  primerNotifRespondido: boolean;
  /** True depois do tour guiado de primeiro acesso (mascote explica as abas), 1x. */
  tourFeito: boolean;
}

const PADRAO: FtueFlags = {
  cristaisColetados: false,
  lojaVista: false,
  fichaApontada: false,
  instalacaoVista: false,
  primerNotifRespondido: false,
  tourFeito: false,
};

function ler(): FtueFlags {
  try {
    const cru = localStorage.getItem(CHAVE_FTUE);
    if (!cru) return PADRAO;
    const dado = JSON.parse(cru) as Partial<FtueFlags>;
    return {
      cristaisColetados: dado.cristaisColetados === true,
      lojaVista: dado.lojaVista === true,
      fichaApontada: dado.fichaApontada === true,
      instalacaoVista: dado.instalacaoVista === true,
      primerNotifRespondido: dado.primerNotifRespondido === true,
      tourFeito: dado.tourFeito === true,
    };
  } catch {
    return PADRAO;
  }
}

function gravar(flags: FtueFlags): void {
  try {
    localStorage.setItem(CHAVE_FTUE, JSON.stringify(flags));
  } catch {
    /* modo privado ou quota: o estado em memoria segue valendo */
  }
}

export function useFtueFlags(): [FtueFlags, (parcial: Partial<FtueFlags>) => void] {
  const [flags, setFlags] = useState<FtueFlags>(ler);
  const marcar = useCallback((parcial: Partial<FtueFlags>) => {
    setFlags((atual) => {
      const novo = { ...atual, ...parcial };
      gravar(novo);
      return novo;
    });
  }, []);
  return [flags, marcar];
}
