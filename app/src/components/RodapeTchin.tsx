import { LogoTchin } from '../icones/LogoTchin';
import './rodape-tchin.css';

/**
 * Rodape da marca-mae: link "by Tchin Tchin" no FIM de cada secao (fora dos hubs
 * de botao, com folga acima, para evitar toque acidental). Abre o app Tchin Tchin
 * pelo OneLink, em nova aba.
 */
const ONELINK_TCHIN = 'https://tchintchin.onelink.me/hMod/la3wazcr';

export function RodapeTchin() {
  return (
    <a
      className="rodape-tchin"
      href={ONELINK_TCHIN}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conheça o Tchin Tchin (abre em nova aba). Versão beta."
    >
      <LogoTchin size={14} className="rodape-tchin-logo" />
      <span className="rodape-tchin-by">by Tchin Tchin</span>
      <span className="chip-beta">Beta</span>
    </a>
  );
}
