/**
 * Coreografias de marco (BRIEF-DESIGN.md secao 7, item 4):
 * cada marco tem movimento PROPRIO, com fisica de mola via WAAPI,
 * interrompivel, so transform/opacity. Dia a dia segue discreto.
 *
 * - ChamaStreak:   a chama do streak ACENDE com 6 particulas ao ganhar o dia
 * - Odometro:      XP rola em odometro (digitos em fita vertical)
 * - ConfeteFisica: fisica simples em canvas (gravidade + rotacao, 1.2s, 40 pecas)
 * - BauRecompensa: bau balanca e abre com pop, revelando o cristal
 * - TchinObservador: mascote pequeno em idle no rodape (vazio vertical)
 */

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Ic } from '../icones/Icones';
import { Tchin } from '../mascote';
import './coreografia.css';

function reduzMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ------------------- Chama do streak que acende ----------------------- */

interface ChamaStreakProps {
  /** True quando ESTE momento ganhou o dia: a chama acende com particulas. */
  acende: boolean;
  size?: number;
  label?: string;
}

export function ChamaStreak({ acende, size = 20, label }: ChamaStreakProps) {
  const [acesa, setAcesa] = useState(!acende || reduzMotion());
  useEffect(() => {
    if (!acende || acesa) return;
    const t = window.setTimeout(() => setAcesa(true), 300);
    return () => window.clearTimeout(t);
  }, [acende, acesa]);

  if (!acende) return <Ic nome="chama-streak" size={size} label={label} />;

  return (
    <span className="chama-coreo" style={{ width: size, height: size }}>
      <span className={acesa ? 'chama-glifo chama-acende' : 'chama-glifo'}>
        <Ic nome={acesa ? 'chama-streak' : 'chama-apagada'} size={size} label={label} />
      </span>
      {acesa && (
        <span className="chama-particulas" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`chama-particula chama-particula-${i}`} />
          ))}
        </span>
      )}
    </span>
  );
}

/* ----------------------- Odometro de XP ------------------------------- */

interface ColunaProps {
  /** Quantos digitos a fita percorre (inclui voltas completas). */
  passos: number;
  duracaoMs: number;
}

function ColunaOdometro({ passos, duracaoMs }: ColunaProps) {
  const fita = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = fita.current;
    if (!el) return;
    if (reduzMotion() || passos === 0) {
      el.style.transform = `translateY(${-passos}em)`;
      return;
    }
    const anim = el.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${-passos}em)` }],
      { duration: duracaoMs, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
    );
    return () => anim.cancel();
  }, [passos, duracaoMs]);

  return (
    <span className="odometro-coluna">
      <span ref={fita} className="odometro-fita">
        {Array.from({ length: passos + 1 }, (_, k) => (
          <span key={k} className="odometro-digito">
            {k % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

interface OdometroProps {
  valor: number;
  duracaoMs?: number;
  className?: string;
}

/**
 * Numero que rola como odometro: cada coluna e uma fita vertical de
 * digitos; as unidades dao voltas completas (ate 2) enquanto as dezenas
 * sobem devagar. Herda fonte e cor do pai (JetBrains Mono nos placares).
 */
export function Odometro({ valor, duracaoMs = 1000, className }: OdometroProps) {
  const alvo = Math.max(0, Math.floor(valor));
  const digitos = String(alvo).split('').map(Number);
  const n = digitos.length;
  return (
    <span
      className={className ? `odometro ${className}` : 'odometro'}
      role="img"
      aria-label={String(alvo)}
    >
      {digitos.map((d, i) => {
        const posicao = n - 1 - i; /* 0 = unidades */
        const voltas = Math.min(2, Math.floor(alvo / Math.pow(10, posicao + 1)));
        return <ColunaOdometro key={posicao} passos={voltas * 10 + d} duracaoMs={duracaoMs} />;
      })}
    </span>
  );
}

/* ------------------ Confete com fisica (canvas) ----------------------- */

const CORES_CONFETE = ['#722F37', '#D4A574', '#D98E32', '#2E5734', '#B8894A'];

interface ConfeteProps {
  duracaoMs?: number;
  maxPecas?: number;
}

/**
 * Confete de licao perfeita: fisica simples em canvas (gravidade +
 * rotacao), 1.2s, max 40 particulas. Para sozinho e limpa o canvas.
 */
export function ConfeteFisica({ duracaoMs = 1200, maxPecas = 40 }: ConfeteProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reduzMotion()) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx2d.scale(dpr, dpr);

    const pecas = Array.from({ length: Math.min(40, maxPecas) }, (_, i) => ({
      x: Math.random() * w,
      y: -12 - Math.random() * 48,
      vx: (Math.random() - 0.5) * 130,
      vy: 50 + Math.random() * 130,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 11,
      cor: CORES_CONFETE[i % CORES_CONFETE.length],
      larg: 5 + Math.random() * 4,
      alt: 8 + Math.random() * 6,
    }));

    const G = 880; /* px/s2 */
    let raf = 0;
    let t0 = -1;
    let tPrev = 0;

    const passo = (t: number) => {
      if (t0 < 0) {
        t0 = t;
        tPrev = t;
      }
      const dt = Math.min(0.032, (t - tPrev) / 1000);
      tPrev = t;
      const idade = t - t0;
      ctx2d.clearRect(0, 0, w, h);
      const alpha = idade > duracaoMs - 240 ? Math.max(0, (duracaoMs - idade) / 240) : 1;
      for (const p of pecas) {
        p.vy += G * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx2d.save();
        ctx2d.translate(p.x, p.y);
        ctx2d.rotate(p.rot);
        ctx2d.globalAlpha = alpha;
        ctx2d.fillStyle = p.cor;
        ctx2d.fillRect(-p.larg / 2, -p.alt / 2, p.larg, p.alt);
        ctx2d.restore();
      }
      if (idade < duracaoMs) {
        raf = requestAnimationFrame(passo);
      } else {
        ctx2d.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [duracaoMs, maxPecas]);

  return <canvas ref={ref} className="confete-canvas" aria-hidden="true" />;
}

/* --------------------- Bau que abre com pop ---------------------------- */

interface BauProps {
  /** Ms ate abrir (antes disso o bau balanca, criando antecipacao). */
  abreEmMs?: number;
  size?: number;
  /** Chamado no instante do pop (bom para tocar o som de moeda). */
  aoAbrir?: () => void;
}

export function BauRecompensa({ abreEmMs = 700, size = 56, aoAbrir }: BauProps) {
  const [aberto, setAberto] = useState(reduzMotion());
  const abriu = useRef(false);
  useEffect(() => {
    if (aberto) return;
    const t = window.setTimeout(() => {
      setAberto(true);
      if (!abriu.current) {
        abriu.current = true;
        aoAbrir?.();
      }
    }, abreEmMs);
    return () => window.clearTimeout(t);
  }, [abreEmMs, aberto, aoAbrir]);

  return (
    <span className="bau-coreo" style={{ width: size, height: size }} aria-hidden="true">
      {!aberto ? (
        <span className="bau-fechado">
          <Ic nome="presente-bau" size={size} />
        </span>
      ) : (
        <>
          <span className="bau-pop">
            <Ic nome="cristal" size={size} className="bau-cristal" />
          </span>
          <span className="bau-faiscas">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`bau-faisca bau-faisca-${i}`} />
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/* --------------- Mascote observador (vazio vertical) ------------------ */

interface ObservadorProps {
  /** So aparece enquanto a pessoa responde (sai durante o reveal). */
  visivel: boolean;
  tamanho?: number;
  estilo?: CSSProperties;
}

/**
 * Tchin pequeno em idle no rodape da tela de exercicio: respira, pisca
 * e segue o toque. Fica ATRAS do conteudo (z-index negativo) e nunca
 * captura toques: presenca sem atrapalhar o polegar.
 */
export function TchinObservador({ visivel, tamanho = 54, estilo }: ObservadorProps) {
  if (!visivel) return null;
  return (
    <div className="tchin-observa" style={estilo} aria-hidden="true">
      <Tchin estado="idle" tamanho={tamanho} />
    </div>
  );
}
