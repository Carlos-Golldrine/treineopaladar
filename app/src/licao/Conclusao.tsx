import { useEffect, useRef, useState } from 'react';
import type { Licao } from '../engine';
import type { ResultadoSessao, TipoSessao } from '../engine';
import { Icon } from '../components/Icon';
import checkIcon from '@material-symbols/svg-500/rounded/check.svg?raw';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';
import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import heartIcon from '@material-symbols/svg-500/rounded/favorite-fill.svg?raw';

/* --------------------------- Count-up de XP -------------------------- */

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

/* ------------------- Confete (so em licao perfeita) ------------------ */

const CORES_CONFETE = ['var(--wine-700)', 'var(--gold-500)', 'var(--ember-500)', 'var(--ok-700)', 'var(--gold-700)'];

function Confete() {
  const pecas = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div className="confete" aria-hidden="true">
      {pecas.map((i) => (
        <span
          key={i}
          className="confete-peca"
          style={{
            left: `${4 + ((i * 37) % 92)}%`,
            background: CORES_CONFETE[i % CORES_CONFETE.length],
            animationDelay: `${(i % 9) * 90}ms`,
            animationDuration: `${1200 + (i % 5) * 160}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------- Tela de conclusao ------------------------- */

interface ConclusaoProps {
  licao: Licao;
  resultado: ResultadoSessao;
  tipo: TipoSessao;
  streak: number;
  onTrilha: () => void;
  onRevisar: () => void;
}

export function Conclusao({ licao, resultado, tipo, streak, onTrilha, onRevisar }: ConclusaoProps) {
  const xp = useCountUp(resultado.xp);
  const { perfeita } = resultado;
  const xpCheio = tipo === 'revisao' || resultado.xp >= (perfeita ? 25 : 20);

  return (
    <div className="conclusao">
      {perfeita && <Confete />}
      <div className="conclusao-rolagem">
        <header className="conclusao-cabeca app-chrome">
          <p className="conclusao-eyebrow">{tipo === 'revisao' ? 'Revisão concluída' : 'Lição concluída'}</p>
          <h1 className={`conclusao-titulo${perfeita ? ' conclusao-titulo-perfeita' : ''}`}>
            {perfeita ? 'Impecável.' : 'Bonito treino.'}
          </h1>
          <p className="conclusao-resumo">
            {resultado.acertos} {resultado.acertos === 1 ? 'acerto' : 'acertos'}
            {resultado.erros > 0
              ? `, ${resultado.erros} ${resultado.erros === 1 ? 'tropeço corrigido' : 'tropeços corrigidos'}.`
              : ', nenhum tropeço.'}
          </p>
        </header>

        <div className="placar app-chrome">
          <div className="placar-item">
            <span className="placar-num placar-xp">+{xp}</span>
            <span className="placar-rotulo">XP</span>
          </div>
          {resultado.cristais > 0 && (
            <div className="placar-item">
              <span className="placar-num placar-cristais">
                <Icon svg={diamondIcon} size={20} />
                +{resultado.cristais}
              </span>
              <span className="placar-rotulo">cristais</span>
            </div>
          )}
          {tipo === 'revisao' && (
            <div className="placar-item">
              <span className="placar-num placar-vida">
                <Icon svg={heartIcon} size={20} />
                +1
              </span>
              <span className="placar-rotulo">vida</span>
            </div>
          )}
          <div className="placar-item">
            <span className="placar-num placar-streak">
              <Icon svg={fireIcon} size={20} />
              {streak}
            </span>
            <span className="placar-rotulo">{streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
          </div>
        </div>

        {!xpCheio && (
          <p className="conclusao-pacing">XP reduzido pelo ritmo de hoje. Amanhã ele volta cheio.</p>
        )}

        <section className="sabe" aria-label="Você agora sabe">
          <h2 className="sabe-titulo">Você agora sabe</h2>
          <ul className="sabe-lista">
            {licao.voceAgoraSabe.map((frase) => (
              <li key={frase} className="sabe-item">
                <span className="sabe-check">
                  <Icon svg={checkIcon} size={16} />
                </span>
                {frase}
              </li>
            ))}
          </ul>
        </section>

        <section className="curiosidade" aria-label="Curiosidade">
          <p className="curiosidade-eyebrow">Para contar na mesa</p>
          <p className="curiosidade-texto">{licao.curiosidade}</p>
        </section>

        <p className="conclusao-teaser">{licao.teaser}</p>
      </div>

      <footer className="conclusao-acoes">
        <button type="button" className="btn btn-primary btn-cheio tap" onClick={onTrilha}>
          Continuar na trilha
        </button>
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={onRevisar}>
          Revisar esta lição
        </button>
      </footer>
    </div>
  );
}
