import { useRef, useState } from 'react';
import type { ExercicioOrdenar } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';
import { Icon } from '../components/Icon';
import dragIcon from '@material-symbols/svg-500/rounded/drag_indicator.svg?raw';

interface Props {
  ex: ExercicioOrdenar;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
}

interface EstadoDrag {
  de: number;
  dy: number;
  alvo: number;
  passo: number;
  moveu: boolean;
}

function embaralhar(n: number, evitar: number[]): number[] {
  const base = Array.from({ length: n }, (_, i) => i);
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    for (let i = base.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    if (!base.every((v, i) => v === evitar[i])) break;
  }
  return [...base];
}

/**
 * Ordenar por arraste vertical (pointer events) com fallback por toques:
 * toque em um item para escolher, toque em outro para trocar de lugar.
 */
export function ExOrdenar({ ex, fase, onResolver }: Props) {
  const [ordem, setOrdem] = useState<number[]>(() => embaralhar(ex.itens.length, ex.ordemCorreta));
  const [drag, setDrag] = useState<EstadoDrag | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const lista = useRef<HTMLOListElement>(null);
  const ponteiro = useRef<{ y0: number; id: number; de: number } | null>(null);

  const travado = fase !== 'respondendo';
  const revelado = fase === 'revelado';

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    if (travado) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const linhas = lista.current?.children;
    const primeira = linhas?.[0] as HTMLElement | undefined;
    const segunda = linhas?.[1] as HTMLElement | undefined;
    const passo =
      primeira && segunda ? segunda.offsetTop - primeira.offsetTop : (primeira?.offsetHeight ?? 56) + 8;
    ponteiro.current = { y0: e.clientY, id: e.pointerId, de: i };
    setDrag({ de: i, dy: 0, alvo: i, passo, moveu: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ponteiro.current || ponteiro.current.id !== e.pointerId || !drag) return;
    const dy = e.clientY - ponteiro.current.y0;
    const alvo = Math.max(0, Math.min(ordem.length - 1, drag.de + Math.round(dy / drag.passo)));
    setDrag({ ...drag, dy, alvo, moveu: drag.moveu || Math.abs(dy) > 6 });
  };

  const onPointerUp = () => {
    if (!ponteiro.current || !drag) return;
    const { de, alvo, moveu } = drag;
    ponteiro.current = null;
    setDrag(null);
    if (!moveu) {
      /* Fallback por toques: escolhe um, toca em outro, troca */
      if (sel === null) setSel(de);
      else if (sel === de) setSel(null);
      else {
        const nova = [...ordem];
        [nova[sel], nova[de]] = [nova[de], nova[sel]];
        setOrdem(nova);
        setSel(null);
      }
      return;
    }
    if (alvo !== de) {
      const nova = [...ordem];
      const [item] = nova.splice(de, 1);
      nova.splice(alvo, 0, item);
      setOrdem(nova);
    }
    setSel(null);
  };

  const conferir = () => {
    const correto = ordem.every((item, pos) => item === ex.ordemCorreta[pos]);
    onResolver({
      correto,
      titulo: correto ? 'Ordem certinha.' : 'A ordem era outra.',
      porque: ex.porque,
    });
  };

  const deslocamento = (i: number): number => {
    if (!drag) return 0;
    const { de, alvo, passo } = drag;
    if (i === de) return drag.dy;
    if (de < alvo && i > de && i <= alvo) return -passo;
    if (de > alvo && i >= alvo && i < de) return passo;
    return 0;
  };

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.instrucao}</h2>
      <p className="ex-dica app-chrome">Arraste para ordenar, ou toque em dois itens para trocar.</p>
      <ol className="ordenar" ref={lista}>
        {ordem.map((item, i) => {
          const arrastando = drag?.de === i && drag.moveu;
          let extra = '';
          if (revelado) extra = item === ex.ordemCorreta[i] ? ' linha-certa' : ' linha-errada';
          else if (sel === i) extra = ' linha-sel';
          return (
            <li
              key={ex.itens[item]}
              className={`ordenar-linha entra${extra}${arrastando ? ' linha-arrasto' : ''}`}
              style={{
                animationDelay: `${i * 50}ms`,
                transform: deslocamento(i) ? `translateY(${deslocamento(i)}px)` : undefined,
                transition: drag && drag.de !== i ? 'transform 150ms ease-out' : undefined,
              }}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label={`Posição ${i + 1}: ${ex.itens[item]}`}
            >
              <span className="ordenar-pos app-chrome">{i + 1}</span>
              <span className="ordenar-texto">{ex.itens[item]}</span>
              <Icon svg={dragIcon} size={20} className="ordenar-pega" />
            </li>
          );
        })}
      </ol>
      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-cheio tap" onClick={conferir}>
            Conferir
          </button>
        </div>
      )}
    </div>
  );
}
