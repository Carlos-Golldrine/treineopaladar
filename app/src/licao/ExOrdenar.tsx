import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ExercicioOrdenar } from '../engine';
import type { FaseExercicio, ResolucaoExercicio } from './tipos';
import { vibrar } from './tipos';
import { Ic } from '../icones/Icones';

interface Props {
  ex: ExercicioOrdenar;
  fase: FaseExercicio;
  onResolver: (r: ResolucaoExercicio) => void;
  /** Cena interativa da habilidade, entre a instrucao e a lista. */
  cena?: ReactNode;
}

interface EstadoDrag {
  de: number;
  dy: number;
  alvo: number;
  passo: number;
  moveu: boolean;
  /** Durante a animacao de "pousar" no slot, apos soltar. */
  assentando: boolean;
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

/** Easing de mola suave para o assentar e o abrir-espaco. */
const MOLA = 'cubic-bezier(0.2, 0.85, 0.25, 1)';

/**
 * Ordenar por arraste vertical (pointer events) com fallback por toques:
 * toque em um item para escolher, toque em outro para trocar de lugar.
 * O card segue o dedo 1:1, levanta ao ser segurado, dá um tique tátil a cada
 * posicao que cruza e assenta suave ao soltar.
 */
export function ExOrdenar({ ex, fase, onResolver, cena }: Props) {
  const [ordem, setOrdem] = useState<number[]>(() => embaralhar(ex.itens.length, ex.ordemCorreta));
  const [drag, setDrag] = useState<EstadoDrag | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const lista = useRef<HTMLOListElement>(null);
  const ponteiro = useRef<{ y0: number; id: number; de: number } | null>(null);
  /* Reordenacao que ainda vai ser confirmada quando a animacao de assentar acaba. */
  const pendente = useRef<{ de: number; alvo: number } | null>(null);
  const tempo = useRef<number | null>(null);

  const travado = fase !== 'respondendo';
  const revelado = fase === 'revelado';

  /* Aplica (agora) uma reordenacao que estava esperando o assentar terminar. */
  const aplicarPendente = () => {
    if (tempo.current) {
      window.clearTimeout(tempo.current);
      tempo.current = null;
    }
    const p = pendente.current;
    if (!p) return;
    pendente.current = null;
    setOrdem((atual) => {
      const nova = [...atual];
      const [item] = nova.splice(p.de, 1);
      nova.splice(p.alvo, 0, item);
      return nova;
    });
  };

  /* Ao desmontar, so cancela o timeout (nao mexe em estado de componente morto). */
  useEffect(() => () => {
    if (tempo.current) window.clearTimeout(tempo.current);
  }, []);

  const onPointerDown = (e: React.PointerEvent, i: number) => {
    if (travado) return;
    aplicarPendente(); // se havia um assentar em curso, confirma antes de pegar outro
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const linhas = lista.current?.children;
    const primeira = linhas?.[0] as HTMLElement | undefined;
    const segunda = linhas?.[1] as HTMLElement | undefined;
    const passo =
      primeira && segunda ? segunda.offsetTop - primeira.offsetTop : (primeira?.offsetHeight ?? 56) + 8;
    ponteiro.current = { y0: e.clientY, id: e.pointerId, de: i };
    setDrag({ de: i, dy: 0, alvo: i, passo, moveu: false, assentando: false });
    vibrar(); // tique de "peguei o card"
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!ponteiro.current || ponteiro.current.id !== e.pointerId || !drag || drag.assentando) return;
    const dy = e.clientY - ponteiro.current.y0;
    const alvo = Math.max(0, Math.min(ordem.length - 1, drag.de + Math.round(dy / drag.passo)));
    if (alvo !== drag.alvo) vibrar(); // tique a cada posicao cruzada
    setDrag({ ...drag, dy, alvo, moveu: drag.moveu || Math.abs(dy) > 6 });
  };

  const onPointerUp = () => {
    if (!ponteiro.current || !drag) return;
    const { de, alvo, moveu, passo } = drag;
    ponteiro.current = null;

    if (!moveu) {
      /* Fallback por toques: escolhe um, toca em outro, troca */
      setDrag(null);
      if (sel === null) setSel(de);
      else if (sel === de) setSel(null);
      else {
        const nova = [...ordem];
        [nova[sel], nova[de]] = [nova[de], nova[sel]];
        setOrdem(nova);
        setSel(null);
        vibrar();
      }
      return;
    }

    if (alvo === de) {
      setDrag(null); // soltou no mesmo lugar: so volta
      setSel(null);
      return;
    }

    /* Assenta: anima o card ate o slot exato e so entao confirma a ordem nova. */
    vibrar();
    pendente.current = { de, alvo };
    setDrag({ ...drag, dy: (alvo - de) * passo, assentando: true });
    tempo.current = window.setTimeout(() => {
      aplicarPendente();
      setDrag(null);
      setSel(null);
    }, 180);
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

  const estilo = (i: number): CSSProperties => {
    const base: CSSProperties = { animationDelay: `${i * 50}ms` };
    if (!drag) return base;
    const d = deslocamento(i);
    if (i === drag.de) {
      /* Card segurado: levanta (scale) e segue o dedo sem transicao; ao assentar,
         volta a escala 1 deslizando ate o slot. */
      base.transform = `translateY(${d}px) scale(${drag.assentando ? 1 : 1.04})`;
      base.transition = drag.assentando ? `transform 180ms ${MOLA}` : 'none';
      base.zIndex = 3;
    } else {
      base.transform = d ? `translateY(${d}px)` : undefined;
      base.transition = `transform 180ms ${MOLA}`;
    }
    return base;
  };

  return (
    <div className="ex">
      <h2 className="ex-pergunta">{ex.instrucao}</h2>
      <p className="ex-dica app-chrome">Segure e arraste para ordenar, ou toque em dois itens para trocar.</p>
      {cena}
      <ol className="ordenar" ref={lista}>
        {ordem.map((item, i) => {
          const seguro = drag?.de === i && (drag.moveu || drag.assentando);
          let extra = '';
          if (revelado) extra = item === ex.ordemCorreta[i] ? ' linha-certa' : ' linha-errada';
          else if (sel === i) extra = ' linha-sel';
          return (
            <li
              key={ex.itens[item]}
              className={`ordenar-linha ordenar-entra${extra}${seguro ? ' linha-arrasto' : ''}`}
              style={estilo(i)}
              onPointerDown={(e) => onPointerDown(e, i)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label={`Posição ${i + 1}: ${ex.itens[item]}`}
            >
              <span className="ordenar-pos app-chrome">{i + 1}</span>
              <span className="ordenar-texto">{ex.itens[item]}</span>
              <Ic nome="arrastar" size={20} className="ordenar-pega" />
            </li>
          );
        })}
      </ol>
      {fase === 'respondendo' && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-jogo btn-cheio tap" onClick={conferir}>
            Conferir
          </button>
        </div>
      )}
    </div>
  );
}
