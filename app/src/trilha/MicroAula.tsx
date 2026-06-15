/**
 * Micro-aula de abertura de unidade: o Tchin encena o conceito da
 * unidade passo a passo (CenaMascote, timeline GSAP). O ritmo e de
 * quem assiste: cada passo coreografa a entrada e espera o TOQUE,
 * nunca avanca sozinho. Pulavel a qualquer momento.
 * Chegar ao ultimo passo paga +5 XP, uma vez por unidade (engine).
 * Reassistivel pelo cartao da unidade na Trilha.
 *
 * Este componente e carregado por React.lazy (Trilha) e por lazy de
 * rota (Player): o gsap importado pelo CenaMascote vive SO neste
 * chunk, fora do bundle inicial e fora do precache do app shell.
 */
import { useEffect, useState } from 'react';
import type { Unidade } from '../content';
import { obterStore } from '../engine';
import { CenaMascote } from '../mascote';
import { Ic } from '../icones/Icones';
import { tocar } from '../som/som';
import { ROTEIROS_UNIDADE } from './roteiros';
import { marcarMicroAulaVista } from './microaulas';
import './microaula.css';

interface Props {
  unidade: Unidade;
  /** Chamado ao fim (assistida ou pulada): o chamador segue o fluxo. */
  onFim: () => void;
}

export function MicroAula({ unidade, onFim }: Props) {
  const meta = unidade.meta;
  const numero = Number(meta.id.replace(/\D/g, '')) || 1;
  const roteiro = ROTEIROS_UNIDADE[meta.id] ?? [];
  const [xpGanho, setXpGanho] = useState<number | null>(null);

  /* Sem roteiro nao ha cena: segue o fluxo sem prender ninguem */
  useEffect(() => {
    if (roteiro.length === 0) onFim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (roteiro.length === 0) return null;

  const terminar = (completa: boolean) => {
    marcarMicroAulaVista(meta.id);
    if (completa) {
      const xp = obterStore().concluirMicroAula(meta.id);
      if (xp !== null) {
        tocar('marco');
        setXpGanho(xp);
        window.setTimeout(onFim, 1300);
        return;
      }
    }
    onFim();
  };

  return (
    <div
      className="microaula"
      role="dialog"
      aria-modal="true"
      aria-label={`Apresentação da unidade ${numero}: ${meta.titulo}`}
    >
      <div className="microaula-cartao app-chrome">
        <p className="microaula-eyebrow">Unidade {numero}</p>
        <h2 className="microaula-titulo">{meta.titulo}</h2>
        {xpGanho === null ? (
          <CenaMascote roteiro={roteiro} aoTerminar={terminar} rotuloPular="Pular" />
        ) : (
          <p className="microaula-xp" role="status">
            <Ic nome="raio-energia" size={20} />
            +{xpGanho} XP por assistir inteira
          </p>
        )}
      </div>
    </div>
  );
}
