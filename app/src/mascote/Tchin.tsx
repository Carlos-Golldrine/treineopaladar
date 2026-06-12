/**
 * Tchin: o mascote VIVO do Treine seu Paladar.
 * Uma taça de vinho com personalidade. Anatomia em camadas SVG:
 *   bojo = cabeça (olhos redondos com brilho, sobrancelhas expressivas)
 *   vinho dentro do bojo = elemento vivo (onda contínua + slosh por mola)
 *   haste + base = corpo · bracinhos finos
 * A dupla de taças brindando é a LOGO da marca, não o personagem.
 *
 * Rig: cada parte tem um canal próprio de animação (WAAPI) dirigido por
 * molas amostradas (springs.ts). Trocar de estado substitui o canal a
 * partir da pose corrente: transições sempre interrompíveis.
 * Só `transform` e `opacity` são animados (60fps em Android mid-range).
 */
import { useEffect, useId, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  amostrarMola,
  lerp,
  MOLA_GENTIL,
  MOLA_PADRAO,
  MOLA_RAPIDA,
  MOLA_SALTITANTE,
  MOLA_SLOSH,
  type ConfigMola,
} from './springs';
import './mascote.css';

export type EstadoTchin = 'idle' | 'feliz' | 'lamenta' | 'ensina' | 'celebra' | 'surpreso';

export interface TchinProps {
  estado?: EstadoTchin;
  /** Largura em px (altura segue a proporção do viewBox). */
  tamanho?: number;
  /** Alvo do olhar em coordenadas da página (clientX/clientY). */
  alvoX?: number;
  alvoY?: number;
  /** Olhos seguem o toque mais recente na tela (padrão: sim). */
  segueToque?: boolean;
  /** Força a primeira piscada cedo (rajadas de captura do laboratório). */
  primeiraPiscadaMs?: number;
  /** Quando presente vira role="img"; sem ele o mascote é decorativo. */
  rotulo?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Poses: cada parte do rig tem um transform alvo por estado            */
/* ------------------------------------------------------------------ */

interface Pose {
  x?: number;
  y?: number;
  rot?: number;
  sx?: number;
  sy?: number;
}

const POSE_ZERO: Required<Pose> = { x: 0, y: 0, rot: 0, sx: 1, sy: 1 };

function cssTransform(p: Pose): string {
  const q = { ...POSE_ZERO, ...p };
  return `translate(${q.x}px, ${q.y}px) rotate(${q.rot}deg) scale(${q.sx}, ${q.sy})`;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const A = { ...POSE_ZERO, ...a };
  const B = { ...POSE_ZERO, ...b };
  return {
    x: lerp(A.x, B.x, t),
    y: lerp(A.y, B.y, t),
    rot: lerp(A.rot, B.rot, t),
    sx: lerp(A.sx, B.sx, t),
    sy: lerp(A.sy, B.sy, t),
  };
}

type Parte =
  | 'postura'
  | 'bracoE'
  | 'bracoD'
  | 'sobranE'
  | 'sobranD'
  | 'vinhoNivel'
  | 'arregalaE'
  | 'arregalaD'
  | 'pupilaEstE'
  | 'pupilaEstD';

const PARTES: Parte[] = [
  'postura',
  'bracoE',
  'bracoD',
  'sobranE',
  'sobranD',
  'vinhoNivel',
  'arregalaE',
  'arregalaD',
  'pupilaEstE',
  'pupilaEstD',
];

interface ReceitaEstado {
  poses: Partial<Record<Parte, Pose>>;
  mola: ConfigMola;
  /** playbackRate da onda do vinho (1 = devagar, contemplativo). */
  onda: number;
  /** playbackRate da respiração. */
  respira: number;
}

const ESTADOS: Record<EstadoTchin, ReceitaEstado> = {
  idle: {
    poses: {},
    mola: MOLA_PADRAO,
    onda: 1,
    respira: 1,
  },
  feliz: {
    poses: {
      bracoE: { rot: 100 },
      bracoD: { rot: -100 },
      sobranE: { y: -1.5 },
      sobranD: { y: -1.5 },
    },
    mola: MOLA_SALTITANTE,
    onda: 2.2,
    respira: 1.3,
  },
  lamenta: {
    /* Inclina gentil, sobrancelhas tristes, vinho baixa.
       NUNCA dramático: errar faz parte. */
    poses: {
      postura: { rot: -6 },
      bracoE: { rot: -14 },
      bracoD: { rot: 14 },
      sobranE: { rot: -13, y: -0.5 },
      sobranD: { rot: 13, y: -0.5 },
      vinhoNivel: { y: 8 },
      pupilaEstE: { y: 1.2 },
      pupilaEstD: { y: 1.2 },
    },
    mola: MOLA_GENTIL,
    onda: 0.55,
    respira: 0.7,
  },
  ensina: {
    poses: {
      postura: { rot: 7 },
      bracoE: { rot: 12 },
      bracoD: { rot: -100 },
      sobranE: { y: -1 },
      sobranD: { y: -2 },
      pupilaEstE: { x: 1.3 },
      pupilaEstD: { x: 1.3 },
    },
    mola: MOLA_SALTITANTE,
    onda: 1,
    respira: 1,
  },
  celebra: {
    poses: {
      postura: { rot: 3 },
      bracoE: { rot: 118 },
      bracoD: { rot: -118 },
      sobranE: { y: -2 },
      sobranD: { y: -2 },
      vinhoNivel: { y: -4 },
    },
    mola: MOLA_PADRAO,
    onda: 2.6,
    respira: 1.4,
  },
  surpreso: {
    poses: {
      postura: { rot: -2 },
      bracoE: { rot: 45 },
      bracoD: { rot: -45 },
      sobranE: { y: -3 },
      sobranD: { y: -3 },
      arregalaE: { sx: 1.3, sy: 1.3 },
      arregalaD: { sx: 1.3, sy: 1.3 },
    },
    mola: MOLA_RAPIDA,
    onda: 6,
    respira: 2.2,
  },
};

/* ------------------------------------------------------------------ */
/* Geometria (viewBox 132 x 150, base da taça em y=124)                */
/* ------------------------------------------------------------------ */

const VB_L = 132;
const VB_A = 150;

const BOJO = 'M38 22 C38 52 48 70 66 75 C84 70 94 52 94 22 Z';

/* Onda contínua: período 36px, anima translateX(0 -> -36) em loop */
const ONDA =
  'M-44 55 q9 -4.5 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 V88 H-44 Z';

function origem(x: number, y: number): CSSProperties {
  return { transformBox: 'view-box', transformOrigin: `${x}px ${y}px` };
}

const ORIGEM_BASE = origem(66, 124);

/* ------------------------------------------------------------------ */

export function Tchin({
  estado = 'idle',
  tamanho = 96,
  alvoX,
  alvoY,
  segueToque = true,
  primeiraPiscadaMs,
  rotulo,
  className,
}: TchinProps) {
  const clipId = `tchin-bojo-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const puloRef = useRef<SVGGElement>(null);
  const posturaRef = useRef<SVGGElement>(null);
  const respiraRef = useRef<SVGGElement>(null);
  const bracoERef = useRef<SVGGElement>(null);
  const bracoDRef = useRef<SVGGElement>(null);
  const sobranERef = useRef<SVGPathElement>(null);
  const sobranDRef = useRef<SVGPathElement>(null);
  const vinhoNivelRef = useRef<SVGGElement>(null);
  const vinhoSloshRef = useRef<SVGGElement>(null);
  const ondaRef = useRef<SVGPathElement>(null);
  const olhoPiscaERef = useRef<SVGGElement>(null);
  const olhoPiscaDRef = useRef<SVGGElement>(null);
  const arregalaERef = useRef<SVGGElement>(null);
  const arregalaDRef = useRef<SVGGElement>(null);
  const pupilaEstERef = useRef<SVGGElement>(null);
  const pupilaEstDRef = useRef<SVGGElement>(null);
  const segueERef = useRef<SVGGElement>(null);
  const segueDRef = useRef<SVGGElement>(null);
  const faiscaRef = useRef<SVGGElement>(null);
  const gotasRef = useRef<SVGGElement>(null);
  const brindeRef = useRef<SVGGElement>(null);
  const taca2Ref = useRef<SVGGElement>(null);

  const estadoRef = useRef<EstadoTchin>(estado);
  const posesRef = useRef<Partial<Record<string, Pose>>>({});
  const canaisRef = useRef(new Map<string, Animation>());
  const oneShotsRef = useRef<Animation[]>([]);
  const ondaAnimRef = useRef<Animation | null>(null);
  const respiraAnimRef = useRef<Animation | null>(null);
  const timerOlharRef = useRef<number | undefined>(undefined);
  const reduzMotionRef = useRef(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  /* ---- canal de pose: mola interrompível por parte ---- */
  const springTo = (canal: string, el: SVGElement | null, alvo: Pose, cfg: ConfigMola) => {
    if (!el) return;
    const de = posesRef.current[canal] ?? {};
    posesRef.current[canal] = alvo;
    if (reduzMotionRef.current) {
      el.style.transform = cssTransform(alvo);
      return;
    }
    const { valores, duracao } = amostrarMola(0, 1, cfg);
    const kfs = valores.map((t) => ({ transform: cssTransform(lerpPose(de, alvo, t)) }));
    const anim = el.animate(kfs, { duration: duracao, easing: 'linear', fill: 'forwards' });
    const anterior = canaisRef.current.get(canal);
    canaisRef.current.set(canal, anim);
    anterior?.cancel();
  };

  const dispararOneShot = (anim: Animation | null | undefined) => {
    if (anim) oneShotsRef.current.push(anim);
  };

  /* ---- one-shots por estado ---- */
  const pular = () => {
    const el = puloRef.current;
    if (!el) return;
    dispararOneShot(
      el.animate(
        [
          { transform: 'translateY(0) scale(1, 1)', easing: 'ease-in' },
          { transform: 'translateY(2px) scale(1.07, 0.9)', offset: 0.16, easing: 'ease-out' },
          { transform: 'translateY(-15px) scale(0.95, 1.08)', offset: 0.48, easing: 'ease-in' },
          { transform: 'translateY(0) scale(1.08, 0.9)', offset: 0.72, easing: 'ease-out' },
          { transform: 'translateY(-3px) scale(0.98, 1.03)', offset: 0.86, easing: 'ease-out' },
          { transform: 'translateY(0) scale(1, 1)' },
        ],
        { duration: 640 },
      ),
    );
  };

  const recuar = () => {
    const el = puloRef.current;
    if (!el) return;
    dispararOneShot(
      el.animate(
        [
          { transform: 'translateY(0) scale(1, 1)' },
          { transform: 'translateY(3px) scale(1.05, 0.94)', offset: 0.3 },
          { transform: 'translateY(-2px) scale(0.98, 1.03)', offset: 0.62 },
          { transform: 'translateY(0) scale(1, 1)' },
        ],
        { duration: 300, easing: 'ease-out' },
      ),
    );
  };

  const slosh = (amplitude: number, atraso = 0) => {
    const el = vinhoSloshRef.current;
    if (!el) return;
    const { valores, duracao } = amostrarMola(amplitude, 0, MOLA_SLOSH);
    dispararOneShot(
      el.animate(
        valores.map((v) => ({ transform: `rotate(${v}deg)` })),
        { duration: duracao, delay: atraso, easing: 'linear' },
      ),
    );
  };

  const tremerVinho = () => {
    const el = vinhoSloshRef.current;
    if (!el) return;
    dispararOneShot(
      el.animate(
        [0, 3, -3, 2.4, -2.4, 1.5, -1.5, 0.6, 0].map((r) => ({ transform: `rotate(${r}deg)` })),
        { duration: 620, easing: 'linear' },
      ),
    );
  };

  const faiscar = (el: SVGGElement | null, atraso: number) => {
    if (!el) return;
    dispararOneShot(
      el.animate(
        [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.25) rotate(40deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0.5) rotate(80deg)', opacity: 0 },
        ],
        { duration: 700, delay: atraso, easing: 'ease-out' },
      ),
    );
  };

  const transbordar = () => {
    const grupo = gotasRef.current;
    if (!grupo) return;
    const gotas = Array.from(grupo.children) as SVGElement[];
    gotas.forEach((gota, i) => {
      const dx = [-16, 0, 16][i % 3];
      dispararOneShot(
        gota.animate(
          [
            { transform: 'translate(0, 0) scale(0.4)', opacity: 0, easing: 'ease-out' },
            {
              transform: `translate(${dx * 0.6}px, -15px) scale(1)`,
              opacity: 1,
              offset: 0.35,
              easing: 'ease-in',
            },
            { transform: `translate(${dx}px, 28px) scale(0.85)`, opacity: 0 },
          ],
          { duration: 880, delay: 420 + i * 110 },
        ),
      );
    });
  };

  const brindar = () => {
    const el = taca2Ref.current;
    if (!el) return;
    if (reduzMotionRef.current) {
      el.style.opacity = '1';
      el.style.transform = 'translateX(2px) rotate(-7deg)';
      return;
    }
    dispararOneShot(
      el.animate(
        [
          { transform: 'translateX(52px) rotate(0deg)', opacity: 0, easing: 'ease-out' },
          { transform: 'translateX(5px) rotate(-1deg)', opacity: 1, offset: 0.5, easing: 'ease-out' },
          { transform: 'translateX(-1px) rotate(-11deg)', opacity: 1, offset: 0.72, easing: 'ease-in-out' },
          { transform: 'translateX(2px) rotate(-7deg)', opacity: 1 },
        ],
        { duration: 820, fill: 'forwards' },
      ),
    );
    faiscar(brindeRef.current, 540);
  };

  /* ---- máquina de estados ---- */
  const aplicarEstado = (alvo: EstadoTchin) => {
    estadoRef.current = alvo;
    const receita = ESTADOS[alvo];

    /* interrompe one-shots do estado anterior (volta ao atributo base) */
    oneShotsRef.current.forEach((a) => a.cancel());
    oneShotsRef.current = [];

    /* a 2ª taça e o modo reduzido limpam estilos diretos */
    if (taca2Ref.current && alvo !== 'celebra') {
      taca2Ref.current.style.opacity = '';
      taca2Ref.current.style.transform = '';
    }

    /* loops continuam, só mudam de ritmo */
    if (ondaAnimRef.current) ondaAnimRef.current.playbackRate = receita.onda;
    if (respiraAnimRef.current) respiraAnimRef.current.playbackRate = receita.respira;

    /* poses por canal (partes ausentes voltam ao neutro) */
    const els: Record<Parte, SVGElement | null> = {
      postura: posturaRef.current,
      bracoE: bracoERef.current,
      bracoD: bracoDRef.current,
      sobranE: sobranERef.current,
      sobranD: sobranDRef.current,
      vinhoNivel: vinhoNivelRef.current,
      arregalaE: arregalaERef.current,
      arregalaD: arregalaDRef.current,
      pupilaEstE: pupilaEstERef.current,
      pupilaEstD: pupilaEstDRef.current,
    };
    for (const parte of PARTES) {
      springTo(parte, els[parte], receita.poses[parte] ?? {}, receita.mola);
    }

    if (reduzMotionRef.current) {
      if (alvo === 'celebra') brindar();
      return;
    }

    switch (alvo) {
      case 'feliz':
        pular();
        slosh(9, 120);
        faiscar(faiscaRef.current, 180);
        break;
      case 'lamenta':
        slosh(-3.5, 150);
        break;
      case 'ensina':
        slosh(4, 100);
        break;
      case 'celebra':
        pular();
        slosh(12, 100);
        brindar();
        transbordar();
        break;
      case 'surpreso':
        recuar();
        tremerVinho();
        break;
      case 'idle':
        break;
    }
  };

  /* ---- loops de vida (respiração + onda do vinho) ---- */
  useEffect(() => {
    if (reduzMotionRef.current) return;
    const respira = respiraRef.current;
    const onda = ondaRef.current;
    if (respira) {
      respiraAnimRef.current = respira.animate(
        [{ transform: 'scale(1, 1)' }, { transform: 'scale(0.997, 1.018)' }],
        { duration: 2600, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' },
      );
    }
    if (onda) {
      ondaAnimRef.current = onda.animate(
        [{ transform: 'translateX(0px)' }, { transform: 'translateX(-36px)' }],
        { duration: 2800, iterations: Infinity, easing: 'linear' },
      );
    }
    return () => {
      respiraAnimRef.current?.cancel();
      ondaAnimRef.current?.cancel();
      respiraAnimRef.current = null;
      ondaAnimRef.current = null;
    };
  }, []);

  /* ---- piscada com jitter (3 a 5s), às vezes dupla ---- */
  useEffect(() => {
    if (reduzMotionRef.current) return;
    let timer = 0;
    let vivo = true;
    const piscar = () => {
      for (const ref of [olhoPiscaERef, olhoPiscaDRef]) {
        const el = ref.current;
        if (!el) continue;
        dispararOneShot(
          el.animate(
            [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.08)' }, { transform: 'scaleY(1)' }],
            { duration: 140, easing: 'ease-in-out' },
          ),
        );
      }
    };
    const agendar = (primeira: boolean) => {
      const espera =
        primeira && typeof primeiraPiscadaMs === 'number'
          ? primeiraPiscadaMs
          : 3000 + Math.random() * 2000;
      timer = window.setTimeout(() => {
        if (!vivo) return;
        if (estadoRef.current !== 'surpreso') {
          piscar();
          if (Math.random() < 0.18) window.setTimeout(piscar, 220);
        }
        agendar(false);
      }, espera);
    };
    agendar(true);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- estado ---- */
  useEffect(() => {
    aplicarEstado(estado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  /* ---- desmontagem: cancela tudo ---- */
  useEffect(() => {
    const canais = canaisRef.current;
    return () => {
      oneShotsRef.current.forEach((a) => a.cancel());
      canais.forEach((a) => a.cancel());
      clearTimeout(timerOlharRef.current);
    };
  }, []);

  /* ---- olhar: segue alvo ou toque recente (limite 2,5px) ---- */
  const olharPara = (px: number, py: number, voltar: boolean) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.27;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const alcance = Math.min(2.5, dist * 0.06);
    const off: Pose = { x: (dx / dist) * alcance, y: (dy / dist) * alcance };
    springTo('segueE', segueERef.current, off, MOLA_RAPIDA);
    springTo('segueD', segueDRef.current, off, MOLA_RAPIDA);
    clearTimeout(timerOlharRef.current);
    if (voltar) {
      timerOlharRef.current = window.setTimeout(() => {
        springTo('segueE', segueERef.current, {}, MOLA_GENTIL);
        springTo('segueD', segueDRef.current, {}, MOLA_GENTIL);
      }, 2400);
    }
  };

  useEffect(() => {
    if (typeof alvoX === 'number' && typeof alvoY === 'number') {
      olharPara(alvoX, alvoY, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvoX, alvoY]);

  useEffect(() => {
    if (!segueToque) return;
    const aoTocar = (e: PointerEvent) => {
      if (typeof alvoX === 'number' && typeof alvoY === 'number') return;
      olharPara(e.clientX, e.clientY, true);
    };
    window.addEventListener('pointerdown', aoTocar, { passive: true });
    return () => window.removeEventListener('pointerdown', aoTocar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segueToque, alvoX, alvoY]);

  /* ------------------------------------------------------------------ */

  return (
    <svg
      ref={svgRef}
      className={className ? `tchin ${className}` : 'tchin'}
      width={tamanho}
      height={Math.round(tamanho * (VB_A / VB_L))}
      viewBox={`0 0 ${VB_L} ${VB_A}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': true })}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BOJO} />
        </clipPath>
      </defs>

      <g ref={puloRef} style={ORIGEM_BASE}>
        <g ref={posturaRef} style={ORIGEM_BASE}>
          <g ref={respiraRef} style={ORIGEM_BASE}>
            {/* corpo: haste e base */}
            <line
              x1="66"
              y1="75"
              x2="66"
              y2="112"
              stroke="var(--wine-900)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M46 119 Q66 111.5 86 119"
              stroke="var(--wine-900)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* bracinhos finos */}
            <g ref={bracoERef} style={origem(43, 62)}>
              <path
                d="M43 62 Q34 70 32 80"
                stroke="var(--wine-900)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="32" cy="80" r="2.7" fill="var(--wine-900)" />
            </g>
            <g ref={bracoDRef} style={origem(89, 62)}>
              <path
                d="M89 62 Q98 70 100 80"
                stroke="var(--wine-900)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="80" r="2.7" fill="var(--wine-900)" />
            </g>

            {/* bojo = cabeça (vidro com leve tinta de vinho) */}
            <path d={BOJO} fill="rgba(74, 31, 36, 0.05)" />

            {/* vinho vivo, recortado pelo bojo */}
            <g clipPath={`url(#${clipId})`}>
              <g ref={vinhoNivelRef}>
                <g ref={vinhoSloshRef} style={origem(66, 55)}>
                  <path ref={ondaRef} d={ONDA} fill="var(--wine-700)" />
                </g>
              </g>
              {/* brilho do vidro */}
              <path
                d="M46 30 C45 40 47 48 52 53"
                stroke="rgba(250, 250, 248, 0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
            <path d={BOJO} stroke="var(--wine-900)" strokeWidth="3" strokeLinejoin="round" />

            {/* olhos redondos amigáveis com brilho */}
            <g ref={olhoPiscaERef} style={origem(55, 38)}>
              <g ref={arregalaERef} style={origem(55, 38)}>
                <circle cx="55" cy="38" r="6" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2" />
                <g ref={pupilaEstERef}>
                  <g ref={segueERef}>
                    <circle cx="55" cy="38" r="3" fill="var(--wine-900)" />
                    <circle cx="56.2" cy="36.8" r="1.1" fill="var(--bg)" />
                  </g>
                </g>
              </g>
            </g>
            <g ref={olhoPiscaDRef} style={origem(77, 38)}>
              <g ref={arregalaDRef} style={origem(77, 38)}>
                <circle cx="77" cy="38" r="6" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2" />
                <g ref={pupilaEstDRef}>
                  <g ref={segueDRef}>
                    <circle cx="77" cy="38" r="3" fill="var(--wine-900)" />
                    <circle cx="78.2" cy="36.8" r="1.1" fill="var(--bg)" />
                  </g>
                </g>
              </g>
            </g>

            {/* sobrancelhas expressivas */}
            <path
              ref={sobranERef}
              d="M48 30 Q55 26.5 62 30"
              stroke="var(--wine-900)"
              strokeWidth="3"
              strokeLinecap="round"
              style={origem(55, 28.5)}
            />
            <path
              ref={sobranDRef}
              d="M70 30 Q77 26.5 84 30"
              stroke="var(--wine-900)"
              strokeWidth="3"
              strokeLinecap="round"
              style={origem(77, 28.5)}
            />
          </g>
        </g>
      </g>

      {/* faísca dourada (feliz) */}
      <g ref={faiscaRef} opacity="0" style={origem(102, 16)}>
        <path
          d="M102 8.5 L103.9 14.1 L109.5 16 L103.9 17.9 L102 23.5 L100.1 17.9 L94.5 16 L100.1 14.1 Z"
          fill="var(--gold-500)"
        />
      </g>

      {/* gotas douradas do transbordo (celebra) */}
      <g ref={gotasRef}>
        <circle cx="48" cy="16" r="2.2" fill="var(--gold-500)" opacity="0" />
        <circle cx="66" cy="11" r="2.5" fill="var(--gold-500)" opacity="0" />
        <circle cx="84" cy="16" r="2.2" fill="var(--gold-500)" opacity="0" />
      </g>

      {/* faísca do brinde (encontro das taças) */}
      <g ref={brindeRef} opacity="0" style={origem(98, 21)}>
        <path
          d="M98 14.5 L99.6 19.4 L104.5 21 L99.6 22.6 L98 27.5 L96.4 22.6 L91.5 21 L96.4 19.4 Z"
          fill="var(--gold-500)"
        />
        <circle cx="92" cy="14" r="1.2" fill="var(--gold-500)" />
        <circle cx="105" cy="27" r="1.2" fill="var(--gold-500)" />
      </g>

      {/* segunda taça que entra em cena no brinde (celebra) */}
      <g ref={taca2Ref} opacity="0" style={origem(114, 72)}>
        <path d="M103 27 C103 40 107 48 114 50.5 C121 48 125 40 125 27 Z" fill="rgba(74, 31, 36, 0.05)" />
        <path
          d="M105.5 34 C106.5 42.5 109.5 47.3 114 49 C118.5 47.3 121.5 42.5 122.5 34 Q114 38.5 105.5 34 Z"
          fill="var(--wine-700)"
        />
        <path
          d="M103 27 C103 40 107 48 114 50.5 C121 48 125 40 125 27 Z"
          stroke="var(--wine-900)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <line x1="114" y1="50.5" x2="114" y2="68" stroke="var(--wine-900)" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M106 72 Q114 68.5 122 72" stroke="var(--wine-900)" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
