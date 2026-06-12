/**
 * Ficha de bolso pre-licao: sheet opcional "Dar uma olhada antes" com os
 * 3 fatos mais importantes da ficha canonica (os 3 primeiros: a ficha e
 * autoral e ordenada por importancia). Sempre pulavel, nunca bloqueia;
 * o treino de verdade continua sendo o retrieval dos exercicios.
 */
import { useRef, useState } from 'react';
import type { Licao } from '../engine';

interface Props {
  licao: Licao;
  onFechar: () => void;
}

export function FichaBolso({ licao, onFechar }: Props) {
  const fatos = licao.fichaCanonica.slice(0, 3);
  const fileiraRef = useRef<HTMLDivElement>(null);
  const [ativa, setAtiva] = useState(0);

  const onScroll = () => {
    const el = fileiraRef.current;
    const carta = el?.firstElementChild as HTMLElement | null;
    if (!el || !carta) return;
    const passo = carta.offsetWidth + 12;
    setAtiva(Math.max(0, Math.min(fatos.length - 1, Math.round(el.scrollLeft / passo))));
  };

  return (
    <div className="folha" role="dialog" aria-modal="true" aria-label="Ficha de bolso da lição">
      <button type="button" className="folha-fundo" aria-label="Fechar a ficha" onClick={onFechar} />
      <div className="folha-painel app-chrome">
        <div className="folha-alca" aria-hidden="true" />
        <h2 className="folha-titulo">Ficha de bolso</h2>
        <p className="ficha-sub">Três coisas desta lição para levar no bolso. Deslize.</p>
        <div className="ficha-fileira" ref={fileiraRef} onScroll={onScroll}>
          {fatos.map((fato, i) => (
            <article className="ficha-carta" key={i} aria-label={`Fato ${i + 1} de ${fatos.length}`}>
              <span className="ficha-num" aria-hidden="true">
                {i + 1}
              </span>
              <p className="ficha-fato">{fato}</p>
            </article>
          ))}
        </div>
        <div className="ficha-pontos" aria-hidden="true">
          {fatos.map((_, i) => (
            <span key={i} className={i === ativa ? 'ficha-ponto ficha-ponto-ativo' : 'ficha-ponto'} />
          ))}
        </div>
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={onFechar}>
          Pronto, bora jogar
        </button>
      </div>
    </div>
  );
}
