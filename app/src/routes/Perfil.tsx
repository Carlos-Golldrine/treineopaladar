import { Icon } from '../components/Icon';

import fireIcon from '@material-symbols/svg-500/rounded/local_fire_department-fill.svg?raw';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';

import './perfil.css';

const dimensions = ['Acidez', 'Tanino', 'Corpo', 'Frutado', 'Doçura'];

export default function Perfil() {
  return (
    <>
      <header className="profile-head app-chrome">
        <div className="profile-avatar" aria-hidden="true">
          V
        </div>
        <h1 className="profile-name">Visitante</h1>
        <p className="profile-sub">Treinando desde hoje</p>
        <div className="profile-stats">
          <div className="stat-chip" aria-label="Sequência de 1 dia">
            <Icon svg={fireIcon} size={16} className="stat-fire" />
            <span className="stat-value">1</span>
          </div>
          <div className="stat-chip" aria-label="65 cristais">
            <Icon svg={diamondIcon} size={16} className="stat-gem" />
            <span className="stat-value">65</span>
          </div>
          <div className="stat-chip" aria-label="80 pontos de experiência">
            <span className="stat-value">80 XP</span>
          </div>
        </div>
      </header>

      <section className="score-card" aria-label="Score de Paladar">
        <h2 className="score-title">Score de Paladar</h2>
        <p className="score-sub">
          Cinco dimensões, de 0 a 1000. Cada acerto treina uma delas.
        </p>
        <div className="score-rows">
          {dimensions.map((name) => (
            <div className="score-row" key={name}>
              <span className="score-name">{name}</span>
              <div
                className="score-bar"
                role="progressbar"
                aria-valuenow={0}
                aria-valuemin={0}
                aria-valuemax={1000}
                aria-label={`${name}: 0 de 1000`}
              >
                <div className="score-bar-fill" />
              </div>
              <span className="score-value">0</span>
            </div>
          ))}
        </div>
        <p className="score-note">
          Seu score nasce nas primeiras lições. Continue treinando.
        </p>
      </section>

      <section className="save-cta">
        <button type="button" className="btn btn-outline tap">
          Salvar meu progresso
        </button>
        <p className="save-note">
          Por enquanto, seu treino fica só neste aparelho. Criar conta leva
          menos de um minuto.
        </p>
      </section>
    </>
  );
}
