/**
 * Mascotinho: a tacinha simpatica aprovada (bochechas rosadas, bracinhos,
 * brilho no olho). Maquina de estados por classe CSS (ver mascotinho.css):
 *   idle   -> olha pros lados, pisca e da um tchauzinho (mao pra cima)
 *   feliz  -> pula comemorando (squash & stretch, bracos pro alto, faisca)
 *   triste -> abaixa a cabeca, biquinho e uma lagrima (nunca dramatico)
 * So transform/opacity sao animados (60fps em Android mid-range).
 */
import { useId } from 'react';
import './mascotinho.css';

export type EstadoMascote = 'idle' | 'feliz' | 'triste';

export interface MascotinhoProps {
  tamanho?: number;
  estado?: EstadoMascote;
  className?: string;
  /** Com rotulo vira role="img"; sem ele e decorativo (aria-hidden). */
  rotulo?: string;
}

const BOJO = 'M26 30 C27 70 40 94 60 94 C80 94 93 70 94 30 Z';

export function Mascotinho({ tamanho = 92, estado = 'idle', className, rotulo }: MascotinhoProps) {
  const clipId = `masc-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <svg
      className={`mascotinho mascotinho-${estado}${className ? ` ${className}` : ''}`}
      width={tamanho}
      height={Math.round((tamanho * 150) / 120)}
      viewBox="0 0 120 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': true })}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BOJO} />
        </clipPath>
      </defs>

      <g className="masc-corpo">
        {/* haste + base douradas */}
        <rect x="56" y="88" width="8" height="40" rx="4" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.5" />
        <ellipse cx="60" cy="131" rx="26" ry="6" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.5" />

        {/* bracinhos (o direito acena no idle, ambos sobem no feliz) */}
        <g className="masc-be">
          <path d="M30 72 C 22 75, 17 81, 19 88" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="19" cy="88" r="2.6" fill="var(--wine-900)" />
        </g>
        <g className="masc-bd">
          {/* braco superior: ombro -> cotovelo */}
          <path d="M90 72 Q95 76 99 81" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
          {/* antebraco + mao: gira no cotovelo para acenar (mao acima do cotovelo) */}
          <g className="masc-bd-ante">
            <path d="M99 81 Q101 85 101 89" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="101" cy="89" r="2.6" fill="var(--wine-900)" />
            {/* relogio de pulso: escondido por padrao, so aparece no Inicio */}
            <g className="masc-relogio">
              <rect x="97.4" y="84.3" width="5.4" height="2.1" rx="1" fill="var(--wine-900)" />
              <circle cx="100.1" cy="85.3" r="2.1" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="0.8" />
              <circle cx="100.1" cy="85.3" r="0.6" fill="var(--wine-900)" />
            </g>
          </g>
        </g>

        {/* bojo com o vinho recortado dentro */}
        <path d={BOJO} fill="#FFFCF8" stroke="var(--wine-900)" strokeWidth="2.5" />
        <g clipPath={`url(#${clipId})`}>
          <g className="masc-vinho">
            <path d="M16 58 Q 60 52 104 58 L 104 100 L 16 100 Z" fill="var(--wine-700)" />
          </g>
        </g>
        <ellipse cx="60" cy="30" rx="34" ry="7.5" fill="#FFFCF8" stroke="var(--wine-900)" strokeWidth="2.5" />

        {/* bochechas rosadas */}
        <ellipse cx="42" cy="56" rx="6" ry="3.6" fill="#E59AA0" opacity="0.7" />
        <ellipse cx="78" cy="56" rx="6" ry="3.6" fill="#E59AA0" opacity="0.7" />

        {/* sobrancelhas (variam por estado) */}
        <path className="masc-br-i" d="M43 35 Q49 32 55 35" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path className="masc-br-i" d="M65 35 Q71 32 77 35" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path className="masc-br-f" d="M43 33 Q49 28 55 32" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path className="masc-br-f" d="M65 32 Q71 28 77 33" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path className="masc-br-t" d="M44 37 Q49 33 55 33" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path className="masc-br-t" d="M65 33 Q71 33 76 37" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />

        {/* olhos (piscam) com pupilas (olham pros lados) */}
        <g className="masc-olhos">
          <ellipse cx="49" cy="46" rx="7" ry="8.5" fill="#fff" stroke="var(--wine-900)" strokeWidth="2" />
          <ellipse cx="71" cy="46" rx="7" ry="8.5" fill="#fff" stroke="var(--wine-900)" strokeWidth="2" />
          <g className="masc-pupilas">
            <circle cx="50.5" cy="47.5" r="3.6" fill="var(--wine-900)" />
            <circle cx="52" cy="46" r="1.3" fill="#fff" />
            <circle cx="69.5" cy="47.5" r="3.6" fill="var(--wine-900)" />
            <circle cx="71" cy="46" r="1.3" fill="#fff" />
          </g>
        </g>

        {/* boca (varia por estado) */}
        <path className="masc-bo-i" d="M52 60 Q60 67 68 60" stroke="var(--wine-900)" strokeWidth="2.5" strokeLinecap="round" />
        <path className="masc-bo-f" d="M49 60 Q60 73 71 60" stroke="var(--wine-900)" strokeWidth="2.8" strokeLinecap="round" />
        <path className="masc-bo-t" d="M52 66 Q60 60 68 66" stroke="var(--wine-900)" strokeWidth="2.5" strokeLinecap="round" />

        {/* lagrima (triste) e faisca (feliz) */}
        <path className="masc-lagrima" d="M44 50 C 41 54, 41 57, 44 58 C 47 57, 47 54, 44 50 Z" fill="#9CC3DD" />
        <path
          className="masc-faisca"
          d="M94 9 l1.8 5.4 5.4 1.8 -5.4 1.8 -1.8 5.4 -1.8 -5.4 -5.4 -1.8 5.4 -1.8 Z"
          fill="var(--gold-500)"
        />
      </g>
    </svg>
  );
}
