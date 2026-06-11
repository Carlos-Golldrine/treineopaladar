import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { TchinDuo } from './Mascote';
import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';

/**
 * Conclusao especial da Licao 1 (fase 2 do blueprint): o aha.
 * XP e nomeado aqui pela primeira vez, o streak ganha o unico tooltip
 * e o micro-compromisso de meta e gravado com 1 toque.
 * Cristais, liga e loja NAO aparecem (revelacao progressiva).
 */

function useCountUp(alvo: number, duracao = 800): number {
  const [valor, setValor] = useState(0);
  const inicio = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const passo = (t: number) => {
      if (inicio.current === null) inicio.current = t;
      const p = Math.min(1, (t - inicio.current) / duracao);
      const easeOut = 1 - Math.pow(1 - p, 3);
      setValor(Math.round(alvo * easeOut));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracao]);
  return valor;
}

interface Props {
  xp: number;
  streak: number;
  /** Recebe a meta diaria em XP (Leve 20, Firme 40) e segue o fluxo. */
  onMeta: (meta: number) => void;
}

export function Conclusao1({ xp, streak, onMeta }: Props) {
  const valor = useCountUp(xp);
  const [metaSel, setMetaSel] = useState<number | null>(null);

  const escolher = (meta: number) => {
    if (metaSel !== null) return;
    setMetaSel(meta);
    window.setTimeout(() => onMeta(meta), 320);
  };

  return (
    <div className="conclusao c1">
      <div className="conclusao-rolagem">
        <div className="c1-mascote" aria-hidden="true">
          <TchinDuo size={104} />
        </div>
        <header className="conclusao-cabeca app-chrome">
          <p className="conclusao-eyebrow">Lição 1 concluída</p>
          <h1 className="conclusao-titulo conclusao-titulo-perfeita">Seu paladar acordou.</h1>
        </header>

        <div className="c1-xp app-chrome" aria-label={`Você ganhou ${xp} XP`}>
          <span className="c1-xp-num">+{valor}</span>
          <span className="c1-xp-rotulo">XP</span>
        </div>
        <p className="c1-xp-nota">Você acabou de ganhar seus primeiros pontos de treino. XP é o placar do seu paladar.</p>

        <div className="c1-streak">
          <Icon svg={fireIcon} size={24} />
          <p>
            Dia <strong>{streak}</strong> da sua sequência. Volte amanhã pelo dia 2.
          </p>
        </div>

        <section className="c1-meta" aria-label="Meta diária">
          <h2 className="c1-meta-titulo">Quantas lições por dia?</h2>
          <p className="c1-meta-sub">Dá para ajustar depois, sem cerimônia.</p>
          <div className="c1-meta-opcoes">
            <button
              type="button"
              className={`meta-carta tap${metaSel === 20 ? ' meta-carta-sel' : ''}`}
              aria-pressed={metaSel === 20}
              onClick={() => escolher(20)}
            >
              <span className="meta-nome">Leve</span>
              <span className="meta-desc">1 lição por dia</span>
              <span className="meta-tempo">uns 5 minutos</span>
            </button>
            <button
              type="button"
              className={`meta-carta tap${metaSel === 40 ? ' meta-carta-sel' : ''}`}
              aria-pressed={metaSel === 40}
              onClick={() => escolher(40)}
            >
              <span className="meta-nome">Firme</span>
              <span className="meta-desc">2 lições por dia</span>
              <span className="meta-tempo">uns 10 minutos</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
