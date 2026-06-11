import { Icon } from '../components/Icon';
import { MascoteBalao } from './Mascote';

/**
 * Interstitials da Licao 1 que parecem jogada: J3 (objetivo) e J6 (nivel).
 * Cartas grandes, resposta de 1 toque, mascote reagindo quando ha payoff.
 */

export interface CartaUi {
  id: string;
  rotulo: string;
  /** Icone SVG bruto (Material Symbols Rounded), opcional. */
  svg?: string;
  /** 1 a 3: pontinhos de nivel, opcional. */
  pontos?: number;
}

interface Props {
  pergunta: string;
  sub?: string;
  cartas: CartaUi[];
  selecionada: string | null;
  /** Fala do mascote apos a escolha (max 8 palavras). */
  reacao: string | null;
  onEscolher: (id: string) => void;
  /** Quando presente, mostra o botao Continuar apos a escolha (J3). */
  onContinuar?: () => void;
}

export function CartasEscolha({ pergunta, sub, cartas, selecionada, reacao, onEscolher, onContinuar }: Props) {
  return (
    <div className="ex">
      <h2 className="ex-pergunta">{pergunta}</h2>
      {sub && <p className="ex-dica">{sub}</p>}
      <div className="ex-opcoes" role="group" aria-label="Opções">
        {cartas.map((carta, i) => (
          <button
            key={carta.id}
            type="button"
            className={`opcao carta-grande tap entra${selecionada === carta.id ? ' opcao-sel' : ''}`}
            style={{ animationDelay: `${i * 50}ms` }}
            aria-pressed={selecionada === carta.id}
            onClick={() => onEscolher(carta.id)}
          >
            {carta.svg && (
              <span className="carta-icone">
                <Icon svg={carta.svg} size={22} />
              </span>
            )}
            {carta.pontos !== undefined && (
              <span className="carta-pontos" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <span key={n} className={`carta-ponto${n <= (carta.pontos ?? 0) ? ' carta-ponto-on' : ''}`} />
                ))}
              </span>
            )}
            <span className="carta-rotulo">{carta.rotulo}</span>
          </button>
        ))}
      </div>
      {reacao && <MascoteBalao texto={reacao} />}
      {onContinuar && selecionada && (
        <div className="ex-rodape">
          <button type="button" className="btn btn-primary btn-cheio tap" onClick={onContinuar}>
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
