/**
 * EMBLEMAS DE UNIDADE do Treine seu Paladar (6 ilustracoes SVG 64x64).
 * Mais ricos que os icones do set: multi-cor da paleta travada do brief,
 * sempre dentro de um medalhao circular com aro wine-900.
 *
 * U1 paladar (lingua e gotas de sabor)   U4 rotulo/etiqueta
 * U2 cacho de uvas tintas                U5 garfo + taca (harmonizacao)
 * U3 taca de branco com bolhas           U6 mapa Brasil/Andes
 *
 * Uso: <Emblema unidade={2} size={64} />
 */

import type { ReactElement, ReactNode } from 'react';

/* Paleta travada (BRIEF-DESIGN.md): toda cor tem papel nomeado */
const VINHO_900 = '#4A1F24';
const VINHO_700 = '#722F37';
const OURO_500 = '#D4A574';
const OURO_700 = '#B8894A';
const PAPEL = '#FAFAF8';
const OK_700 = '#2E5734';
const OK_100 = '#E3EBE0';
const WARM_700 = '#A0522D';
const WARM_100 = '#F4E5DB';
const EMBER_500 = '#D98E32';
const NEUTRO_50 = '#F6F3F1';
const NEUTRO_300 = '#C5BAB4';
/** wine-100: tinta de fundo suave do duotone (papel nomeado em Icones.tsx) */
const VINHO_100 = '#F2E3E1';

const aro = {
  stroke: VINHO_900,
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const fino = { ...aro, strokeWidth: 2.2 } as const;

function Medalhao({ tinta, children }: { tinta: string; children: ReactNode }) {
  return (
    <>
      <circle cx="32" cy="32" r="29.5" fill={tinta} {...aro} />
      {children}
    </>
  );
}

/** Gota de sabor (forma compartilhada do U1) */
function Gota({ x, y, cor }: { x: number; y: number; cor: string }) {
  return (
    <path
      d="M0 -4.6 C2.7 -1.4 3.6 0.6 3.6 2.3 A3.6 3.6 0 1 1 -3.6 2.3 C-3.6 0.6 -2.7 -1.4 0 -4.6 Z"
      fill={cor}
      {...fino}
      transform={`translate(${x} ${y})`}
    />
  );
}

const EMBLEMAS: Record<1 | 2 | 3 | 4 | 5 | 6, ReactElement> = {
  /* U1: o paladar acorda. Lingua de vinho, tres gotas de sabor. */
  1: (
    <Medalhao tinta={WARM_100}>
      <Gota x={19} y={17} cor={EMBER_500} />
      <Gota x={32} y={12.5} cor={OURO_500} />
      <Gota x={45} y={17} cor={WARM_700} />
      <rect x="17.5" y="23.5" width="29" height="5.5" rx="2.75" fill={VINHO_900} />
      <path
        d="M22 28.5 H42 V36.5 C42 43.5 37.7 48.5 32 48.5 C26.3 48.5 22 43.5 22 36.5 Z"
        fill={VINHO_700}
        {...aro}
      />
      <path d="M32 33.5 V43.5" stroke={VINHO_900} strokeWidth="2.2" strokeLinecap="round" />
    </Medalhao>
  ),

  /* U2: tintos. Cacho cheio, folha verde, gavinha. */
  2: (
    <Medalhao tinta={VINHO_100}>
      <path d="M32 20.5 V12.5" stroke={VINHO_900} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 14.5 C27.8 13.6 26.8 11 28.4 9.2" stroke={VINHO_900} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path
        d="M33 15.5 C37.5 10.8 44.5 11.8 46.5 16.5 C41.5 20.7 35.5 19.2 33 15.5 Z"
        fill={OK_700}
        {...fino}
      />
      <circle cx="24.5" cy="26.5" r="6" fill={VINHO_700} {...fino} />
      <circle cx="39.5" cy="26.5" r="6" fill={VINHO_700} {...fino} />
      <circle cx="32" cy="30" r="6" fill={VINHO_700} {...fino} />
      <circle cx="26" cy="38" r="6" fill={VINHO_700} {...fino} />
      <circle cx="38" cy="38" r="6" fill={VINHO_700} {...fino} />
      <circle cx="32" cy="46" r="6" fill={VINHO_700} {...fino} />
      <circle cx="22.6" cy="24.6" r="1.7" fill={PAPEL} />
      <circle cx="30.2" cy="28.2" r="1.4" fill={PAPEL} />
    </Medalhao>
  ),

  /* U3: brancos e espumantes. Taca de ouro claro, bolhas subindo. */
  3: (
    <Medalhao tinta={NEUTRO_50}>
      <path
        d="M22.5 18.5 H41.5 C40.6 26.5 37.2 31.5 32 33 C26.8 31.5 23.4 26.5 22.5 18.5 Z"
        fill={OURO_500}
      />
      <path
        d="M20.5 12.5 H43.5 C43.5 25 39.5 32.5 32 34.8 C24.5 32.5 20.5 25 20.5 12.5 Z"
        fill="none"
        {...aro}
      />
      <circle cx="28.5" cy="26" r="1.9" fill={PAPEL} />
      <circle cx="34.5" cy="29" r="1.5" fill={PAPEL} />
      <circle cx="32" cy="22" r="1.6" fill={PAPEL} />
      <circle cx="27" cy="9" r="1.6" fill="none" stroke={OURO_700} strokeWidth="1.8" />
      <circle cx="33" cy="6.5" r="1.3" fill="none" stroke={OURO_700} strokeWidth="1.8" />
      <circle cx="38" cy="9.5" r="1.1" fill={OURO_700} />
      <path d="M32 34.8 V45" stroke={VINHO_900} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23.5 49 Q32 45 40.5 49" stroke={VINHO_900} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </Medalhao>
  ),

  /* U4: ler o rotulo. Etiqueta de papel, faixa vinho, selo de ouro. */
  4: (
    <Medalhao tinta={OK_100}>
      <g transform="rotate(-6 32 32)">
        <rect x="18" y="14" width="28" height="36" rx="3" fill={PAPEL} {...aro} />
        <rect x="22.5" y="19" width="19" height="6.5" rx="2" fill={VINHO_700} />
        <path d="M23 31 H41 M23 36 H36.5" stroke={NEUTRO_300} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="38.5" cy="43.5" r="4.6" fill={OURO_500} {...fino} />
        <path d="M36.7 43.5 L38.1 44.9 L40.4 42.2" stroke={VINHO_900} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </Medalhao>
  ),

  /* U5: vinho na mesa. Garfo e taca lado a lado, faisca do encontro. */
  5: (
    <Medalhao tinta={WARM_100}>
      <path
        d="M32 8.5 L33 11 L35.5 12 L33 13 L32 15.5 L31 13 L28.5 12 L31 11 Z"
        fill={OURO_500}
      />
      <path d="M17.5 17 V22.5 A4.5 4.5 0 0 0 26.5 22.5 V17 M22 17 V21.5" stroke={VINHO_900} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M22 27 V46.5" stroke={VINHO_900} strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M37.5 21.5 H46.7 C46.3 26.7 44.4 29.8 42.1 30.8 C39.8 29.8 37.9 26.7 37.5 21.5 Z"
        fill={VINHO_700}
      />
      <path
        d="M36 17 H48.2 C48.2 25.2 45.8 30.6 42.1 32 C38.4 30.6 36 25.2 36 17 Z"
        fill="none"
        {...aro}
      />
      <path d="M42.1 32 V40" stroke={VINHO_900} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36.5 42.5 Q42.1 40 47.7 42.5" stroke={VINHO_900} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="52" rx="16" ry="3" fill="none" {...fino} />
    </Medalhao>
  ),

  /* U6: Brasil e Andes. Cordilheira, neve, sol e bandeira no cume. */
  6: (
    <Medalhao tinta={OK_100}>
      <circle cx="47" cy="16" r="5" fill={OURO_500} {...fino} />
      <path
        d="M14 46 L26 24 L34 38 L41 28 L52 46 Z"
        fill={VINHO_700}
        {...aro}
      />
      <path
        d="M22.5 30.5 L26 24 L29.5 30.5 C28 32 24 32 22.5 30.5 Z"
        fill={PAPEL}
        stroke={VINHO_900}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M26 24 V15" stroke={VINHO_900} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 15.5 L33 17.5 L26 19.5 Z" fill={OURO_500} {...fino} />
      <circle cx="20" cy="51.5" r="1.3" fill={VINHO_900} />
      <circle cx="26" cy="50.8" r="1.3" fill={VINHO_900} />
      <circle cx="32" cy="50.5" r="1.3" fill={VINHO_900} />
      <circle cx="38" cy="50.8" r="1.3" fill={VINHO_900} />
      <circle cx="44" cy="51.5" r="1.3" fill={VINHO_900} />
    </Medalhao>
  ),
};

type EmblemaProps = {
  unidade: 1 | 2 | 3 | 4 | 5 | 6;
  size?: number;
  /** Quando presente, vira imagem acessivel; sem label, e decorativo */
  label?: string;
  className?: string;
};

export function Emblema({ unidade, size = 64, label, className }: EmblemaProps) {
  return (
    <span
      className={className ? `emblema ${className}` : 'emblema'}
      style={{ display: 'inline-flex', flex: 'none', width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {EMBLEMAS[unidade]}
      </svg>
    </span>
  );
}
