/**
 * Props de cena das micro-aulas: SVGs proprietários simples, traço grosso
 * arredondado, duotone vinho/dourado (shape language do set do app).
 * Nada de ícone de estoque: tudo desenhado à mão para a cena.
 */

export type PropCenaId = 'garrafa' | 'taca-cha' | 'limao' | 'sol' | 'frio' | 'uva';

interface PropCenaProps {
  size?: number;
}

function moldura(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true as const,
  };
}

/** Garrafa de vinho com rótulo dourado. */
export function PropGarrafa({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <path
        d="M27 8 h10 v10 c0 4.5 6 7.5 6 14.5 V52 a4 4 0 0 1 -4 4 H25 a4 4 0 0 1 -4 -4 V32.5 c0 -7 6 -10 6 -14.5 Z"
        fill="var(--wine-700)"
        stroke="var(--wine-900)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <rect x="24" y="37" width="16" height="10" rx="2" fill="var(--gold-500)" />
      <rect x="26" y="5" width="12" height="5" rx="2" fill="var(--wine-900)" />
    </svg>
  );
}

/** Xícara de chá preto (a referência didática do tanino). */
export function PropTacaCha({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <path d="M24 14 q-3 4 0 7 q3 3 0 6" stroke="var(--neutral-400)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 12 q-3 4 0 7 q3 3 0 6" stroke="var(--neutral-400)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M13 32 h32 v7 c0 9 -7 14 -16 14 s-16 -5 -16 -14 Z"
        fill="var(--bg)"
        stroke="var(--wine-900)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M16.5 35 h25 v4 c0 3 -1.5 5.5 -4 7.5 h-17 c-2.5 -2 -4 -4.5 -4 -7.5 Z" fill="var(--gold-700)" />
      <path
        d="M45 36 c5 0 7 2.5 7 5.5 c0 4 -4 6.5 -9 6"
        stroke="var(--wine-900)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Limão em meia fatia (acidez). */
export function PropLimao({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <circle cx="32" cy="36" r="17" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.6" />
      <circle cx="32" cy="36" r="11.5" fill="var(--bg)" opacity="0.55" />
      <g stroke="var(--gold-700)" strokeWidth="2.2" strokeLinecap="round">
        <line x1="32" y1="26" x2="32" y2="46" />
        <line x1="23.5" y1="31" x2="40.5" y2="41" />
        <line x1="23.5" y1="41" x2="40.5" y2="31" />
      </g>
      <path
        d="M38 16 q6 -7 13 -4 q-2 7 -10 8 Z"
        fill="var(--ok-700)"
        stroke="var(--wine-900)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sol (clima quente, uva madura). */
export function PropSol({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <circle cx="32" cy="32" r="12" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.6" />
      <g stroke="var(--gold-700)" strokeWidth="2.8" strokeLinecap="round">
        <line x1="32" y1="8" x2="32" y2="14" />
        <line x1="32" y1="50" x2="32" y2="56" />
        <line x1="8" y1="32" x2="14" y2="32" />
        <line x1="50" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="19.2" y2="19.2" />
        <line x1="44.8" y1="44.8" x2="49" y2="49" />
        <line x1="15" y1="49" x2="19.2" y2="44.8" />
        <line x1="44.8" y1="19.2" x2="49" y2="15" />
      </g>
    </svg>
  );
}

/** Floco de frio (clima frio, vinho mais leve e ácido). */
export function PropFrio({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <circle cx="32" cy="32" r="22" fill="var(--neutral-100)" />
      <g stroke="var(--wine-700)" strokeWidth="2.6" strokeLinecap="round">
        <line x1="32" y1="14" x2="32" y2="50" />
        <line x1="16.5" y1="23" x2="47.5" y2="41" />
        <line x1="16.5" y1="41" x2="47.5" y2="23" />
        <path d="M27 18 L32 22 L37 18" />
        <path d="M27 46 L32 42 L37 46" />
        <path d="M19 28.5 L24.5 27.5 L24 22" />
        <path d="M45 35.5 L39.5 36.5 L40 42" />
        <path d="M19 35.5 L24.5 36.5 L24 42" />
        <path d="M45 28.5 L39.5 27.5 L40 22" />
      </g>
    </svg>
  );
}

/** Cacho de uva. */
export function PropUva({ size = 64 }: PropCenaProps) {
  return (
    <svg {...moldura(size)}>
      <path d="M32 16 q1 -6 7 -8" stroke="var(--wine-900)" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M39 8 q8 -2 12 4 q-6 5 -12 1 Z"
        fill="var(--ok-700)"
        stroke="var(--wine-900)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <g fill="var(--wine-700)" stroke="var(--wine-900)" strokeWidth="2.2">
        <circle cx="24" cy="24" r="6.5" />
        <circle cx="40" cy="24" r="6.5" />
        <circle cx="32" cy="22" r="6.5" />
        <circle cx="20" cy="36" r="6.5" />
        <circle cx="44" cy="36" r="6.5" />
        <circle cx="32" cy="35" r="6.5" />
        <circle cx="26" cy="47" r="6.5" />
        <circle cx="38" cy="47" r="6.5" />
        <circle cx="32" cy="56" r="5.5" />
      </g>
      <circle cx="29.5" cy="20" r="1.6" fill="var(--bg)" opacity="0.7" />
    </svg>
  );
}

/** Registro: id do roteiro -> componente do prop. */
export const PROPS_CENA = {
  garrafa: PropGarrafa,
  'taca-cha': PropTacaCha,
  limao: PropLimao,
  sol: PropSol,
  frio: PropFrio,
  uva: PropUva,
} as const satisfies Record<PropCenaId, (p: PropCenaProps) => JSX.Element>;
