import { useEffect, useState } from 'react';
import type { ExercicioSlider } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';

export interface FaixaDica {
  min: number;
  max: number;
}

interface Props {
  ex: ExercicioSlider;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
  /** Dica comprada: a regua so aceita valores dentro desta faixa (50%). */
  faixaDica?: FaixaDica;
}

export function ExSlider({ ex, fase, onResolver, faixaDica }: Props) {
  const [valor, setValor] = useState(50);
  const travado = fase !== 'respondendo';
  const revelado = fase === 'revelado';
  const distancia = Math.abs(valor - ex.alvo);
  const acertou = distancia <= ex.tolerancia;

  /* A dica estreita a regua: o palpite atual entra na faixa */
  useEffect(() => {
    if (!faixaDica) return;
    setValor((v) => Math.min(faixaDica.max, Math.max(faixaDica.min, v)));
  }, [faixaDica]);

  const conferir = () => {
    onResolver({
      correto: acertou,
      titulo: acertou
        ? `Dentro do alvo, a ${distancia} ${distancia === 1 ? 'ponto' : 'pontos'}.`
        : `Seu palpite ficou a ${distancia} pontos do alvo.`,
      porque: ex.porque,
    });
  };

  const faixaEsq = Math.max(0, ex.alvo - ex.tolerancia);
  const faixaDir = Math.min(100, ex.alvo + ex.tolerancia);

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.pergunta}</h2>

      <div className="regua entra">
        <div className={`regua-trilho${revelado ? (acertou ? ' trilho-ok' : ' trilho-erro') : ''}`}>
          {/* Dica: zonas cortadas da regua (a faixa encolheu pela metade) */}
          {faixaDica && !revelado && (
            <>
              {faixaDica.min > 0 && (
                <div className="regua-corte" style={{ left: 0, width: `${faixaDica.min}%` }} aria-hidden="true" />
              )}
              {faixaDica.max < 100 && (
                <div
                  className="regua-corte"
                  style={{ left: `${faixaDica.max}%`, width: `${100 - faixaDica.max}%` }}
                  aria-hidden="true"
                />
              )}
            </>
          )}
          {/* Faixa de tolerancia: aparece no reveal com scaleX animado */}
          <div
            className={`regua-faixa${revelado ? ' regua-faixa-on' : ''}`}
            style={{ left: `${faixaEsq}%`, width: `${faixaDir - faixaEsq}%` }}
            aria-hidden="true"
          />
          {/* Marcador do alvo */}
          <div
            className={`regua-alvo${revelado ? ' regua-alvo-on' : ''}${revelado && acertou ? ' regua-alvo-ok' : ''}`}
            style={{ left: `${ex.alvo}%` }}
            aria-hidden="true"
          >
            <span className="regua-alvo-tag">alvo</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={valor}
            disabled={travado}
            aria-label={`Régua de ${ex.labelMin} a ${ex.labelMax}`}
            onChange={(e) => {
              const bruto = Number(e.target.value);
              setValor(
                faixaDica ? Math.min(faixaDica.max, Math.max(faixaDica.min, bruto)) : bruto,
              );
            }}
          />
        </div>
        <div className="regua-labels app-chrome">
          <span>{ex.labelMin}</span>
          <span>{ex.labelMax}</span>
        </div>
        {faixaDica && !revelado && (
          <p className="regua-dica-nota" aria-live="polite">
            A régua encolheu pela metade. O alvo mora aqui dentro.
          </p>
        )}
        {revelado && (
          <p className={`regua-leitura ${acertou ? 'regua-leitura-ok' : 'regua-leitura-erro'}`}>
            {acertou ? 'Bom olho.' : 'O alvo estava ali do lado.'}
          </p>
        )}
      </div>

      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={conferir}>
            Cravar palpite
          </button>
        </div>
      )}
    </div>
  );
}
