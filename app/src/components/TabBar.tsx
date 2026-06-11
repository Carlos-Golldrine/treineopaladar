import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

import routeIcon from '@material-symbols/svg-500/rounded/route.svg?raw';
import routeFill from '@material-symbols/svg-500/rounded/route-fill.svg?raw';
import targetIcon from '@material-symbols/svg-500/rounded/target.svg?raw';
import targetFill from '@material-symbols/svg-500/rounded/target-fill.svg?raw';
import tableIcon from '@material-symbols/svg-500/rounded/table_restaurant.svg?raw';
import tableFill from '@material-symbols/svg-500/rounded/table_restaurant-fill.svg?raw';

const tabs = [
  { to: '/', end: true, label: 'Trilha', icon: routeIcon, iconActive: routeFill },
  { to: '/desafio', end: false, label: 'Desafio', icon: targetIcon, iconActive: targetFill },
  { to: '/mesa', end: false, label: 'Mesa', icon: tableIcon, iconActive: tableFill },
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
          {({ isActive }) => (
            <>
              <Icon svg={isActive ? tab.iconActive : tab.icon} size={26} />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
      <NavLink
        to="/perfil"
        className={({ isActive }) => `tab tap${isActive ? ' tab-active' : ''}`}
      >
        <span className="tab-avatar" aria-hidden="true">
          V
        </span>
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}
