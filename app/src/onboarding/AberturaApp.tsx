import { useLayoutEffect, useRef, useState } from 'react';
import { Mascotinho } from '../mascote';
import './abertura.css';

const CHAVE_ABERTURA = 'tp.abertura.v1';

function jaViu(): boolean {
  try {
    return localStorage.getItem(CHAVE_ABERTURA) === '1';
  } catch {
    return false;
  }
}
function marcarVista(): void {
  try {
    localStorage.setItem(CHAVE_ABERTURA, '1');
  } catch {
    /* modo privado/quota: o intro so nao memoriza, sem quebrar */
  }
}
function semMovimento(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Decide UMA vez por carga de pagina se a abertura toca (e ja "gasta" o primeiro
 * acesso na decisao). Imune a re-mounts (StrictMode no dev / re-render do Splash):
 * a 2a montagem reusa a decisao em cache em vez de reler a flag ja gravada.
 */
let decisaoSessao: boolean | null = null;
function deveTocarAgora(): boolean {
  if (decisaoSessao === null) {
    decisaoSessao = !jaViu() && !semMovimento();
    if (decisaoSessao) marcarVista();
  }
  return decisaoSessao;
}

/**
 * Abertura cinematografica do PRIMEIRO ACESSO (uma unica vez):
 *  Fase 1 (~0.8s): tela cor-de-vinho; o Mascotinho aparece colado no "vidro"
 *    (zoom extremo, olhos no centro), sorri (boca surgindo) e respira; da um piscar.
 *  Fase 2 (~1.4s): o mascote se afasta (scale + translate) e pousa no seu lugar de
 *    descanso no Splash com overshoot de mola, enquanto o fundo some e revela o app.
 * O WAAPI move o mascote (valores medidos do mascote real); o resto e CSS.
 */
export function AberturaApp() {
  const [ativo, setAtivo] = useState(deveTocarAgora);
  const mascRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ativo) return;
    const wrap = mascRef.current;
    if (!wrap || typeof wrap.animate !== 'function') {
      setAtivo(false);
      return;
    }

    let cancelado = false;
    let anim: Animation | null = null;
    let mascoteReal: HTMLElement | null = null; // mascote de descanso, escondido durante o intro

    const revelarMascote = (): void => {
      if (mascoteReal) mascoteReal.style.opacity = '';
    };

    // Mede o mascote de descanso (Splash); se ainda nao for medivel, tenta por
    // alguns frames e, no limite, usa uma posicao de descanso calculada.
    const tocar = (tentativa: number): void => {
      if (cancelado) return;

      // Congela o Splash no lugar de descanso (sem o surge), para medir o ponto
      // EXATO de pouso — senao o intro encostaria fora e apareceriam dois mascotes.
      const alto = document.querySelector('.splash-alto') as HTMLElement | null;
      if (alto) alto.style.animation = 'none';
      const alvo = (alto?.querySelector('.mascotinho') ?? null) as HTMLElement | null;
      const m = alvo?.getBoundingClientRect();

      let left: number;
      let top: number;
      let w: number;
      let h: number;
      if (alvo && m && m.width >= 10) {
        left = m.left;
        top = m.top;
        w = m.width;
        h = m.height;
        // esconde o mascote real durante o intro; o intro vira o unico em cena
        mascoteReal = alvo;
        alvo.style.opacity = '0';
      } else if (tentativa < 6) {
        requestAnimationFrame(() => tocar(tentativa + 1));
        return;
      } else {
        w = 104;
        h = Math.round((104 * 150) / 120);
        left = window.innerWidth / 2 - w / 2;
        top = 24 + window.innerHeight * 0.16; // padding-top + .splash-alto margin-top (16vh)
      }

      // ancora o wrapper sobre o mascote de descanso (posicao final = identidade)
      wrap.style.left = `${left}px`;
      wrap.style.top = `${top}px`;
      wrap.style.width = `${w}px`;
      wrap.style.height = `${h}px`;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const fx = 0.5; // olhos: centro horizontal
      const fy = 46 / 150; // olhos: ~31% da altura (viewBox 0..150)
      const S = Math.max(4.5, (window.innerHeight * 0.92) / h); // zoom da "proximidade"
      const tf = (sc: number): string =>
        `translate(${cx - left - w * fx * sc}px, ${cy - top - h * fy * sc}px) scale(${sc})`;

      anim = wrap.animate(
        [
          { transform: tf(S * 1.06), opacity: 0, offset: 0, easing: 'ease-out' }, // aparece colado
          { transform: tf(S), opacity: 1, offset: 0.12, easing: 'linear' }, // assenta no vidro
          { transform: tf(S), opacity: 1, offset: 0.36, easing: 'cubic-bezier(0.4,0,0.2,1)' }, // segura ~0.8s
          { transform: 'translate(0px,-6px) scale(1.05)', opacity: 1, offset: 0.86, easing: 'ease-in-out' }, // pousa + overshoot
          { transform: 'translate(0px,1px) scale(0.99)', opacity: 1, offset: 0.93, easing: 'ease-out' }, // mola
          { transform: 'translate(0px,0px) scale(1)', opacity: 1, offset: 1 }, // assenta solido no lugar exato
        ],
        { duration: 2200, fill: 'forwards' },
      );
      anim.onfinish = () => {
        // handoff solido: revela o mascote real no MESMO ponto e remove o overlay
        revelarMascote();
        if (!cancelado) setAtivo(false);
      };
    };

    tocar(0);
    return () => {
      cancelado = true;
      anim?.cancel();
      revelarMascote();
    };
  }, [ativo]);

  if (!ativo) return null;

  return (
    <div className="abertura" aria-hidden="true">
      <div className="abertura-fundo" />
      <div className="abertura-masc" ref={mascRef}>
        <Mascotinho estado="idle" tamanho={104} />
      </div>
    </div>
  );
}
