/**
 * Motor compartilhado das CENAS INTERATIVAS por habilidade.
 *
 * Cada cena e um SVG proprietario que preenche o vazio entre a pergunta e
 * as opcoes do exercicio. Duas camadas de vida:
 *   1. IDLE: animacao sutil continua (so transform/opacity, WAAPI em loop).
 *   2. REACAO: ao toque, uma brincadeira fisica de uma vez so (mola via
 *      springs.ts, a mesma do mascote). O toque NUNCA muda a resposta nem
 *      bloqueia o fluxo: e so afago.
 *
 * GSAP fica de fora de proposito: ele e so das micro-aulas. Aqui WAAPI,
 * pelo mesmo motivo do rig do Tchin (leve no Android mid-range).
 *
 * prefers-reduced-motion: nenhum loop, nenhuma reacao. A cena vira arte
 * estatica e o toque so devolve a vibracao curta (afago tatil, sem pixel).
 */

import { useEffect, useRef } from 'react';
import { amostrarMola, type ConfigMola } from '../mascote/springs';

export function reduzMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Vibracao curta de afago (Android; iOS ignora). Igual a do reveal. */
export function vibrarAfago(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

/** Keyframes de uma mola amostrada para uma propriedade CSS (ex.: rotate). */
export function molaKeyframes(
  de: number,
  para: number,
  cfg: ConfigMola,
  monta: (v: number) => Keyframe,
): { kfs: Keyframe[]; duracao: number } {
  const { valores, duracao } = amostrarMola(de, para, cfg);
  return { kfs: valores.map(monta), duracao };
}

/**
 * Liga uma cena interativa a um elemento SVG.
 *
 * - `idle(el)` recebe o SVG raiz e devolve as Animations do loop continuo
 *   (vazio quando reduz-motion). O motor as cancela na desmontagem.
 * - `reagir(el)` dispara a brincadeira do toque e devolve as Animations
 *   one-shot; o motor cancela as anteriores antes de comecar a proxima,
 *   entao toques repetidos sao interrompiveis (nunca empilham).
 *
 * Devolve `aoTocar`: handler de pointerdown para o <svg> da cena. Ele
 * vibra, dispara `reagir` e, em reduz-motion, so vibra.
 */
export interface ConfigCena {
  idle?: (svg: SVGSVGElement) => Animation[];
  reagir?: (svg: SVGSVGElement) => Animation[];
}

export interface CenaInterativa {
  ref: React.RefObject<SVGSVGElement>;
  aoTocar: () => void;
}

export function useCenaInterativa(config: ConfigCena): CenaInterativa {
  const ref = useRef<SVGSVGElement>(null);
  const idleRef = useRef<Animation[]>([]);
  const reacaoRef = useRef<Animation[]>([]);
  const configRef = useRef(config);
  configRef.current = config;

  /* Loop de vida: monta uma vez, cancela na saida. */
  useEffect(() => {
    const svg = ref.current;
    if (!svg || reduzMotion()) return;
    idleRef.current = configRef.current.idle?.(svg) ?? [];
    return () => {
      idleRef.current.forEach((a) => a.cancel());
      idleRef.current = [];
    };
  }, []);

  /* Cancela reacoes pendentes na desmontagem. */
  useEffect(() => {
    return () => {
      reacaoRef.current.forEach((a) => a.cancel());
      reacaoRef.current = [];
    };
  }, []);

  const aoTocar = () => {
    vibrarAfago();
    if (reduzMotion()) return;
    const svg = ref.current;
    if (!svg) return;
    reacaoRef.current.forEach((a) => a.cancel());
    reacaoRef.current = configRef.current.reagir?.(svg) ?? [];
  };

  return { ref, aoTocar };
}

/** Atalho: busca um filho da cena por data-parte (rig legivel no SVG). */
export function parte(svg: SVGSVGElement, nome: string): SVGElement | null {
  return svg.querySelector<SVGElement>(`[data-parte="${nome}"]`);
}

/** Todas as partes com um prefixo de nome (ex.: "gota" -> gota-0, gota-1). */
export function partes(svg: SVGSVGElement, prefixo: string): SVGElement[] {
  return Array.from(svg.querySelectorAll<SVGElement>(`[data-parte^="${prefixo}"]`));
}
