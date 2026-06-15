import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExercicioDuasVerdades } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';

interface Props {
  ex: ExercicioDuasVerdades;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
  /** Dica comprada: indice de uma verdade confirmada (nao e a mentira). */
  eliminada?: number;
  /** Cena interativa da habilidade, entre a pergunta e as afirmacoes. */
  cena?: ReactNode;
}

export function ExDuasVerdades({ ex, fase, onResolver, eliminada, cena }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const travado = fase !== 'respondendo';

  /* A dica pode confirmar a afirmacao que estava marcada: desmarca */
  useEffect(() => {
    if (eliminada !== undefined && sel === eliminada) setSel(null);
  }, [eliminada, sel]);

  const conferir = () => {
    if (sel === null) return;
    const correto = sel === ex.mentira;
    onResolver({
      correto,
      titulo: correto ? 'Achou a mentira.' : 'A mentira escapou.',
      porque: ex.porque,
    });
  };

  return (
    <div className="ex">
      <p className="ex-eyebrow">Duas verdades e uma mentira sobre {ex.tema.toLowerCase()}</p>
      <h2 className="ex-pergunta">Toque na mentira.</h2>
      {cena}
      <div className="ex-opcoes" role="group" aria-label="Afirmações">
        {ex.afirmacoes.map((frase, i) => {
          const fora = eliminada === i;
          let extra = '';
          if (fase === 'revelado') {
            if (i === ex.mentira) extra = ' opcao-certa';
            else if (i === sel) extra = ' opcao-errada';
          } else if (i === sel) {
            extra = ' opcao-sel';
          }
          return (
            <button
              key={frase}
              type="button"
              className={`opcao tap entra${extra}${fora ? ' opcao-eliminada' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              disabled={travado || fora}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
            >
              {frase}
              {fora && <span className="opcao-fora">é verdade</span>}
            </button>
          );
        })}
      </div>
      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" disabled={sel === null} onClick={conferir}>
            Conferir
          </button>
        </div>
      )}
    </div>
  );
}
