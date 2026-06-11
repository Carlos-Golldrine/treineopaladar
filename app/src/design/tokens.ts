/**
 * Tokens tipados do design system. Espelho exato de tokens.css.
 * Fonte da verdade: BRIEF-DESIGN.md. Toda cor tem papel nomeado.
 */

export const color = {
  /** Texto display, fundos profundos */
  wine900: '#4A1F24',
  /** Acao primaria, selecao */
  wine700: '#722F37',
  /** Tier medio de match; icone de cristal sobre fundo claro */
  gold700: '#B8894A',
  /** Recompensa, destaque, cristais */
  gold500: '#D4A574',
  /** Fundo base quente, nunca branco puro */
  bg: '#FAFAF8',
  /** Verde de acerto */
  ok700: '#2E5734',
  /** Fundo de acerto, derivado do ok-700 sobre bg */
  ok100: '#E3EBE0',
  /** Erro em tom terroso, nunca vermelho agressivo */
  warm700: '#A0522D',
  /** Fundo de erro, derivado do warm-700 sobre bg */
  warm100: '#F4E5DB',
  /** Streak: ambar de fogo proprio */
  ember500: '#D98E32',
  /** XP e energia derivam do gold */
  xp: '#D4A574',
} as const;

/** Neutros quentes proprios: 8 passos levemente avermelhados */
export const neutral = {
  50: '#F6F3F1',
  100: '#EDE8E5',
  200: '#DED5D1',
  300: '#C5BAB4',
  400: '#A39690',
  500: '#857770',
  600: '#645850',
  700: '#463C37',
} as const;

export const font = {
  /** Fraunces 600 (e italica em celebracao): carrega a personalidade */
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  /** Inter 400/500/600: UI e corpo */
  ui: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  /** JetBrains Mono 500: numeros (XP, streak, cristais, cronometro) */
  mono: "'JetBrains Mono', ui-monospace, 'Cascadia Mono', monospace",
} as const;

/** Escala modular em px: 13 / 15 / 17 / 22 / 28 / 36 */
export const text = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 22,
  xl: 28,
  xxl: 36,
} as const;

/** Espaco, grid 8pt: 4 / 8 / 12 / 16 / 24 / 32 */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
} as const;

/** Raios com intencao: 3 e somente 3 */
export const radius = {
  /** Inputs e chips */
  control: 8,
  /** Cards */
  card: 16,
  /** Botoes de acao */
  pill: 999,
} as const;

/** Sombras: 2 niveis, tingidas de vinho, nunca preto puro */
export const shadow = {
  sm: '0 1px 2px rgba(74, 31, 36, 0.08), 0 1px 4px rgba(74, 31, 36, 0.06)',
  md: '0 2px 6px rgba(74, 31, 36, 0.10), 0 10px 24px rgba(74, 31, 36, 0.12)',
} as const;

export const tokens = { color, neutral, font, text, space, radius, shadow } as const;
export type Tokens = typeof tokens;
