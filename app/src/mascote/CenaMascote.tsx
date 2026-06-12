/**
 * Micro-cena do mascote: executa um roteiro declarativo de passos
 * { estado, fala (máx 8 palavras), prop de cena, duração }.
 * É a base das micro-aulas da fase Features.
 *
 * Timeline com avanço automático, toque no palco avança na hora
 * (interrompível) e "Pular" encerra. O Tchin troca de estado por mola,
 * o prop entra com pop próprio e a fala re-anima a cada passo.
 */
import { useEffect, useRef, useState } from 'react';
import { Tchin, type EstadoTchin } from './Tchin';
import { PROPS_CENA, type PropCenaId } from './PropsCena';
import './mascote.css';

export interface PassoCena {
  estado: EstadoTchin;
  /** Fala curta do Tchin: máximo 8 palavras (regra do ruído). */
  fala?: string;
  /** Prop proprietário que entra em cena ao lado do mascote. */
  prop?: PropCenaId;
  /** Tempo no palco antes de avançar sozinho. Padrão: 3000ms. */
  duracaoMs?: number;
}

export interface CenaMascoteProps {
  roteiro: PassoCena[];
  /**
   * Chamado uma única vez, ao fim natural ou ao pular.
   * `completa` é true quando a cena foi assistida até o último passo
   * (avançar com toques também conta; pular antes do fim não).
   */
  aoTerminar?: (completa: boolean) => void;
  rotuloPular?: string;
  className?: string;
}

const DURACAO_PADRAO = 3000;

export function CenaMascote({ roteiro, aoTerminar, rotuloPular = 'Pular', className }: CenaMascoteProps) {
  const [indice, setIndice] = useState(0);
  const terminouRef = useRef(false);

  const ultimo = roteiro.length - 1;
  const passo = roteiro[Math.min(indice, ultimo)];

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const p of roteiro) {
      if (p.fala && p.fala.trim().split(/\s+/).length > 8) {
        console.warn(`CenaMascote: fala com mais de 8 palavras: "${p.fala}"`);
      }
    }
  }, [roteiro]);

  const terminar = (completa: boolean) => {
    if (terminouRef.current) return;
    terminouRef.current = true;
    aoTerminar?.(completa);
  };

  const avancar = () => {
    if (indice < ultimo) setIndice(indice + 1);
    else terminar(true);
  };

  /* Timeline: cada passo agenda o próximo; toque cancela e avança já */
  useEffect(() => {
    if (!passo) return;
    const t = window.setTimeout(avancar, passo.duracaoMs ?? DURACAO_PADRAO);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, roteiro]);

  if (!passo) return null;

  const Prop = passo.prop ? PROPS_CENA[passo.prop] : null;

  return (
    <div className={className ? `tchin-cena app-chrome ${className}` : 'tchin-cena app-chrome'}>
      <div className="tchin-cena-fala" aria-live="polite">
        {passo.fala && (
          <p key={indice} className="tchin-cena-balao">
            {passo.fala}
          </p>
        )}
      </div>

      <button type="button" className="tchin-cena-palco" onClick={avancar} aria-label="Avançar cena">
        <Tchin estado={passo.estado} tamanho={104} />
        {Prop && (
          <span key={indice} className="tchin-cena-prop">
            <Prop size={68} />
          </span>
        )}
      </button>

      <div className="tchin-cena-rodape">
        <div className="tchin-cena-dots" aria-hidden="true">
          {roteiro.map((_, i) => (
            <span key={i} className={i <= indice ? 'tchin-cena-dot tchin-cena-dot-ativa' : 'tchin-cena-dot'} />
          ))}
        </div>
        <button type="button" className="tchin-cena-pular tap" onClick={() => terminar(indice >= ultimo)}>
          {rotuloPular}
        </button>
      </div>
    </div>
  );
}
