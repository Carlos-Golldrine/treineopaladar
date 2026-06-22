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
import { permissaoAtual, primerAdiado, pushAtivado, suportaPush, temInscricaoAtiva } from './push';
import { useFtueFlags } from '../onboarding/flags';

/** Atraso antes de abrir o primer, pra dar espaco ao convite de instalacao. */
const ATRASO_MS = 6000;

export function GatePrimer() {
  const [mostrar, setMostrar] = useState(false);
  const [flags] = useFtueFlags();

  /* Modo de teste: abrir a home com ?primer=1 força o primer na hora,
     ignorando permissao/adiamento (so para conferir o visual e o fluxo). */
  const forcar =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('primer');

  useEffect(() => {
    if (forcar) {
      setMostrar(true);
      return;
    }
    /* Sequencia: so depois do tour guiado (senao competem na 1a abertura). O Inicio
       remonta a cada navegacao (key=pathname no Shell), entao ao voltar pra home
       depois do tour este gate ja le tourFeito=true. */
    if (!flags.tourFeito) return;
    /* Pre-condicoes sincronas: backend de push existe (VAPID), ambiente suporta,
       nao foi adiado, e a permissao nao foi NEGADA (negada nao reabre por prompt;
       o caminho dela e o ajuste no Perfil + configuracoes do navegador). */
    if (!pushAtivado() || !suportaPush() || primerAdiado()) return;
    const perm = permissaoAtual();
    if (perm === 'denied' || perm === 'indisponivel') return;

    /* Mostra pra quem NAO esta inscrito: cobre 'default' (nunca ativou) E
       'granted' sem inscricao viva (ex.: expirou/foi limpa) — antes so 'default'
       via, entao quem desativou nunca era reconvidado. */
    let vivo = true;
    let timer: number | undefined;
    void temInscricaoAtiva().then((inscrito) => {
      if (!vivo || inscrito) return;
      timer = window.setTimeout(() => {
        if (vivo) setMostrar(true);
      }, ATRASO_MS);
    });
    return () => {
      vivo = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [forcar, flags.tourFeito]);

  if (!mostrar) return null;
  return <PrimerNotificacao onResolvido={() => setMostrar(false)} />;
}
