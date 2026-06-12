/**
 * Som de jogo do Treine seu Paladar, sintetizado em RUNTIME via Web Audio.
 * Zero arquivos de audio (BRIEF-DESIGN.md secao 7, item 6).
 *
 * Paleta sonora (volume baixo por padrao, nunca punitivo):
 * - acerto:    ding curto, 2 notas subindo (E5 -> B5)
 * - erro:      thud suave e grave com queda de tom (NUNCA buzzer)
 * - conclusao: acorde curto de A maior, quente
 * - marco:     arpejo de 3 notas + brilho agudo no topo
 * - moeda:     blip rapido de cristal (B5 -> E6)
 *
 * Politicas:
 * - AudioContext criado/resumido dentro do primeiro gesto do toque
 *   (politica de autoplay); cada `tocar` tambem tenta resumir.
 * - Toggle persistido em localStorage (chave tp.som.v1), padrao ligado.
 * - Vibracao Android segue separada (licao/tipos.ts, vibrar()).
 */

export type NomeSom = 'acerto' | 'erro' | 'conclusao' | 'marco' | 'moeda';

const CHAVE_SOM = 'tp.som.v1';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE_SOM) !== 'off';
  } catch {
    return true;
  }
}

let ligado = lerPreferencia();

/** Preferencia atual (persistida). */
export function somLigado(): boolean {
  return ligado;
}

/** Liga/desliga e persiste. Ligar toca um blip de confirmacao. */
export function definirSom(on: boolean): void {
  ligado = on;
  try {
    localStorage.setItem(CHAVE_SOM, on ? 'on' : 'off');
  } catch {
    /* modo privado: a preferencia vive so na sessao */
  }
  if (on) tocar('moeda');
}

type JanelaComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function garantirCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as JanelaComWebkit).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.12; /* volume baixo por padrao */
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/* Desbloqueio no primeiro toque (autoplay): cria/resume o contexto
   dentro de um gesto real, uma unica vez. */
if (typeof window !== 'undefined') {
  const desbloquear = () => {
    garantirCtx();
  };
  window.addEventListener('pointerdown', desbloquear, { once: true, passive: true });
}

interface Nota {
  /** Atraso relativo em s a partir do agendamento. */
  em: number;
  freq: number;
  /** Duracao do decay em s. */
  dur: number;
  tipo: OscillatorType;
  /** Ganho relativo da nota (multiplica o master). */
  ganho: number;
  /** Glide de frequencia ate este valor (thud do erro, blip da moeda). */
  deslizaPara?: number;
  /** Lowpass opcional (tira qualquer aspereza do grave). */
  lowpass?: number;
}

function tocarNota(c: AudioContext, destino: GainNode, t0: number, n: Nota): void {
  const osc = c.createOscillator();
  const env = c.createGain();
  const inicio = t0 + n.em;
  osc.type = n.tipo;
  osc.frequency.setValueAtTime(n.freq, inicio);
  if (n.deslizaPara !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, n.deslizaPara), inicio + n.dur);
  }
  /* Envelope: ataque de 8ms, decay exponencial (sem cliques) */
  env.gain.setValueAtTime(0.0001, inicio);
  env.gain.exponentialRampToValueAtTime(n.ganho, inicio + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, inicio + n.dur);

  if (n.lowpass !== undefined) {
    const filtro = c.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = n.lowpass;
    osc.connect(filtro);
    filtro.connect(env);
  } else {
    osc.connect(env);
  }
  env.connect(destino);
  osc.start(inicio);
  osc.stop(inicio + n.dur + 0.05);
  osc.onended = () => {
    osc.disconnect();
    env.disconnect();
  };
}

const RECEITAS: Record<NomeSom, Nota[]> = {
  /* Ding de acerto: 2 notas subindo, curtas e claras */
  acerto: [
    { em: 0, freq: 659.25, dur: 0.1, tipo: 'sine', ganho: 0.85 },
    { em: 0.07, freq: 987.77, dur: 0.16, tipo: 'sine', ganho: 0.75 },
  ],
  /* Thud suave: grave que cai de tom, abafado. Errar faz parte. */
  erro: [
    { em: 0, freq: 150, dur: 0.22, tipo: 'sine', ganho: 1, deslizaPara: 82, lowpass: 320 },
    { em: 0.01, freq: 96, dur: 0.18, tipo: 'triangle', ganho: 0.4, deslizaPara: 70, lowpass: 240 },
  ],
  /* Acorde curto de conclusao: A maior, quente */
  conclusao: [
    { em: 0, freq: 440, dur: 0.5, tipo: 'triangle', ganho: 0.55 },
    { em: 0.02, freq: 554.37, dur: 0.5, tipo: 'triangle', ganho: 0.45 },
    { em: 0.04, freq: 659.25, dur: 0.55, tipo: 'triangle', ganho: 0.45 },
  ],
  /* Marco: arpejo subindo + brilho agudo (faisca de ouro) */
  marco: [
    { em: 0, freq: 523.25, dur: 0.22, tipo: 'triangle', ganho: 0.6 },
    { em: 0.09, freq: 659.25, dur: 0.22, tipo: 'triangle', ganho: 0.6 },
    { em: 0.18, freq: 783.99, dur: 0.3, tipo: 'triangle', ganho: 0.6 },
    { em: 0.27, freq: 1567.98, dur: 0.4, tipo: 'sine', ganho: 0.3 },
    { em: 0.3, freq: 2093, dur: 0.35, tipo: 'sine', ganho: 0.18 },
  ],
  /* Blip de moeda/cristal */
  moeda: [
    { em: 0, freq: 987.77, dur: 0.06, tipo: 'square', ganho: 0.22 },
    { em: 0.06, freq: 1318.51, dur: 0.12, tipo: 'square', ganho: 0.2 },
  ],
};

/** Toca um som da paleta. Silencioso se o toggle estiver off ou sem Web Audio. */
export function tocar(nome: NomeSom): void {
  if (!ligado) return;
  const c = garantirCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + 0.01;
  for (const n of RECEITAS[nome]) tocarNota(c, master, t0, n);
}
