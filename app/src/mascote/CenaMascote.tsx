/**
 * Micro-cena do mascote: executa um roteiro declarativo de passos
 * { estado, fala (máx 8 palavras), prop de cena }.
 * É a base das micro-aulas da fase Features.
 *
 * RITMO (decisão jun/2026): avanço POR TOQUE, nunca autoplay entre passos.
 * Cada passo coreografa a própria entrada numa timeline GSAP com staging
 * (mascote muda de pose, prop entra por mola, fala revela palavra a
 * palavra a ~70ms) e então PAUSA, com affordance sutil após 1,2s.
 * Toque no meio da animação completa o passo na hora (progress(1));
 * toque com o passo completo transita para o próximo com OVERLAP:
 * o conteúdo atual sai enquanto o próximo já começa a entrar.
 * prefers-reduced-motion: passos estáticos, mesmo avanço por toque.
 *
 * gsap só pode existir no chunk lazy da MicroAula: este módulo é
 * tree-shaken para lá (não importar CenaMascote de código eager).
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Tchin, type EstadoTchin } from './Tchin';
import { PROPS_CENA, type PropCenaId } from './PropsCena';
import './mascote.css';

export interface PassoCena {
  estado: EstadoTchin;
  /** Fala curta do Tchin: máximo 8 palavras (regra do ruído). */
  fala?: string;
  /** Prop proprietário que entra em cena ao lado do mascote. */
  prop?: PropCenaId;
  /**
   * Ignorado desde o ritmo por toque (jun/2026): o passo espera o toque,
   * nunca avança sozinho. Mantido para os roteiros do laboratório.
   */
  duracaoMs?: number;
}

export interface CenaMascoteProps {
  roteiro: PassoCena[];
  /**
   * Chamado uma única vez, ao fim natural ou ao pular.
   * `completa` é true quando a cena foi assistida até o último passo
   * (toque a toque); pular antes do último passo completo não conta.
   */
  aoTerminar?: (completa: boolean) => void;
  rotuloPular?: string;
  className?: string;
}

/* Ritmo da entrada de cada passo (segundos) */
const SAIDA = 0.27; /* conteúdo do passo anterior sai em 250-300ms */
const OVERLAP = 0.15; /* a entrada começa ~150ms antes do fim da saída */
const VAGA_MASCOTE = 0.45; /* tempo da pose do Tchin assentar antes do prop */
const ENTRADA_PROP = 0.45;
const PALAVRA = 0.07; /* ~70ms por palavra, ritmo de leitura */
const RESPIRO = 0.6; /* respiro após a última palavra */
const ESPERA_AFFORDANCE = 1.2; /* "Toque para continuar" só depois da pausa */

export function CenaMascote({ roteiro, aoTerminar, rotuloPular = 'Pular', className }: CenaMascoteProps) {
  const [indice, setIndice] = useState(0);
  const [saindo, setSaindo] = useState<number | null>(null);
  const [tomada, setTomada] = useState(0); /* replay do passo: nova tomada */
  const [tchinKey, setTchinKey] = useState(0);
  const [hintVisivel, setHintVisivel] = useState(false);
  const [estadoTchin, setEstadoTchin] = useState<EstadoTchin>(
    () => roteiro[0]?.estado ?? 'idle',
  );

  const raizRef = useRef<HTMLDivElement>(null);
  const falaRef = useRef<HTMLParagraphElement>(null);
  const propRef = useRef<HTMLSpanElement>(null);
  const falaSaindoRef = useRef<HTMLParagraphElement>(null);
  const propSaindoRef = useRef<HTMLSpanElement>(null);

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const esperaHintRef = useRef<gsap.core.Tween | null>(null);
  const prontoRef = useRef(false);
  const terminouRef = useRef(false);
  const reduzMotionRef = useRef(
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const ultimo = roteiro.length - 1;
  const passo = roteiro[Math.min(indice, ultimo)];
  const passoSaindo = saindo !== null ? roteiro[saindo] : null;

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const p of roteiro) {
      if (p.fala && p.fala.trim().split(/\s+/).length > 8) {
        console.warn(`CenaMascote: fala com mais de 8 palavras: "${p.fala}"`);
      }
    }
  }, [roteiro]);

  /* Coreografia de entrada do passo: staging mascote -> prop -> fala,
     depois pausa esperando o toque. Reduced motion: tudo estático. */
  useLayoutEffect(() => {
    if (!passo) return;
    prontoRef.current = false;
    setHintVisivel(false);

    if (reduzMotionRef.current) {
      setEstadoTchin(passo.estado);
      setSaindo(null);
      prontoRef.current = true;
      setHintVisivel(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          prontoRef.current = true;
          esperaHintRef.current = gsap.delayedCall(ESPERA_AFFORDANCE, () => setHintVisivel(true));
        },
      });
      tlRef.current = tl;

      /* saída do passo anterior, em overlap com a entrada do novo */
      const alvosSaindo = [falaSaindoRef.current, propSaindoRef.current].filter(
        (el): el is HTMLElement => el !== null,
      );
      const temSaida = alvosSaindo.length > 0;
      if (temSaida) {
        tl.to(
          alvosSaindo,
          { autoAlpha: 0, y: -10, scale: 0.94, duration: SAIDA, ease: 'power1.in' },
          0,
        );
        tl.call(() => setSaindo(null), [], SAIDA);
      }

      /* staging: UMA coisa entra por vez */
      const inicio = temSaida ? SAIDA - OVERLAP : 0;
      tl.call(() => setEstadoTchin(passo.estado), [], inicio);
      let cursor = inicio + VAGA_MASCOTE;

      if (propRef.current) {
        tl.fromTo(
          propRef.current,
          { autoAlpha: 0, x: 16, scale: 0.6, rotation: 6 },
          { autoAlpha: 1, x: 0, scale: 1, rotation: 0, duration: ENTRADA_PROP, ease: 'back.out(1.7)' },
          cursor,
        );
        cursor += ENTRADA_PROP;
      }

      if (falaRef.current) {
        const palavras = falaRef.current.querySelectorAll('.tchin-cena-palavra');
        tl.fromTo(
          falaRef.current,
          { autoAlpha: 0, y: 6, scale: 0.97 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' },
          cursor,
        );
        tl.fromTo(
          palavras,
          { autoAlpha: 0, y: 4 },
          { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out', stagger: PALAVRA },
          cursor + 0.1,
        );
      }

      tl.to({}, { duration: RESPIRO });
    }, raizRef);

    return () => {
      esperaHintRef.current?.kill();
      esperaHintRef.current = null;
      tlRef.current = null;
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, tomada, roteiro]);

  const terminar = (completa: boolean) => {
    if (terminouRef.current) return;
    terminouRef.current = true;
    aoTerminar?.(completa);
  };

  /* Toque no palco: animando = completa o passo na hora;
     completo = transita para o próximo (no fim, encerra a cena). */
  const aoTocar = () => {
    if (terminouRef.current) return;
    if (!prontoRef.current) {
      tlRef.current?.progress(1);
      return;
    }
    esperaHintRef.current?.kill();
    setHintVisivel(false);
    if (indice < ultimo) {
      setSaindo(indice);
      setIndice(indice + 1);
    } else {
      terminar(true);
    }
  };

  const reverPasso = () => {
    if (terminouRef.current) return;
    esperaHintRef.current?.kill();
    setHintVisivel(false);
    setSaindo(null);
    setTchinKey((k) => k + 1); /* remonta o rig: a pose re-entra por mola */
    setTomada((t) => t + 1);
  };

  if (!passo) return null;

  const Prop = passo.prop ? PROPS_CENA[passo.prop] : null;
  const PropSaindo = passoSaindo?.prop ? PROPS_CENA[passoSaindo.prop] : null;
  const palavras = passo.fala ? passo.fala.trim().split(/\s+/) : [];

  return (
    <div
      ref={raizRef}
      className={className ? `tchin-cena app-chrome ${className}` : 'tchin-cena app-chrome'}
    >
      <button type="button" className="tchin-cena-toque tap" onClick={aoTocar} aria-label="Avançar cena">
        <div className="tchin-cena-fala" aria-live="polite">
          {passoSaindo?.fala && (
            <p
              key={`fala-saindo-${saindo}`}
              ref={falaSaindoRef}
              className="tchin-cena-balao tchin-cena-balao-saindo"
              aria-hidden="true"
            >
              {passoSaindo.fala}
            </p>
          )}
          {passo.fala && (
            <p key={`fala-${indice}-${tomada}`} ref={falaRef} className="tchin-cena-balao">
              <span className="tchin-vh">{passo.fala}</span>
              <span aria-hidden="true">
                {palavras.map((palavra, i) => (
                  <Fragment key={i}>
                    <span className="tchin-cena-palavra">{palavra}</span>
                    {i < palavras.length - 1 ? ' ' : null}
                  </Fragment>
                ))}
              </span>
            </p>
          )}
        </div>

        <span className="tchin-cena-palco">
          <Tchin key={`tchin-${tchinKey}`} estado={estadoTchin} tamanho={104} />
          <span className="tchin-cena-props">
            {PropSaindo && (
              <span
                key={`prop-saindo-${saindo}`}
                ref={propSaindoRef}
                className="tchin-cena-prop tchin-cena-prop-saindo"
                aria-hidden="true"
              >
                <PropSaindo size={68} />
              </span>
            )}
            {Prop && (
              <span key={`prop-${indice}-${tomada}`} ref={propRef} className="tchin-cena-prop">
                <Prop size={68} />
              </span>
            )}
          </span>
        </span>

        <span
          className={hintVisivel ? 'tchin-cena-hint tchin-cena-hint-visivel' : 'tchin-cena-hint'}
          aria-hidden={!hintVisivel}
        >
          Toque para continuar
        </span>
      </button>

      <div className="tchin-cena-rodape">
        <div className="tchin-cena-dots" role="img" aria-label={`Passo ${Math.min(indice, ultimo) + 1} de ${roteiro.length}`}>
          {roteiro.map((_, i) => (
            <span key={i} className={i <= indice ? 'tchin-cena-dot tchin-cena-dot-ativa' : 'tchin-cena-dot'} />
          ))}
        </div>
        <div className="tchin-cena-acoes">
          <button type="button" className="tchin-cena-rever tap" onClick={reverPasso}>
            Ver de novo
          </button>
          <button
            type="button"
            className="tchin-cena-pular tap"
            onClick={() => terminar(indice >= ultimo && prontoRef.current)}
          >
            {rotuloPular}
          </button>
        </div>
      </div>
    </div>
  );
}
