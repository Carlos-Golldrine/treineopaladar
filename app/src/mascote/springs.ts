/**
 * Molas amortecidas amostradas em keyframes para a Web Animations API.
 * Zero dependências: a física (oscilador harmônico amortecido) é resolvida
 * analiticamente e virou uma lista de valores com easing linear.
 * É o motor de todo movimento do mascote Tchin.
 */

export interface ConfigMola {
  /** Rigidez da mola (stiffness). Maior = mais rápido. */
  rigidez?: number;
  /** Amortecimento (damping). Menor = mais oscilação. */
  amortecimento?: number;
  /** Massa. Maior = mais lento e pesado. */
  massa?: number;
}

export interface MolaAmostrada {
  /** Valores amostrados de `de` até `para` (pode passar do alvo: overshoot). */
  valores: number[];
  /** Duração total em ms até a mola assentar. */
  duracao: number;
}

const PASSOS = 28;

/** Resolve a mola de `de` a `para` e devolve amostras prontas para keyframes. */
export function amostrarMola(de: number, para: number, cfg: ConfigMola = {}): MolaAmostrada {
  const { rigidez = 190, amortecimento = 13, massa = 1 } = cfg;
  const w0 = Math.sqrt(rigidez / massa);
  const zeta = amortecimento / (2 * Math.sqrt(rigidez * massa));
  const delta = de - para;

  /* Tempo até a amplitude cair a ~1% (limitado para nunca passar de 1,4s) */
  const assentamento = zeta > 0 && zeta < 1 ? -Math.log(0.01) / (zeta * w0) : 4 / w0;
  const duracao = Math.min(1400, Math.max(260, assentamento * 1000));

  const valores: number[] = [];
  for (let i = 0; i <= PASSOS; i++) {
    const t = (i / PASSOS) * (duracao / 1000);
    let x: number;
    if (zeta < 1) {
      const wd = w0 * Math.sqrt(1 - zeta * zeta);
      const env = Math.exp(-zeta * w0 * t);
      x = para + delta * env * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
    } else {
      /* Criticamente amortecida ou mais: sem oscilação */
      const env = Math.exp(-w0 * t);
      x = para + delta * env * (1 + w0 * t);
    }
    valores.push(x);
  }
  valores[valores.length - 1] = para;
  return { valores, duracao };
}

/** Interpolação linear que extrapola fora de [0,1] (necessário p/ overshoot). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* Receitas de mola com papel nomeado (mesma disciplina dos tokens de cor) */
export const MOLA_PADRAO: ConfigMola = { rigidez: 190, amortecimento: 13 };
export const MOLA_SALTITANTE: ConfigMola = { rigidez: 230, amortecimento: 9 };
export const MOLA_GENTIL: ConfigMola = { rigidez: 130, amortecimento: 17 };
export const MOLA_RAPIDA: ConfigMola = { rigidez: 520, amortecimento: 22 };
export const MOLA_SLOSH: ConfigMola = { rigidez: 130, amortecimento: 6 };
