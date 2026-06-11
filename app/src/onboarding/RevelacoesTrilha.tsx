import { Icon } from '../components/Icon';
import diamondIcon from '@material-symbols/svg-500/rounded/diamond-fill.svg?raw';
import arrowIcon from '@material-symbols/svg-500/rounded/arrow_downward.svg?raw';
import { FALAS } from './conteudo';

/**
 * Revelacao dos cristais na Trilha (padrao moeda-com-seta do PvZ):
 * aparece uma unica vez, depois da primeira licao da trilha concluida,
 * e o chip do HUD so existe depois deste 1 toque.
 */
export function RevelacaoCristais({ cristais, onColetar }: { cristais: number; onColetar: () => void }) {
  return (
    <div className="coleta" role="dialog" aria-modal="true" aria-label="Seus primeiros cristais">
      <div className="coleta-veu" aria-hidden="true" />
      <button type="button" className="coleta-cartao tap app-chrome" onClick={onColetar}>
        <span className="coleta-seta" aria-hidden="true">
          <Icon svg={arrowIcon} size={26} />
        </span>
        <Icon svg={diamondIcon} size={48} className="coleta-cristal" />
        <span className="coleta-num">{cristais}</span>
        <span className="coleta-rotulo">cristais</span>
        <span className="coleta-texto">{FALAS.coleta}</span>
      </button>
    </div>
  );
}
