import { useRef, useState } from 'react';
import type { ExercicioSwipe } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';

interface Props {
  ex: ExercicioSwipe;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
}

interface FeedbackCarta {
  correto: boolean;
  porque: string;
}

const LIMIAR = 88;

/**
 * Deck de cartas: deslizar para a direita marca "é assim", para a esquerda
 * "não é". Fisica de arraste com pointer events + fallback por botoes.
 * O exercicio fecha certo quando todas as cartas saem para o lado certo.
 */
export function ExSwipe({ ex, fase, onResolver }: Props) {
  const [idx, setIdx] = useState(0);
  const [acertosCartas, setAcertosCartas] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackCarta | null>(null);
  const [saindo, setSaindo] = useState<1 | -1 | 0>(0);
  const [drag, setDrag] = useState<{ dx: number; ativo: boolean }>({ dx: 0, ativo: false });
  const ponteiro = useRef<{ x0: number; id: number } | null>(null);
  const errosPorque = useRef<string[]>([]);

  const total = ex.cartas.length;
  const carta = ex.cartas[idx];
  const fim = idx >= total;
  const travado = fase !== 'respondendo' || fim || saindo !== 0;

  const resolverCarta = (direita: boolean) => {
    if (!carta || saindo !== 0) return;
    const correto = direita === carta.verdade;
    if (!correto) errosPorque.current.push(carta.porque);
    setSaindo(direita ? 1 : -1);
    setFeedback({ correto, porque: carta.porque });
    const acertos = acertosCartas + (correto ? 1 : 0);
    window.setTimeout(() => {
      setSaindo(0);
      setDrag({ dx: 0, ativo: false });
      setAcertosCartas(acertos);
      const proxima = idx + 1;
      setIdx(proxima);
      if (proxima >= total) {
        const tudoCerto = acertos === total;
        onResolver({
          correto: tudoCerto,
          titulo: tudoCerto ? 'Deck limpo, carta por carta.' : `${acertos} de ${total} cartas no lugar certo.`,
          porque: tudoCerto
            ? ex.cartas[total - 1].porque
            : (errosPorque.current[0] ?? ex.cartas[total - 1].porque),
        });
      }
    }, 230);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (travado) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    ponteiro.current = { x0: e.clientX, id: e.pointerId };
    setDrag({ dx: 0, ativo: true });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ponteiro.current || ponteiro.current.id !== e.pointerId) return;
    setDrag({ dx: e.clientX - ponteiro.current.x0, ativo: true });
  };

  const soltar = () => {
    if (!ponteiro.current) return;
    const dx = drag.dx;
    ponteiro.current = null;
    if (Math.abs(dx) >= LIMIAR) {
      resolverCarta(dx > 0);
    } else {
      setDrag({ dx: 0, ativo: false });
    }
  };

  const dx = saindo !== 0 ? saindo * 480 : drag.dx;
  const forca = Math.min(1, Math.abs(drag.dx) / LIMIAR);

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.instrucao}</h2>

      <div className="deck-pontos app-chrome" aria-label={`Carta ${Math.min(idx + 1, total)} de ${total}`}>
        {ex.cartas.map((c, i) => (
          <span key={c.texto} className={`deck-ponto${i < idx ? ' deck-ponto-feita' : ''}${i === idx ? ' deck-ponto-atual' : ''}`} />
        ))}
      </div>

      <div className="deck entra">
        {/* Pilha do deck: as duas proximas cartas espiando atras */}
        {idx + 2 < total && <div className="carta carta-tras-2" aria-hidden="true" />}
        {idx + 1 < total && <div className="carta carta-tras" aria-hidden="true" />}
        {carta ? (
          <div
            className={`carta carta-topo${drag.ativo && saindo === 0 ? '' : ' carta-solta'}`}
            style={{ transform: `translateX(${dx}px) rotate(${dx * 0.055}deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          >
            <p className="carta-texto">{carta.texto}</p>
            <span className="carta-selo carta-selo-sim" style={{ opacity: dx > 0 ? forca : 0 }} aria-hidden="true">
              É assim
            </span>
            <span className="carta-selo carta-selo-nao" style={{ opacity: dx < 0 ? forca : 0 }} aria-hidden="true">
              Não é
            </span>
          </div>
        ) : (
          <div className="carta carta-fim">
            <p className="carta-texto">Deck encerrado.</p>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`deck-eco ${feedback.correto ? 'deck-eco-ok' : 'deck-eco-erro'}`} key={idx}>
          <strong>{feedback.correto ? 'Era isso.' : 'Era o contrário.'}</strong> {feedback.porque}
        </div>
      )}

      {fase === 'respondendo' && !fim && (
        <div className="deck-botoes app-chrome">
          <button type="button" className="btn btn-deck btn-deck-nao tap" disabled={travado} onClick={() => resolverCarta(false)}>
            Não é
          </button>
          <button type="button" className="btn btn-deck btn-deck-sim tap" disabled={travado} onClick={() => resolverCarta(true)}>
            É assim
          </button>
        </div>
      )}
    </div>
  );
}
