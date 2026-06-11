import { Icon } from '../components/Icon';

import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import heartIcon from '@material-symbols/svg-500/rounded/favorite-fill.svg?raw';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';
import checkIcon from '@material-symbols/svg-500/rounded/check.svg?raw';
import lockIcon from '@material-symbols/svg-500/rounded/lock-fill.svg?raw';
import wineIcon from '@material-symbols/svg-500/rounded/wine_bar-fill.svg?raw';

import './trilha.css';

const lockedLessons = [
  'Tanino sem medo',
  'Corpo leve, corpo cheio',
  'Checkpoint da unidade',
];

export default function Trilha() {
  return (
    <>
      <header className="hud app-chrome">
        <div className="hud-chip hud-streak" aria-label="Sequência de 1 dia">
          <Icon svg={fireIcon} size={18} />
          <span className="hud-value">1</span>
        </div>
        <div className="hud-chip hud-lives" aria-label="5 vidas">
          <Icon svg={heartIcon} size={18} />
          <span className="hud-value">5</span>
        </div>
        <div className="hud-chip hud-gems" aria-label="65 cristais">
          <Icon svg={diamondIcon} size={18} />
          <span className="hud-value">65</span>
        </div>
      </header>

      <section className="unit-card" aria-label="Unidade atual">
        <p className="unit-eyebrow">Unidade 1</p>
        <h1 className="unit-title">Fundamentos do Paladar</h1>
        <p className="unit-desc">
          Doçura, acidez, tanino e corpo. A base para escolher com confiança.
        </p>
        <div className="unit-progress">
          <div
            className="unit-bar"
            role="progressbar"
            aria-valuenow={1}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-label="1 de 5 lições concluídas"
          >
            <div className="unit-bar-fill" />
          </div>
          <span className="unit-count">1/5</span>
        </div>
      </section>

      <ol className="trail" aria-label="Lições da unidade">
        <li className="trail-item done">
          <div className="node node-done">
            <Icon svg={checkIcon} size={28} label="Lição concluída" />
          </div>
          <span className="node-label">Doce ou seco</span>
        </li>

        <li className="trail-item current reached">
          <button
            type="button"
            className="node node-current tap"
            aria-label="Começar a lição Acidez, a água na boca"
          >
            <span className="start-pill" aria-hidden="true">
              Começar
            </span>
            <Icon svg={wineIcon} size={34} />
          </button>
          <span className="node-label">Acidez, a água na boca</span>
        </li>

        {lockedLessons.map((name) => (
          <li className="trail-item locked" key={name}>
            <div className="node node-locked">
              <Icon svg={lockIcon} size={26} label="Lição bloqueada" />
            </div>
            <span className="node-label">{name}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
