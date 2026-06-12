import { useState } from 'react';
import type { ExercicioMC } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from '../licao/tipos';
import { TacaBranca, TacaTinta } from './Ilustracoes';

/**
 * J1 do FTUE: escolha visual entre duas cartas ilustradas (branco gelado
 * vs tinto). Mesmo contrato dos exercicios do player (fase + onResolver),
 * mesmo loop de interacao (tocar na carta, Conferir).
 */
interface Props {
  ex: ExercicioMC;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
}

export function ExVisual({ ex, fase, onResolver }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const travado = fase !== 'respondendo';
  const ilustracoes = [<TacaBranca key="branca" />, <TacaTinta key="tinta" />];

  const conferir = () => {
    if (sel === null) return;
    const correto = sel === ex.correta;
    onResolver({ correto, titulo: correto ? ex.okMsg : ex.erroMsg, porque: ex.porque });
  };

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.pergunta}</h2>
      <div className="ex-opcoes visual-grade" role="group" aria-label="Opções de resposta">
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
              className={`opcao carta-visual tap entra${extra}`}
              style={{ animationDelay: `${i * 50}ms` }}
              disabled={travado}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
            >
              {ilustracoes[i]}
              <span className="carta-visual-rotulo">{opcao}</span>
            </button>
          );
        })}
      </div>
      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button
            type="button"
            className="btn btn-primary btn-jogo btn-cheio tap"
            disabled={sel === null}
            onClick={conferir}
          >
            Conferir
          </button>
        </div>
      )}
    </div>
  );
}
