import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS_NOTIF,
  COPY_NOTIF,
  resolverCopy,
  type CategoriaNotif,
  type VarianteCopy,
} from '../copy';

/* As 14 categorias que o brief exige na biblioteca tipada. */
const CATEGORIAS_ESPERADAS: CategoriaNotif[] = [
  'ofensiva_risco',
  'meta_diaria',
  'marco_streak',
  'winback_d1',
  'winback_d3',
  'winback_d7',
  'winback_d14',
  'desistencia',
  'liga',
  'mesa_social',
  'desafio_dia',
  'conquista',
  'curiosidade',
  'recompensa',
];

/** Toda variante da biblioteca, achatada com sua categoria. */
function todas(): Array<{ cat: CategoriaNotif; v: VarianteCopy }> {
  return CATEGORIAS_NOTIF.flatMap((cat) => COPY_NOTIF[cat].map((v) => ({ cat, v })));
}

describe('biblioteca de copy de notificacao', () => {
  it('tem exatamente as categorias esperadas', () => {
    expect(new Set(CATEGORIAS_NOTIF)).toEqual(new Set(CATEGORIAS_ESPERADAS));
    expect(CATEGORIAS_NOTIF).toHaveLength(CATEGORIAS_ESPERADAS.length);
  });

  it('cada categoria tem ao menos uma variante com titulo e corpo', () => {
    for (const cat of CATEGORIAS_NOTIF) {
      expect(COPY_NOTIF[cat].length).toBeGreaterThanOrEqual(1);
      for (const v of COPY_NOTIF[cat]) {
        expect(v.titulo.trim().length).toBeGreaterThan(0);
        expect(v.corpo.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('nunca usa travessao (em dash ou en dash) na copy', () => {
    for (const { cat, v } of todas()) {
      expect(v.titulo, `titulo de ${cat}`).not.toMatch(/[–—]/);
      expect(v.corpo, `corpo de ${cat}`).not.toMatch(/[–—]/);
    }
  });

  it('nunca usa emoji na copy', () => {
    /* Faixas de pictogramas, emoticons, simbolos e dingbats emoji. */
    const emoji =
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}]/u;
    for (const { cat, v } of todas()) {
      expect(emoji.test(v.titulo), `titulo de ${cat}`).toBe(false);
      expect(emoji.test(v.corpo), `corpo de ${cat}`).toBe(false);
    }
  });

  it('nunca usa o vocabulario banido "ultima chance"', () => {
    for (const { v } of todas()) {
      expect(v.titulo.toLowerCase()).not.toContain('ultima chance');
      expect(v.corpo.toLowerCase()).not.toContain('ultima chance');
    }
  });

  it('respeita os limites de tamanho (titulo curto, corpo medio)', () => {
    for (const { cat, v } of todas()) {
      /* titulo ~30-40 com folga; corpo ~100-120 visiveis com folga */
      expect(v.titulo.length, `titulo de ${cat} muito longo`).toBeLessThanOrEqual(44);
      expect(v.corpo.length, `corpo de ${cat} muito longo`).toBeLessThanOrEqual(125);
    }
  });

  it('resolve as variaveis {N} {nome} {X} {unidade}', () => {
    expect(resolverCopy('Falta uma licao pra manter os {N} dias.', { N: 7 })).toBe(
      'Falta uma licao pra manter os 7 dias.',
    );
    expect(resolverCopy('{nome} ta te esperando', { nome: 'Ana' })).toBe('Ana ta te esperando');
    expect(resolverCopy('Faltam {X} XP', { X: 20 })).toBe('Faltam 20 XP');
    expect(resolverCopy('Voce dominou {unidade}.', { unidade: 'Tinto x Branco' })).toBe(
      'Voce dominou Tinto x Branco.',
    );
  });

  it('deixa a variavel intacta quando nao ha valor (nunca quebra)', () => {
    expect(resolverCopy('os {N} dias', {})).toBe('os {N} dias');
  });
});
