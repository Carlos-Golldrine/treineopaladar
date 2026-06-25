import { useLayoutEffect, useRef, useState } from 'react';
import { Mascotinho } from '../mascote';
import './abertura.css';
import './abertura-home.css';

/**
 * Abertura da HOME (recorrente, uma vez por carga de pagina). Versao simples da
 * AberturaApp: o rosto do Mascotinho aparece colado no "vidro" (zoom no rosto),
 * sorri e respira, e entao ESVANECE — sem se afastar nem pousar (fase 2 da
 * AberturaApp). Ao terminar, chama onFim; o Inicio entao revela o mascote que
 * entra pela lateral (o card de coach), igual a entrada de antes.
 */
let introHomeFeita = false;

function semMovimento(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Toca uma vez por carga (e nunca com movimento reduzido). Puro: nao tem efeito. */
export function deveTocarAberturaHome(): boolean {
  return !introHomeFeita && !semMovimento();
}

export function AberturaHome({ onFim }: { onFim: () => void }) {
  const [ativo, setAtivo] = useState(true);
  const mascRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ativo) return;
    introHomeFeita = true; // nao repete nesta carga (re-entrar na home nao re-toca)
    const wrap = mascRef.current;
    if (!wrap || typeof wrap.animate !== 'function') {
      setAtivo(false);
      onFim();
      return;
    }

    let cancelado = false;
    // Zoom no rosto, centralizado no viewport (olhos no centro). Mesma medida da
    // AberturaApp (fx=0.5, fy~31% da altura do viewBox 0..150), mas SEM pouso.
    const w = 104;
    const h = Math.round((104 * 150) / 120);
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const left = cx - w / 2;
    const top = cy - h / 2;
    const fx = 0.5;
    const fy = 46 / 150;
    const S = Math.max(4.5, (window.innerHeight * 0.92) / h);
    const tf = `translate(${cx - left - w * fx * S}px, ${cy - top - h * fy * S}px) scale(${S})`;

    wrap.style.left = `${left}px`;
    wrap.style.top = `${top}px`;
    wrap.style.width = `${w}px`;
    wrap.style.height = `${h}px`;

    const anim = wrap.animate(
      [
        { transform: tf, opacity: 0, offset: 0, easing: 'ease-out' }, // surge colado
        { transform: tf, opacity: 1, offset: 0.1 }, // aparece
        { transform: tf, opacity: 1, offset: 0.66 }, // segura (sorri, pisca, respira)
        { transform: tf, opacity: 0, offset: 1, easing: 'ease-in' }, // esvanece
      ],
      { duration: 2000, fill: 'forwards' },
    );
    anim.onfinish = () => {
      if (cancelado) return;
      setAtivo(false);
      onFim();
    };

    return () => {
      cancelado = true;
      anim.cancel();
    };
    // onFim e estavel (setState do Inicio); deps so no ativo pra nao reiniciar a anim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);

  if (!ativo) return null;

  return (
    <div className="abertura-home" aria-hidden="true">
      <div className="abertura-home-fundo" />
      <div className="abertura-masc" ref={mascRef}>
        <Mascotinho estado="idle" tamanho={104} />
      </div>
    </div>
  );
}
