/**
 * Primer proprio de notificacao (decisao C-N): "Quer que a gente te
 * lembre da ofensiva?" com "Pode lembrar" / "Agora nao". So no aceite
 * chamamos Notification.requestPermission(). NUNCA o prompt nativo no
 * load. Dispara depois da 1a licao, apos o cartao de instalacao, 1x.
 *
 * Voz da marca: sem emoji, sem travessao, cutucada gentil. Mascote vigente
 * e o Mascotinho (o Tchin antigo foi aposentado no redesign).
 */

import { useState } from 'react';
import { Ic } from '../icones/Icones';
import { Mascotinho } from '../mascote';
import { aceitarLembretes } from './push';
import { useFtueFlags } from '../onboarding/flags';
import './notificacoes.css';

interface Props {
  /** Chamado depois que a pessoa responde (sim ou nao): grava a flag 1x. */
  onResolvido?: () => void;
}

export function PrimerNotificacao({ onResolvido }: Props) {
  const [, marcar] = useFtueFlags();
  const [pedindo, setPedindo] = useState(false);

  const responder = () => {
    marcar({ primerNotifRespondido: true });
    onResolvido?.();
  };

  const aceitar = async () => {
    setPedindo(true);
    try {
      await aceitarLembretes();
    } finally {
      responder();
    }
  };

  return (
    <div className="primer" role="dialog" aria-modal="true" aria-label="Quer que a gente te lembre da ofensiva?">
      <button
        type="button"
        className="primer-fundo"
        aria-label="Agora não"
        onClick={() => {
          if (pedindo) return;
          responder();
        }}
      />
      <div className="primer-painel app-chrome">
        <div className="primer-mascote" aria-hidden="true">
          <Mascotinho estado="idle" tamanho={84} />
          <span className="primer-sino">
            <Ic nome="sino" size={22} />
          </span>
        </div>
        <h2 className="primer-titulo">Quer que a gente te lembre da ofensiva?</h2>
        <p className="primer-texto">
          Um toque por dia, no fim da tarde, pra você não perder a sequência. Dá pra desligar quando
          quiser.
        </p>
        <div className="primer-acoes">
          <button
            type="button"
            className="btn btn-primary btn-jogo btn-cheio tap"
            disabled={pedindo}
            onClick={aceitar}
          >
            Pode lembrar
          </button>
          <button
            type="button"
            className="btn btn-outline btn-cheio tap"
            disabled={pedindo}
            onClick={responder}
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
}
