import { Icon } from '../components/Icon';

import tableIcon from '@material-symbols/svg-500/rounded/table_restaurant.svg?raw';

import './mesa.css';

export default function Mesa() {
  return (
    <>
      <header className="screen-header app-chrome">
        <h1 className="screen-title">Mesa</h1>
        <p className="screen-sub">Degustação em boa companhia</p>
      </header>

      <section className="mesa-empty" aria-label="Mesa ainda fechada">
        <div className="mesa-art">
          <Icon svg={tableIcon} size={44} />
        </div>
        <h2 className="mesa-title">Sua mesa abre na próxima semana</h2>
        <p className="mesa-copy">
          Convide alguém para sentar com você. Toda semana, até 20 pessoas do
          seu ritmo treinam juntas: mesmo desafio, mesma degustação.
        </p>
        <button type="button" className="btn btn-primary tap" disabled>
          Convidar para a mesa
        </button>
        <p className="mesa-note">Convites abrem junto com a primeira liga.</p>
      </section>
    </>
  );
}
