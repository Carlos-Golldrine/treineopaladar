import { useId } from 'react';

/**
 * Elemento-assinatura da trilha: taca de vinho proprietaria que se preenche
 * conforme o progresso da licao.
 * - bloqueada: contorno neutro, vazia, cadeado sutil dentro do bojo
 * - disponivel: contorno vinho, vazia (pronta para encher)
 * - concluida: cheia de vinho (sobe um dedo a cada coroa)
 * - ouro (3 coroas): transbordando dourado
 */
export type EstadoTaca = 'bloqueada' | 'disponivel' | 'concluida' | 'ouro';

interface TacaProps {
  estado: EstadoTaca;
  /** 0 a 3; afina o nivel do vinho quando concluida. */
  coroas?: number;
  size?: number;
}

const BOJO = 'M17 7 C17 28 22 39 32 42.5 C42 39 47 28 47 7 Z';

export function Taca({ estado, coroas = 0, size = 44 }: TacaProps) {
  const clipId = `taca-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  const contorno = estado === 'bloqueada' ? 'var(--neutral-300)' : 'var(--wine-700)';

  /* Nivel do vinho no bojo (0 vazio, 1 na borda) */
  const nivel = estado === 'ouro' ? 1 : estado === 'concluida' ? 0.78 + 0.07 * Math.min(coroas, 3) : 0;
  const topoBojo = 7;
  const fundoBojo = 42.5;
  const yVinho = topoBojo + (1 - nivel) * (fundoBojo - topoBojo);

  return (
    <svg
      width={size}
      height={size * (84 / 64)}
      viewBox="0 0 64 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BOJO} />
        </clipPath>
      </defs>

      {/* Vinho dentro do bojo */}
      {nivel > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <rect x="14" y={yVinho} width="36" height={fundoBojo - yVinho + 2} fill="var(--wine-700)" />
          <ellipse cx="32" cy={yVinho} rx="15" ry="2.4" fill="rgba(250, 250, 248, 0.28)" />
        </g>
      )}

      {/* Transbordo dourado (3 coroas) */}
      {estado === 'ouro' && (
        <g fill="var(--gold-500)">
          <ellipse cx="32" cy="7" rx="16.5" ry="3.4" />
          <path d="M15.5 8 C15 13 13.4 16 13.4 19 a2.4 2.4 0 0 0 4.8 0 C18.2 16 16.4 13 15.5 8 Z" />
          <path d="M48.5 8 C48 14.5 46.4 18.5 46.4 22 a2.4 2.4 0 0 0 4.8 0 C51.2 18.5 49.4 14.5 48.5 8 Z" />
        </g>
      )}

      {/* Corpo da taca: bojo, haste e base */}
      <path d={BOJO} stroke={contorno} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="32" y1="43" x2="32" y2="66" stroke={contorno} strokeWidth="3" strokeLinecap="round" />
      <path d="M20 70 Q32 65.5 44 70" stroke={contorno} strokeWidth="3" strokeLinecap="round" />

      {/* Cadeado sutil quando bloqueada */}
      {estado === 'bloqueada' && (
        <g>
          <path
            d="M28.5 24.5 v-3.2 a3.5 3.5 0 0 1 7 0 v3.2"
            stroke="var(--neutral-400)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="25.5" y="24.5" width="13" height="10" rx="2.5" fill="var(--neutral-400)" />
        </g>
      )}
    </svg>
  );
}
