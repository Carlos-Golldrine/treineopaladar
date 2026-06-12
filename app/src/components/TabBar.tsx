import { NavLink } from 'react-router-dom';
import { Ic } from '../icones/Icones';
import type { NomeIcone } from '../icones/Icones';

const tabs: { to: string; end: boolean; label: string; icone: NomeIcone }[] = [
  { to: '/', end: true, label: 'Trilha', icone: 'mapa-trilha' },
  { to: '/desafio', end: false, label: 'Desafio', icone: 'alvo-desafio' },
  { to: '/mesa', end: false, label: 'Mesa', icone: 'mesa' },
];

export function TabBar() {
  return (
    <nav className="tabbar app-chrome" aria-label="Navegação principal">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `tab tap${isActive ? ' tab-active' : ''}`}
        >
          <Ic nome={tab.icone} size={26} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
      <NavLink
        to="/perfil"
        className={({ isActive }) => `tab tap${isActive ? ' tab-active' : ''}`}
      >
        <Ic nome="perfil-taca" size={26} />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}
