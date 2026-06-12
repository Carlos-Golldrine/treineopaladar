import { useState } from 'react';
import type { ExercicioMC } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';
import { RotuloFigura } from './RotuloFigura';

interface Props {
  ex: ExercicioMC;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
  /** So para a cena de screenshot: comeca com uma opcao errada marcada. */
  presetErro?: boolean;
}

export function ExMC({ ex, fase, onResolver, presetErro }: Props) {
  const [sel, setSel] = useState<number | null>(() =>
    presetErro ? ex.opcoes.findIndex((_, i) => i !== ex.correta) : null,
  );
  const travado = fase !== 'respondendo';

  const conferir = () => {
    if (sel === null) return;
    const correto = sel === ex.correta;
    onResolver({ correto, titulo: correto ? ex.okMsg : ex.erroMsg, porque: ex.porque });
  };

  return (
    <div className="ex">
      {ex.imagem && <RotuloFigura src={ex.imagem} />}
      <h2 className="ex-pergunta">{ex.pergunta}</h2>
      <div className="ex-opcoes" role="group" aria-label="Opções de resposta">
        {ex.opcoes.map((opcao, i) => {
          let extra = '';
          if (fase === 'revelado') {
            if (i === ex.correta) extra = ' opcao-certa';
            else if (i === sel) extra = ' opcao-errada';
          } else if (i === sel) {
            extra = ' opcao-sel';
          }
          return (
            <button
              key={opcao}
              type="button"
              className={`opcao tap entra${extra}`}
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
