/**
 * Gate do primer de notificacao: decide SE e QUANDO o primer aparece.
 *
 * Regras (decisao C-N, NOTIFICACOES secao 1):
 *  - 1x na vida (trava em FtueFlags.primerNotifRespondido);
 *  - so onde Web Push faz sentido AGORA (suportaPush: SW + Push + Notification),
 *    o que ja exclui iPhone no Safari sem instalar;
 *  - so se a permissao ainda esta 'default' (nunca re-perguntar quem decidiu);
 *  - com um pequeno atraso, pra nao competir com o convite de instalacao
 *    (ConvitePwa) logo na abertura.
 *
 * Montado no Inicio (home pos-onboarding). Sem backend de VAPID, o aceite
 * apenas grava a intencao de receber lembretes (stub em push.ts); o subscribe
 * real entra com a Edge Function. O timing aqui e proposital e ajustavel.
 */
import { useEffect, useState } from 'react';
import { PrimerNotificacao } from './PrimerNotificacao';
import { permissaoAtual, pushAtivado, suportaPush } from './push';
import { useFtueFlags } from '../onboarding/flags';

/** Atraso antes de abrir o primer, pra dar espaco ao convite de instalacao. */
const ATRASO_MS = 6000;

export function GatePrimer() {
  const [flags] = useFtueFlags();
  const [mostrar, setMostrar] = useState(false);

  /* pushAtivado(): so mostra o primer quando o backend de push existe (VAPID).
     Sem isso, pedir permissao nao entrega nada e queima o canal. */
  const elegivel =
    pushAtivado() && suportaPush() && permissaoAtual() === 'default' && !flags.primerNotifRespondido;

  useEffect(() => {
    if (!elegivel) return;
    const t = window.setTimeout(() => setMostrar(true), ATRASO_MS);
    return () => window.clearTimeout(t);
  }, [elegivel]);

  if (!elegivel || !mostrar) return null;
  return <PrimerNotificacao onResolvido={() => setMostrar(false)} />;
}
