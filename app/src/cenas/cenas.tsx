/**
 * As 7 CENAS por habilidade. SVG proprietario, traco grosso arredondado,
 * duotone vinho/dourado (mesma shape language de PropsCena.tsx). viewBox
 * 120x88: largo e baixo, para deitar no vazio entre pergunta e opcoes sem
 * roubar a altura do polegar.
 *
 * Cada cena: IDLE sutil em loop (vapor sobe, limao respira, balanca
 * embala...) + REACAO de uma vez ao toque (vapor jorra, limao se espreme
 * com gotas, balanca pende e volta na mola, acucar dissolve, cacho
 * balanca, rotulo descola, taca tine). So transform/opacity. O toque e
 * brincadeira: nunca muda resposta nem trava o fluxo.
 *
 * Motor (idle + reacao + vibracao + reduz-motion) vem de ./motor.
 */

import type { Habilidade } from '../engine';
import {
  molaKeyframes,
  parte,
  partes,
  useCenaInterativa,
  type ConfigCena,
} from './motor';
import { MOLA_GENTIL, MOLA_PADRAO, MOLA_SALTITANTE, MOLA_SLOSH } from '../mascote/springs';

interface CenaProps {
  className?: string;
}

const VB = '0 0 120 88';

const LOOP: KeyframeAnimationOptions = { iterations: Infinity, easing: 'ease-in-out' };
const VAIVEM: KeyframeAnimationOptions = { ...LOOP, direction: 'alternate' };

/** Casca comum: <svg> tocavel com o rig dentro. */
function Cena({
  config,
  className,
  children,
}: {
  config: ConfigCena;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, aoTocar } = useCenaInterativa(config);
  return (
    <svg
      ref={ref}
      className={className ? `cena-svg ${className}` : 'cena-svg'}
      viewBox={VB}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      onPointerDown={aoTocar}
    >
      {children}
    </svg>
  );
}

/* ====================================================================== */
/* TANINO: xicara de cha fumegante (a referencia didatica do tanino)      */
/* Idle: tres fios de vapor sobem em loop. Toque: vapor jorra forte e a   */
/* xicara da um gole-tremor de mola.                                      */
/* ====================================================================== */

const cfgTanino: ConfigCena = {
  idle: (svg) =>
    partes(svg, 'vapor').map((el, i) =>
      el.animate(
        [
          { transform: 'translateY(2px) scaleY(0.9)', opacity: 0.15 },
          { transform: 'translateY(-9px) scaleY(1.15)', opacity: 0.5, offset: 0.5 },
          { transform: 'translateY(-18px) scaleY(0.9)', opacity: 0 },
        ],
        { duration: 2600, delay: i * 520, iterations: Infinity, easing: 'ease-out' },
      ),
    ),
  reagir: (svg) => {
    const anims: Animation[] = [];
    partes(svg, 'vapor').forEach((el, i) => {
      anims.push(
        el.animate(
          [
            { transform: 'translateY(2px) scaleY(0.8)', opacity: 0.6 },
            { transform: 'translateY(-26px) scaleY(1.4)', opacity: 0.7, offset: 0.4 },
            { transform: 'translateY(-44px) scaleY(0.8)', opacity: 0 },
          ],
          { duration: 900, delay: i * 90, easing: 'ease-out' },
        ),
      );
    });
    const xicara = parte(svg, 'xicara');
    if (xicara) {
      const { kfs, duracao } = molaKeyframes(7, 0, MOLA_SLOSH, (v) => ({
        transform: `rotate(${v}deg)`,
      }));
      anims.push(xicara.animate(kfs, { duration: duracao, easing: 'linear' }));
    }
    return anims;
  },
};

function CenaTanino({ className }: CenaProps) {
  return (
    <Cena config={cfgTanino} className={className}>
      {/* vapor (atras da xicara) */}
      <g stroke="var(--neutral-400)" strokeWidth="3" strokeLinecap="round" opacity="0.5">
        <path data-parte="vapor-0" d="M50 30 q-5 -5 0 -10 q5 -5 0 -11" style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }} />
        <path data-parte="vapor-1" d="M62 28 q-5 -5 0 -10 q5 -5 0 -11" style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }} />
        <path data-parte="vapor-2" d="M74 30 q-5 -5 0 -10 q5 -5 0 -11" style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }} />
      </g>
      {/* xicara */}
      <g data-parte="xicara" style={{ transformBox: 'view-box', transformOrigin: '62px 70px' }}>
        <path
          d="M40 40 h44 v10 c0 13 -10 20 -22 20 s-22 -7 -22 -20 Z"
          fill="var(--bg)"
          stroke="var(--wine-900)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M45 44 h34 v5 c0 4 -2 8 -5.5 10.5 h-23 c-3.5 -2.5 -5.5 -6.5 -5.5 -10.5 Z" fill="var(--gold-700)" />
        <path
          d="M84 46 c7 0 10 3.5 10 8 c0 5.5 -5.5 9 -12 8"
          stroke="var(--wine-900)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M36 74 h52" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        {/* etiqueta do saquinho de cha pendurada: deixa claro que e cha (a referencia do tanino) */}
        <path d="M70 41 q3 8 4 15" fill="none" stroke="var(--wine-900)" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="69.5" y="56" width="9" height="9" rx="1.6" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="1.8" />
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* ACIDEZ: limao em meia fatia. Idle: respira leve. Toque: se espreme     */
/* (achata) e tres gotas saltam.                                          */
/* ====================================================================== */

const cfgAcidez: ConfigCena = {
  idle: (svg) => {
    const el = parte(svg, 'limao');
    if (!el) return [];
    return [
      el.animate(
        [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.015, 0.985)' }],
        { duration: 2400, ...VAIVEM },
      ),
    ];
  },
  reagir: (svg) => {
    const anims: Animation[] = [];
    const limao = parte(svg, 'limao');
    if (limao) {
      anims.push(
        limao.animate(
          [
            { transform: 'scale(1, 1)' },
            { transform: 'scale(1.16, 0.74)', offset: 0.3, easing: 'ease-out' },
            { transform: 'scale(0.94, 1.08)', offset: 0.62, easing: 'ease-in-out' },
            { transform: 'scale(1, 1)' },
          ],
          { duration: 620 },
        ),
      );
    }
    partes(svg, 'gota').forEach((g, i) => {
      const dx = [-13, 2, 14][i % 3];
      anims.push(
        g.animate(
          [
            { transform: 'translate(0,0) scale(0.4)', opacity: 0, easing: 'ease-out' },
            { transform: `translate(${dx * 0.6}px, -12px) scale(1)`, opacity: 1, offset: 0.4, easing: 'ease-in' },
            { transform: `translate(${dx}px, 30px) scale(0.8)`, opacity: 0 },
          ],
          { duration: 820, delay: 120 + i * 70 },
        ),
      );
    });
    return anims;
  },
};

function CenaAcidez({ className }: CenaProps) {
  return (
    <Cena config={cfgAcidez} className={className}>
      {/* gotas (atras, brotam da fatia) */}
      <g fill="var(--gold-700)">
        <circle data-parte="gota-0" cx="50" cy="56" r="2.6" opacity="0" />
        <circle data-parte="gota-1" cx="60" cy="58" r="3" opacity="0" />
        <circle data-parte="gota-2" cx="70" cy="56" r="2.6" opacity="0" />
      </g>
      <g data-parte="limao" style={{ transformBox: 'view-box', transformOrigin: '60px 44px' }}>
        {/* casca verde do limao (no Brasil limao e verde) */}
        <circle cx="60" cy="44" r="20" fill="var(--ok-700)" stroke="var(--wine-900)" strokeWidth="3" />
        {/* polpa clara */}
        <circle cx="60" cy="44" r="14" fill="var(--ok-100)" />
        {/* gomos */}
        <g stroke="var(--ok-700)" strokeWidth="2.4" strokeLinecap="round">
          <line x1="60" y1="32" x2="60" y2="56" />
          <line x1="50" y1="38" x2="70" y2="50" />
          <line x1="50" y1="50" x2="70" y2="38" />
        </g>
        <circle cx="60" cy="44" r="2.2" fill="var(--ok-700)" />
        {/* folha */}
        <path
          d="M67 20 q7 -8 15 -5 q-2 8 -12 9 Z"
          fill="var(--ok-700)"
          stroke="var(--wine-900)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* CORPO: balanca agua x creme (leve vs encorpado). Idle: embala de leve. */
/* Toque: pende para o creme (mais pesado) e volta na mola.               */
/* ====================================================================== */

const cfgCorpo: ConfigCena = {
  idle: (svg) => {
    const el = parte(svg, 'braco');
    if (!el) return [];
    return [
      el.animate(
        [{ transform: 'rotate(2deg)' }, { transform: 'rotate(5.5deg)' }],
        { duration: 3000, ...VAIVEM },
      ),
    ];
  },
  reagir: (svg) => {
    const braco = parte(svg, 'braco');
    if (!braco) return [];
    const { kfs, duracao } = molaKeyframes(13, 3.5, MOLA_GENTIL, (v) => ({
      transform: `rotate(${v}deg)`,
    }));
    return [braco.animate(kfs, { duration: duracao, easing: 'linear' })];
  },
};

function CenaCorpo({ className }: CenaProps) {
  return (
    <Cena config={cfgCorpo} className={className}>
      {/* coluna central da balanca */}
      <line x1="60" y1="22" x2="60" y2="76" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 76 h24" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
      {/* braco que pende, com os dois pratos */}
      <g data-parte="braco" style={{ transformBox: 'view-box', transformOrigin: '60px 24px' }}>
        <line x1="30" y1="24" x2="90" y2="24" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
        {/* prato esquerdo: agua (leve) */}
        <g>
          <line x1="30" y1="24" x2="30" y2="38" stroke="var(--wine-900)" strokeWidth="2.2" />
          <path d="M19 38 h22 l-4 9 a7 7 0 0 1 -14 0 Z" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M22 40 q8 3 16 0 v3 a6 6 0 0 1 -16 0 Z" fill="var(--gold-500)" opacity="0.55" />
        </g>
        {/* prato direito: creme (encorpado) */}
        <g>
          <line x1="90" y1="24" x2="90" y2="38" stroke="var(--wine-900)" strokeWidth="2.2" />
          <path d="M79 38 h22 l-4 9 a7 7 0 0 1 -14 0 Z" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M82 40 q8 3 16 0 v3 a6 6 0 0 1 -16 0 Z" fill="var(--wine-700)" />
        </g>
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* DOCURA: pote de mel (no Brasil le mais doce que cubo de acucar). Idle:  */
/* a gota na ponta do pegador incha de leve. Toque: a gota escorre e cai,  */
/* o pegador da um giro de "mexer" e tres bolhinhas doces sobem do pote.   */
/* ====================================================================== */

const cfgDocura: ConfigCena = {
  idle: (svg) => {
    const gota = parte(svg, 'gota');
    if (!gota) return [];
    return [
      gota.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.16)' }],
        { duration: 1600, ...VAIVEM },
      ),
    ];
  },
  reagir: (svg) => {
    const anims: Animation[] = [];
    const gota = parte(svg, 'gota');
    if (gota) {
      anims.push(
        gota.animate(
          [
            { transform: 'translateY(0) scale(1)', opacity: 1, easing: 'ease-in' },
            { transform: 'translateY(7px) scale(1.15)', opacity: 1, offset: 0.45 },
            { transform: 'translateY(22px) scale(0.6)', opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.99 },
            { transform: 'translateY(0) scale(1)', opacity: 1 },
          ],
          { duration: 1300, easing: 'ease-out' },
        ),
      );
    }
    const pegador = parte(svg, 'pegador');
    if (pegador) {
      const { kfs, duracao } = molaKeyframes(7, 0, MOLA_GENTIL, (v) => ({
        transform: `rotate(${v}deg)`,
      }));
      anims.push(pegador.animate(kfs, { duration: duracao, easing: 'linear' }));
    }
    partes(svg, 'bolha').forEach((b, i) => {
      const dx = [-9, 5, 10][i % 3];
      anims.push(
        b.animate(
          [
            { transform: 'translate(0,4px) scale(0.3)', opacity: 0 },
            { transform: `translate(${dx * 0.5}px,-8px) scale(1)`, opacity: 0.85, offset: 0.45, easing: 'ease-out' },
            { transform: `translate(${dx}px,-22px) scale(0.6)`, opacity: 0 },
          ],
          { duration: 1000, delay: 240 + i * 90, easing: 'ease-out' },
        ),
      );
    });
    return anims;
  },
};

function CenaDocura({ className }: CenaProps) {
  return (
    <Cena config={cfgDocura} className={className}>
      <defs>
        <clipPath id="cena-pote-clip">
          <path d="M40 40 Q40 35 45 35 L75 35 Q80 35 80 40 L80 66 Q80 76 70 76 L50 76 Q40 76 40 66 Z" />
        </clipPath>
      </defs>
      {/* corpo do pote */}
      <path
        d="M40 40 Q40 35 45 35 L75 35 Q80 35 80 40 L80 66 Q80 76 70 76 L50 76 Q40 76 40 66 Z"
        fill="var(--gold-500)"
        stroke="var(--wine-900)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* mel dentro (nivel mais escuro) + linha do nivel */}
      <g clipPath="url(#cena-pote-clip)">
        <path d="M40 52 Q52 48 60 52 Q70 57 80 52 L80 76 L40 76 Z" fill="var(--gold-700)" />
        <path d="M40 52 Q52 48 60 52 Q70 57 80 52" fill="none" stroke="var(--wine-900)" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* rotulo claro */}
      <rect x="48" y="59" width="24" height="11" rx="3" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2.4" />
      <line x1="53" y1="64.5" x2="67" y2="64.5" stroke="var(--gold-700)" strokeWidth="2" strokeLinecap="round" />
      {/* tampa / colar do pote */}
      <path
        d="M36 35 Q36 30 41 30 L79 30 Q84 30 84 35 L84 37 Q84 39 82 39 L38 39 Q36 39 36 37 Z"
        fill="var(--wine-700)"
        stroke="var(--wine-900)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line x1="40" y1="34.5" x2="80" y2="34.5" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" />
      {/* pegador de mel apoiado na borda: gira de leve (idle e toque) */}
      <g data-parte="pegador" style={{ transformBox: 'view-box', transformOrigin: '67px 44px' }}>
        <line x1="86" y1="14" x2="70" y2="40" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="87" cy="13" r="3.4" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.4" />
        <ellipse cx="67" cy="44" rx="6.5" ry="8.5" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="3" transform="rotate(-32 67 44)" />
        <g stroke="var(--wine-900)" strokeWidth="1.8" strokeLinecap="round">
          <line x1="63.5" y1="41" x2="70" y2="44" />
          <line x1="62.5" y1="45" x2="69.5" y2="48" />
          <line x1="62.5" y1="49" x2="68.5" y2="51.5" />
        </g>
      </g>
      {/* fio + gota de mel na ponta do pegador (incha no idle, cai no toque) */}
      <path d="M68.5 49.5 Q69.2 51.5 70 53" fill="none" stroke="var(--gold-700)" strokeWidth="2" strokeLinecap="round" />
      <circle
        data-parte="gota"
        cx="70"
        cy="54.5"
        r="2.7"
        fill="var(--gold-700)"
        stroke="var(--wine-900)"
        strokeWidth="1.6"
        style={{ transformBox: 'view-box', transformOrigin: '70px 52px' }}
      />
      {/* bolhinhas doces que sobem do pote no toque */}
      <g fill="var(--gold-500)">
        <circle data-parte="bolha-0" cx="52" cy="34" r="2.2" opacity="0" />
        <circle data-parte="bolha-1" cx="60" cy="32" r="2.6" opacity="0" />
        <circle data-parte="bolha-2" cx="68" cy="34" r="2.2" opacity="0" />
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* FRUTADO: cacho de frutas (uvas). Idle: balanca pendurado pelo galho.   */
/* Toque: balanca mais forte e a uva de baixo cai e volta na mola.        */
/* ====================================================================== */

const cfgFrutado: ConfigCena = {
  idle: (svg) => {
    const el = parte(svg, 'cacho');
    if (!el) return [];
    return [
      el.animate(
        [{ transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }],
        { duration: 2800, ...VAIVEM },
      ),
    ];
  },
  reagir: (svg) => {
    const anims: Animation[] = [];
    const cacho = parte(svg, 'cacho');
    if (cacho) {
      const { kfs, duracao } = molaKeyframes(10, 0, MOLA_SALTITANTE, (v) => ({
        transform: `rotate(${v}deg)`,
      }));
      anims.push(cacho.animate(kfs, { duration: duracao, easing: 'linear' }));
    }
    const pingo = parte(svg, 'pingo');
    if (pingo) {
      anims.push(
        pingo.animate(
          [
            { transform: 'translateY(0) scale(1)', opacity: 1, easing: 'ease-in' },
            { transform: 'translateY(20px) scale(0.95)', opacity: 1, offset: 0.45 },
            { transform: 'translateY(34px) scale(0.6)', opacity: 0 },
            { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.99 },
            { transform: 'translateY(0) scale(1)', opacity: 1 },
          ],
          { duration: 1100, easing: 'ease-out' },
        ),
      );
    }
    return anims;
  },
};

function CenaFrutado({ className }: CenaProps) {
  return (
    <Cena config={cfgFrutado} className={className}>
      {/* galho preso no topo */}
      <path d="M60 14 q1 -5 7 -7" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
      <path d="M67 7 q8 -2 13 4 q-6 5 -13 1 Z" fill="var(--ok-700)" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinejoin="round" />
      {/* gavinha da vinha (curva pra ler como uva, nao cereja) */}
      <path d="M58 13 q-6 -1 -5 -6 q0.8 -4 4 -2.5" fill="none" stroke="var(--wine-900)" strokeWidth="2" strokeLinecap="round" />
      {/* cacho que balanca pelo galho */}
      <g data-parte="cacho" style={{ transformBox: 'view-box', transformOrigin: '60px 16px' }}>
        <path d="M60 16 v6" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
        <g fill="var(--wine-700)" stroke="var(--wine-900)" strokeWidth="2.4">
          <circle cx="52" cy="30" r="7" />
          <circle cx="68" cy="30" r="7" />
          <circle cx="60" cy="28" r="7" />
          <circle cx="47" cy="43" r="7" />
          <circle cx="73" cy="43" r="7" />
          <circle cx="60" cy="42" r="7" />
          <circle cx="53" cy="55" r="7" />
          <circle cx="67" cy="55" r="7" />
          {/* a uva de baixo cai no toque */}
          <circle data-parte="pingo" cx="60" cy="66" r="6.5" style={{ transformBox: 'view-box', transformOrigin: '60px 66px' }} />
        </g>
        <circle cx="57" cy="26" r="1.7" fill="var(--bg)" opacity="0.7" />
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* ROTULO: garrafa com etiqueta. Idle: brilho dourado desliza pela        */
/* etiqueta. Toque: a etiqueta levanta uma pontinha e assenta na mola.    */
/* ====================================================================== */

const cfgRotulo: ConfigCena = {
  idle: (svg) => {
    const el = parte(svg, 'brilho');
    if (!el) return [];
    return [
      el.animate(
        [
          { transform: 'translateX(-10px)', opacity: 0 },
          { transform: 'translateX(0px)', opacity: 0.7, offset: 0.5 },
          { transform: 'translateX(10px)', opacity: 0 },
        ],
        { duration: 3200, iterations: Infinity, easing: 'ease-in-out' },
      ),
    ];
  },
  reagir: (svg) => {
    const etiqueta = parte(svg, 'etiqueta');
    if (!etiqueta) return [];
    const { kfs, duracao } = molaKeyframes(-9, 0, MOLA_PADRAO, (v) => ({
      transform: `rotate(${v}deg)`,
    }));
    return [etiqueta.animate(kfs, { duration: duracao, easing: 'linear' })];
  },
};

function CenaRotulo({ className }: CenaProps) {
  return (
    <Cena config={cfgRotulo} className={className}>
      {/* garrafa de vinho: gargalo longo, ombro inclinado, corpo esguio */}
      <path
        d="M55 10 H65 V28 C65 32 74 34 74 44 V72 Q74 76 70 76 H50 Q46 76 46 72 V44 C46 34 55 32 55 28 Z"
        fill="var(--wine-700)"
        stroke="var(--wine-900)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* capsula no topo do gargalo */}
      <rect x="54" y="6" width="12" height="9" rx="2" fill="var(--wine-900)" />
      {/* etiqueta que descola uma pontinha */}
      <g data-parte="etiqueta" style={{ transformBox: 'view-box', transformOrigin: '49px 70px' }}>
        <rect x="49" y="50" width="22" height="20" rx="2.5" fill="var(--gold-500)" stroke="var(--wine-900)" strokeWidth="2.4" />
        <line x1="53" y1="56" x2="67" y2="56" stroke="var(--wine-900)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <line x1="53" y1="61" x2="63" y2="61" stroke="var(--wine-900)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="53" y1="65.5" x2="65" y2="65.5" stroke="var(--wine-900)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        {/* brilho que desliza pela etiqueta */}
        <rect data-parte="brilho" x="57" y="50" width="6" height="20" rx="2.5" fill="var(--bg)" opacity="0" />
      </g>
    </Cena>
  );
}

/* ====================================================================== */
/* HARMONIZACAO: garfo + taca (mesa). Idle: ambos sobem e descem de leve  */
/* em contratempo. Toque: o garfo encosta na taca e ela tine (faisca +    */
/* slosh do vinho dentro).                                                */
/* ====================================================================== */

const cfgHarmonizacao: ConfigCena = {
  idle: (svg) => {
    const anims: Animation[] = [];
    const garfo = parte(svg, 'garfo');
    const taca = parte(svg, 'taca');
    if (garfo) {
      anims.push(
        garfo.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-2.5px)' }],
          { duration: 2600, ...VAIVEM },
        ),
      );
    }
    if (taca) {
      anims.push(
        taca.animate(
          [{ transform: 'translateY(-2.5px)' }, { transform: 'translateY(0)' }],
          { duration: 2600, ...VAIVEM },
        ),
      );
    }
    return anims;
  },
  reagir: (svg) => {
    const anims: Animation[] = [];
    const garfo = parte(svg, 'garfo');
    if (garfo) {
      anims.push(
        garfo.animate(
          [
            { transform: 'translateX(0) rotate(0deg)' },
            { transform: 'translateX(7px) rotate(6deg)', offset: 0.3, easing: 'ease-out' },
            { transform: 'translateX(2px) rotate(2deg)', offset: 0.55, easing: 'ease-in-out' },
            { transform: 'translateX(0) rotate(0deg)' },
          ],
          { duration: 560 },
        ),
      );
    }
    const vinho = parte(svg, 'vinho');
    if (vinho) {
      const { kfs, duracao } = molaKeyframes(8, 0, MOLA_SLOSH, (v) => ({
        transform: `rotate(${v}deg)`,
      }));
      anims.push(vinho.animate(kfs, { duration: duracao, delay: 150, easing: 'linear' }));
    }
    const faisca = parte(svg, 'faisca');
    if (faisca) {
      anims.push(
        faisca.animate(
          [
            { transform: 'scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'scale(1.2) rotate(35deg)', opacity: 1, offset: 0.45 },
            { transform: 'scale(0.5) rotate(70deg)', opacity: 0 },
          ],
          { duration: 640, delay: 150, easing: 'ease-out' },
        ),
      );
    }
    return anims;
  },
};

function CenaHarmonizacaoCena({ className }: CenaProps) {
  return (
    <Cena config={cfgHarmonizacao} className={className}>
      {/* taca de vinho (direita) */}
      <g data-parte="taca">
        <path d="M64 28 c0 13 5 21 13 24 c8 -3 13 -11 13 -24 Z" fill="rgba(74, 31, 36, 0.06)" />
        <g data-parte="vinho" style={{ transformBox: 'view-box', transformOrigin: '77px 40px' }} clipPath="url(#cena-h-clip)">
          <path d="M66 33 c1 9 5 15 11 17 c6 -2 10 -8 11 -17 q-11 5 -22 0 Z" fill="var(--wine-700)" />
        </g>
        <path d="M64 28 c0 13 5 21 13 24 c8 -3 13 -11 13 -24 Z" stroke="var(--wine-900)" strokeWidth="3" strokeLinejoin="round" />
        <line x1="77" y1="52" x2="77" y2="70" stroke="var(--wine-900)" strokeWidth="3" strokeLinecap="round" />
        {/* pe chato (disco da base), em vez do arco que parecia sorriso */}
        <ellipse cx="77" cy="73" rx="11" ry="2.8" fill="var(--bg)" stroke="var(--wine-900)" strokeWidth="2.6" />
      </g>
      {/* garfo (esquerda) que encosta na taca */}
      <g data-parte="garfo" style={{ transformBox: 'view-box', transformOrigin: '40px 50px' }}>
        <line x1="40" y1="40" x2="40" y2="72" stroke="var(--wine-900)" strokeWidth="3.4" strokeLinecap="round" />
        <g stroke="var(--wine-900)" strokeWidth="2.8" strokeLinecap="round">
          <line x1="34" y1="20" x2="34" y2="36" />
          <line x1="40" y1="20" x2="40" y2="36" />
          <line x1="46" y1="20" x2="46" y2="36" />
        </g>
        <path d="M32 36 q8 6 16 0" stroke="var(--wine-900)" strokeWidth="2.8" strokeLinecap="round" />
      </g>
      {/* faisca do tinido (no encontro) */}
      <g data-parte="faisca" opacity="0" style={{ transformBox: 'view-box', transformOrigin: '60px 30px' }}>
        <path d="M60 23 l1.7 5 l5 1.7 l-5 1.7 l-1.7 5 l-1.7 -5 l-5 -1.7 l5 -1.7 Z" fill="var(--gold-500)" />
      </g>
      <defs>
        <clipPath id="cena-h-clip">
          <path d="M64 28 c0 13 5 21 13 24 c8 -3 13 -11 13 -24 Z" />
        </clipPath>
      </defs>
    </Cena>
  );
}

/* ---------------------------------------------------------------------- */

/** Registro: habilidade -> componente de cena. */
export const CENAS = {
  tanino: CenaTanino,
  acidez: CenaAcidez,
  corpo: CenaCorpo,
  docura: CenaDocura,
  frutado: CenaFrutado,
  rotulo: CenaRotulo,
  harmonizacao: CenaHarmonizacaoCena,
} as const satisfies Record<Habilidade, (p: CenaProps) => JSX.Element>;
