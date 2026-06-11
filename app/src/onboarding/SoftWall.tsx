import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import boltIcon from '@material-symbols/svg-500/rounded/bolt-fill.svg?raw';
import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import wineIcon from '@material-symbols/svg-500/rounded/wine_bar-fill.svg?raw';

/**
 * Soft wall de cadastro (fase 3 do blueprint): so depois do aha.
 * Mostra o que a pessoa ja construiu, convida a salvar e oferece um
 * "Depois" discreto e neutro. Nunca palavras como descartar ou perder.
 * Cadastro real chega com o Supabase: por ora, stub elegante.
 */
interface Props {
  xp: number;
  onTrilha: () => void;
}

export function SoftWall({ xp, onTrilha }: Props) {
  const [stub, setStub] = useState(false);

  return (
    <div className="player wall">
      <div className="wall-conteudo">
        <p className="conclusao-eyebrow">Seu primeiro dia</p>
        <h1 className="wall-titulo">Salve seu progresso</h1>
        <p className="wall-sub">Olha o que você já construiu hoje:</p>
        <ul className="wall-lista">
          <li>
            <span className="wall-icone wall-icone-xp">
              <Icon svg={boltIcon} size={20} />
            </span>
            <span>
              <strong className="wall-mono">+{xp} XP</strong> no seu placar de treino
            </span>
          </li>
          <li>
            <span className="wall-icone wall-icone-streak">
              <Icon svg={fireIcon} size={20} />
            </span>
            <span>
              Sequência de <strong>1 dia</strong> acesa
            </span>
          </li>
          <li>
            <span className="wall-icone wall-icone-trilha">
              <Icon svg={wineIcon} size={20} />
            </span>
            <span>Trilha do paladar aberta, Lição 2 esperando</span>
          </li>
        </ul>
      </div>

      <footer className="wall-acoes">
        <button type="button" className="btn btn-primary btn-cheio tap" onClick={() => setStub(true)}>
          Criar conta
        </button>
        <button type="button" className="btn btn-depois tap" onClick={onTrilha}>
          Depois
        </button>
      </footer>

      {stub && (
        <Sheet titulo="Contas abrem em breve" onFechar={() => setStub(false)}>
          <p className="folha-texto">
            Contas abrem na próxima versão do beta. Seu progresso está guardado neste aparelho.
          </p>
          <button type="button" className="btn btn-primary btn-cheio tap" onClick={onTrilha}>
            Seguir treinando
          </button>
        </Sheet>
      )}
    </div>
  );
}
