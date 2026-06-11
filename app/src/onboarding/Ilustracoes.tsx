import { useId } from 'react';

/**
 * Ilustracoes proprietarias da J1 (servir gelado): taca de branco suada
 * de geladeira e taca de tinto. Mesmo shape language da Taca da trilha:
 * contorno wine-900, preenchimento flat, brilho discreto.
 */

function idLimpo(bruto: string): string {
  return bruto.replace(/[^a-zA-Z0-9-]/g, '');
}

export function TacaBranca() {
  const clipId = `branca-${idLimpo(useId())}`;
  return (
    <svg viewBox="0 0 88 112" className="ilustra" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M27 10 C27 36 33 49 44 53 C55 49 61 36 61 10 Z" />
        </clipPath>
      </defs>

      {/* Vinho branco (dourado palido) */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="24" y="22" width="40" height="34" fill="rgba(212, 165, 116, 0.45)" />
        <ellipse cx="44" cy="22" rx="15.5" ry="2.6" fill="rgba(250, 250, 248, 0.55)" />
      </g>

      {/* Corpo da taca */}
      <path d="M27 10 C27 36 33 49 44 53 C55 49 61 36 61 10 Z" stroke="var(--wine-900)" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="44" y1="53" x2="44" y2="84" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
      <path d="M31 90 Q44 85 57 90" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />

      {/* Gotas de geladeira na parede do vidro */}
      <g stroke="var(--neutral-400)" strokeWidth="1.6" fill="var(--bg)">
        <circle cx="34" cy="17" r="2.2" />
        <circle cx="55" cy="29" r="2.5" />
        <circle cx="37" cy="34" r="2" />
      </g>
      <path d="M55 33.5 v5" stroke="var(--neutral-400)" strokeWidth="1.6" strokeLinecap="round" />

      {/* Frio no ar: faisca de gelo */}
      <g stroke="var(--neutral-300)" strokeWidth="1.8" strokeLinecap="round">
        <path d="M71 16 v10" />
        <path d="M66 21 h10" />
        <path d="M67.5 17.5 l7 7" />
        <path d="M74.5 17.5 l-7 7" />
      </g>
    </svg>
  );
}

export function TacaTinta() {
  const clipId = `tinta-${idLimpo(useId())}`;
  return (
    <svg viewBox="0 0 88 112" className="ilustra" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M22 14 C22 38 30 50 44 54 C58 50 66 38 66 14 Z" />
        </clipPath>
      </defs>

      {/* Vinho tinto */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="19" y="27" width="50" height="32" fill="var(--wine-700)" />
        <ellipse cx="44" cy="27" rx="19" ry="2.8" fill="rgba(250, 250, 248, 0.25)" />
      </g>

      {/* Corpo da taca (bojo mais redondo, de tinto) */}
      <path d="M22 14 C22 38 30 50 44 54 C58 50 66 38 66 14 Z" stroke="var(--wine-900)" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="44" y1="54" x2="44" y2="84" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
      <path d="M31 90 Q44 85 57 90" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />

      {/* Brilho do vidro */}
      <circle cx="33" cy="22" r="2" fill="var(--bg)" />
      <path d="M30 31 C30.5 36 32.5 40 35 42" stroke="rgba(250, 250, 248, 0.4)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
