/**
 * Avatares-preset (sem upload): um id curto escolhido no perfil. Cada um e um
 * circulo de cor da marca + um icone proprio (vinho/celebracao). Sem foto =
 * sem storage, sem moderacao, privacidade ok. Fallback: inicial do nome.
 */
import type { CSSProperties, JSX } from 'react';
import './avatar.css';

interface Preset {
  bg: string;
  fg: string;
  rotulo: string;
  icone: JSX.Element;
}

const T = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const AVATARES: Record<string, Preset> = {
  taca: {
    bg: 'var(--wine-700)',
    fg: 'var(--bg)',
    rotulo: 'Taça de vinho',
    icone: (
      <g {...T}>
        <path d="M7 3h10l-1 6a4 4 0 0 1-8 0L7 3Z" />
        <path d="M12 15v5M8.5 20h7" />
      </g>
    ),
  },
  uva: {
    bg: 'var(--ok-700)',
    fg: 'var(--bg)',
    rotulo: 'Cacho de uvas',
    icone: (
      <g>
        <path d="M12 4v3" {...T} />
        <g fill="currentColor">
          <circle cx="12" cy="8.6" r="2.6" />
          <circle cx="9" cy="11" r="2.6" />
          <circle cx="15" cy="11" r="2.6" />
          <circle cx="10.6" cy="13.8" r="2.6" />
          <circle cx="13.4" cy="13.8" r="2.6" />
          <circle cx="12" cy="16.6" r="2.6" />
        </g>
      </g>
    ),
  },
  garrafa: {
    bg: 'var(--wine-900)',
    fg: 'var(--bg)',
    rotulo: 'Garrafa',
    icone: (
      <g {...T}>
        <path d="M10 3h4v3l2 3v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3V3Z" />
      </g>
    ),
  },
  folha: {
    bg: 'var(--gold-700)',
    fg: 'var(--bg)',
    rotulo: 'Folha de parreira',
    icone: (
      <g {...T}>
        <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14Z" />
        <path d="M5 19l8-8" />
      </g>
    ),
  },
  rolha: {
    bg: 'var(--warm-700)',
    fg: 'var(--bg)',
    rotulo: 'Rolha',
    icone: (
      <g {...T}>
        <rect x="9" y="4" width="6" height="16" rx="2.5" />
        <path d="M9 9.5h6M9 14.5h6" />
      </g>
    ),
  },
  estrela: {
    bg: 'var(--gold-500)',
    fg: 'var(--wine-900)',
    rotulo: 'Estrela',
    icone: (
      <g fill="currentColor">
        <path d="M12 3l2.4 5.6 6 .5-4.6 4 1.4 6L12 16l-5.6 3.1 1.4-6-4.6-4 6-.5Z" />
      </g>
    ),
  },
  coracao: {
    bg: 'var(--ember-500)',
    fg: 'var(--bg)',
    rotulo: 'Coração',
    icone: (
      <g fill="currentColor">
        <path d="M12 20C7 16 4 12.6 4 9.6A3.6 3.6 0 0 1 12 7.2 3.6 3.6 0 0 1 20 9.6C20 12.6 17 16 12 20Z" />
      </g>
    ),
  },
  flauta: {
    bg: 'var(--neutral-600)',
    fg: 'var(--bg)',
    rotulo: 'Espumante',
    icone: (
      <g {...T}>
        <path d="M9 3h6l-1 9a2 2 0 0 1-4 0L9 3Z" />
        <path d="M12 14v6M9.5 20h5" />
      </g>
    ),
  },
};

export const AVATAR_IDS = Object.keys(AVATARES);

interface AvatarProps {
  /** Id do preset; null/desconhecido cai na inicial do nome. */
  id: string | null;
  nome?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ id, nome, size = 48, className }: AvatarProps) {
  const preset = id ? AVATARES[id] : undefined;
  const base: CSSProperties = { width: size, height: size };

  if (preset) {
    return (
      <span
        className={className ? `avatar ${className}` : 'avatar'}
        style={{ ...base, background: preset.bg, color: preset.fg }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.58)} height={Math.round(size * 0.58)}>
          {preset.icone}
        </svg>
      </span>
    );
  }

  const inicial = (nome?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <span
      className={className ? `avatar avatar-inicial ${className}` : 'avatar avatar-inicial'}
      style={{ ...base, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {inicial}
    </span>
  );
}
