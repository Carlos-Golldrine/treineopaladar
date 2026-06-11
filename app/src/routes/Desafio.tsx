import { useEffect, useState } from 'react';
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

/** Ms ate a proxima meia-noite de Brasilia (reset oficial do Desafio do Dia). */
function msAteMeiaNoiteBrasilia(agora: number): number {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(agora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  const decorrido = (((valor('hour') % 24) * 60 + valor('minute')) * 60 + valor('second')) * 1000 + (agora % 1000);
  return 24 * 3600 * 1000 - decorrido;
}

function formatarContagem(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

export default function Desafio() {
  const [restante, setRestante] = useState(() => msAteMeiaNoiteBrasilia(Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => setRestante(msAteMeiaNoiteBrasilia(Date.now())), 1000);
    return () => window.clearInterval(id);
  }, []);

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
        <p className="daily-count" aria-live="off">
          {formatarContagem(restante)}
        </p>
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
