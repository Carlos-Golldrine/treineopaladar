import { useEffect } from 'react';
import type { Licao } from '../engine';
import type { ResultadoSessao, TipoSessao } from '../engine';
import { Ic } from '../icones/Icones';
import { Tchin } from '../mascote';
import { ChamaStreak, ConfeteFisica, Odometro } from '../coreografia/Coreografias';
import { tocar } from '../som/som';

/* ------------------------- Tela de conclusao ------------------------- */

interface ConclusaoProps {
  licao: Licao;
  resultado: ResultadoSessao;
  tipo: TipoSessao;
  streak: number;
  /** True quando ESTA conclusao garantiu o dia: a chama acende com particulas. */
  streakGanhoAgora?: boolean;
  /** XP do checkpoint quando esta conclusao fechou a unidade (50), senao null. */
  xpCheckpoint?: number | null;
  onTrilha: () => void;
  onRevisar: () => void;
}

export function Conclusao({
  licao,
  resultado,
  tipo,
  streak,
  streakGanhoAgora = false,
  xpCheckpoint = null,
  onTrilha,
  onRevisar,
}: ConclusaoProps) {
  const { perfeita } = resultado;
  const xpCheio = tipo === 'revisao' || resultado.xp >= (perfeita ? 25 : 20);
  const temMarco = perfeita || xpCheckpoint !== null || streakGanhoAgora;

  /* Som de jogo: acorde de conclusao; marcos ganham o arpejo com brilho */
  useEffect(() => {
    tocar('conclusao');
    if (!temMarco) return;
    const t = window.setTimeout(() => tocar('marco'), 520);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="conclusao">
      {perfeita && <ConfeteFisica />}
      <div className="conclusao-rolagem">
        {/* Mascote vivo: o Tchin celebra brindando (segunda taca entra em cena) */}
        <div className="conclusao-mascote" aria-hidden="true">
          <Tchin estado="celebra" tamanho={92} />
        </div>
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
            <span className="placar-num placar-xp">
              +<Odometro valor={resultado.xp} />
            </span>
            <span className="placar-rotulo">XP</span>
          </div>
          {resultado.cristais > 0 && (
            <div className="placar-item">
              <span className="placar-num placar-cristais">
                <Ic nome="cristal" size={20} />
                +{resultado.cristais}
              </span>
              <span className="placar-rotulo">cristais</span>
            </div>
          )}
          {tipo === 'revisao' && (
            <div className="placar-item">
              <span className="placar-num placar-vida">
                <Ic nome="coracao-vida" size={20} />
                +1
              </span>
              <span className="placar-rotulo">vida</span>
            </div>
          )}
          {xpCheckpoint !== null && (
            <div className="placar-item">
              <span className="placar-num placar-checkpoint">
                <Ic nome="bandeira-meta" size={20} />
                +{xpCheckpoint}
              </span>
              <span className="placar-rotulo">checkpoint</span>
            </div>
          )}
          <div className="placar-item">
            <span className="placar-num placar-streak">
              <ChamaStreak acende={streakGanhoAgora} size={20} />
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
                  <Ic nome="check" size={16} />
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
        <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={onTrilha}>
          Continuar na trilha
        </button>
        <button type="button" className="btn btn-outline btn-cheio tap" onClick={onRevisar}>
          Revisar esta lição
        </button>
      </footer>
    </div>
  );
}
