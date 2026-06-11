import { Icon } from '../components/Icon';

import scheduleIcon from '@material-symbols/svg-500/rounded/schedule-fill.svg?raw';
import wineIcon from '@material-symbols/svg-500/rounded/wine_bar-fill.svg?raw';
import targetIcon from '@material-symbols/svg-500/rounded/target.svg?raw';
import tableIcon from '@material-symbols/svg-500/rounded/table_restaurant.svg?raw';

import './desafio.css';

const steps = [
  { icon: wineIcon, text: 'Um rótulo real por dia, o mesmo para todo mundo.' },
  { icon: targetIcon, text: 'Quatro perguntas rápidas sobre ele.' },
  { icon: tableIcon, text: 'Compare seu resultado com a sua mesa, sem spoiler.' },
];

export default function Desafio() {
  return (
    <>
      <header className="screen-header app-chrome">
        <h1 className="screen-title">Desafio do Dia</h1>
        <p className="screen-sub">Um por dia, à meia-noite. Para todo mundo.</p>
      </header>

      <section className="daily-card" aria-label="Desafio de hoje, ainda fechado">
        <div className="daily-badge">
          <Icon svg={scheduleIcon} size={32} />
        </div>
        <h2 className="daily-title">O desafio de hoje abre em breve</h2>
        <p className="daily-copy">
          Estamos preparando o primeiro rótulo. Vale a pena esperar.
        </p>
        <p className="daily-count-label">Abre em</p>
        <p className="daily-count">07:42:19</p>
      </section>

      <section className="how" aria-label="Como funciona">
        <h3 className="how-title">Como funciona</h3>
        {steps.map((step) => (
          <div className="how-row" key={step.text}>
            <span className="how-icon">
              <Icon svg={step.icon} size={20} />
            </span>
            <p>{step.text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
