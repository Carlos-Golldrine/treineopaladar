import { useEffect, useState } from 'react';
import { Tchin } from '../mascote';
import { ChamaStreak, Odometro } from '../coreografia/Coreografias';
import { tocar } from '../som/som';
import { track } from '../lib/analytics';

/**
 * Conclusao especial da Licao 1 (fase 2 do blueprint): o aha.
 * XP e nomeado aqui pela primeira vez (rolando em odometro), o streak
 * acende a primeira chama e o micro-compromisso de meta e gravado com
 * 1 toque. Cristais, liga e loja NAO aparecem (revelacao progressiva).
 */

interface Props {
  xp: number;
  streak: number;
  /** Recebe a meta diaria em XP (Leve 20, Firme 40) e segue o fluxo. */
  onMeta: (meta: number) => void;
}

export function Conclusao1({ xp, streak, onMeta }: Props) {
  const [metaSel, setMetaSel] = useState<number | null>(null);

  /* Primeiro marco da jornada: arpejo com brilho */
  useEffect(() => {
    track('ftue_concluido', { xp, streak });
    const t = window.setTimeout(() => tocar('marco'), 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolher = (meta: number) => {
    if (metaSel !== null) return;
    setMetaSel(meta);
    window.setTimeout(() => onMeta(meta), 320);
  };

  return (
    <div className="conclusao c1">
      <div className="conclusao-rolagem">
        <div className="c1-mascote" aria-hidden="true">
          <Tchin estado="celebra" tamanho={104} />
        </div>
        <header className="conclusao-cabeca app-chrome">
          <p className="conclusao-eyebrow">Lição 1 concluída</p>
          <h1 className="conclusao-titulo conclusao-titulo-perfeita">Seu paladar acordou.</h1>
        </header>

        <div className="c1-xp app-chrome" aria-label={`Você ganhou ${xp} XP`}>
          <span className="c1-xp-num">
            +<Odometro valor={xp} />
          </span>
          <span className="c1-xp-rotulo">XP</span>
        </div>
        <p className="c1-xp-nota">Você acabou de ganhar seus primeiros pontos de treino. XP é o placar do seu paladar.</p>

        <div className="c1-streak">
          <ChamaStreak acende size={24} />
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
