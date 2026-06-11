import { useState } from 'react';
import type { ExercicioIntruso } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';

interface Props {
  ex: ExercicioIntruso;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
}

export function ExIntruso({ ex, fase, onResolver }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const travado = fase !== 'respondendo';

  const conferir = () => {
    if (sel === null) return;
    const correto = sel === ex.intruso;
    onResolver({
      correto,
      titulo: correto ? 'Intruso encontrado.' : 'O intruso passou batido.',
      porque: ex.regra,
    });
  };

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.pergunta}</h2>
      <div className="ex-opcoes ex-grade" role="group" aria-label="Opções">
        {ex.opcoes.map((opcao, i) => {
          let extra = '';
          if (fase === 'revelado') {
            if (i === ex.intruso) extra = ' opcao-certa';
            else if (i === sel) extra = ' opcao-errada';
          } else if (i === sel) {
            extra = ' opcao-sel';
          }
          return (
            <button
              key={opcao}
              type="button"
              className={`opcao opcao-grade tap entra${extra}`}
              style={{ animationDelay: `${i * 50}ms` }}
              disabled={travado}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
            >
              {opcao}
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
