import { useState } from 'react';
import type { ExercicioDuasVerdades } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';

interface Props {
  ex: ExercicioDuasVerdades;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
}

export function ExDuasVerdades({ ex, fase, onResolver }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const travado = fase !== 'respondendo';

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
      <div className="ex-opcoes" role="group" aria-label="Afirmações">
        {ex.afirmacoes.map((frase, i) => {
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
              className={`opcao tap entra${extra}`}
              style={{ animationDelay: `${i * 50}ms` }}
              disabled={travado}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
            >
              {frase}
            </button>
          );
        })}
      </div>
      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-cheio tap" disabled={sel === null} onClick={conferir}>
            Conferir
          </button>
        </div>
      )}
    </div>
  );
}
