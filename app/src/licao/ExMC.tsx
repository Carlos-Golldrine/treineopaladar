import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExercicioMC } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';
import { RotuloFigura } from './RotuloFigura';

interface Props {
  ex: ExercicioMC;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
  /** Dica comprada: indice da alternativa errada eliminada. */
  eliminada?: number;
  /** So para a cena de screenshot: comeca com uma opcao errada marcada. */
  presetErro?: boolean;
  /** Cena interativa da habilidade, entre a pergunta e as opcoes. */
  cena?: ReactNode;
}

export function ExMC({ ex, fase, onResolver, eliminada, presetErro, cena }: Props) {
  const [sel, setSel] = useState<number | null>(() =>
    presetErro ? ex.opcoes.findIndex((_, i) => i !== ex.correta) : null,
  );
  const travado = fase !== 'respondendo';

  /* A dica pode eliminar a opcao que estava marcada: desmarca */
  useEffect(() => {
    if (eliminada !== undefined && sel === eliminada) setSel(null);
  }, [eliminada, sel]);

  const conferir = () => {
    if (sel === null) return;
    const correto = sel === ex.correta;
    onResolver({ correto, titulo: correto ? ex.okMsg : ex.erroMsg, porque: ex.porque });
  };

  return (
    <div className="ex">
      {ex.imagem && <RotuloFigura src={ex.imagem} />}
      <h2 className="ex-pergunta">{ex.pergunta}</h2>
      {cena}
      <div className="ex-opcoes" role="group" aria-label="Opções de resposta">
        {ex.opcoes.map((opcao, i) => {
          const fora = eliminada === i;
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
              className={`opcao tap entra${extra}${fora ? ' opcao-eliminada' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              disabled={travado || fora}
              aria-pressed={i === sel}
              onClick={() => setSel(i)}
            >
              {opcao}
              {fora && <span className="opcao-fora">não é essa</span>}
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
