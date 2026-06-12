import { Ic } from '../icones/Icones';
import { BauRecompensa } from '../coreografia/Coreografias';
import { tocar } from '../som/som';
import { FALAS } from './conteudo';

/**
 * Revelacao dos cristais na Trilha (padrao moeda-com-seta do PvZ):
 * aparece uma unica vez, depois da primeira licao da trilha concluida,
 * e o chip do HUD so existe depois deste 1 toque.
 * Coreografia de marco: o bau balanca, abre com pop e revela o cristal.
 */
export function RevelacaoCristais({ cristais, onColetar }: { cristais: number; onColetar: () => void }) {
  return (
    <div className="coleta" role="dialog" aria-modal="true" aria-label="Seus primeiros cristais">
      <div className="coleta-veu" aria-hidden="true" />
      <button type="button" className="coleta-cartao tap app-chrome" onClick={onColetar}>
        <span className="coleta-seta" aria-hidden="true">
          <Ic nome="seta-baixo" size={26} />
        </span>
        <BauRecompensa size={52} aoAbrir={() => tocar('moeda')} />
        <span className="coleta-num">{cristais}</span>
        <span className="coleta-rotulo">cristais</span>
        <span className="coleta-texto">{FALAS.coleta}</span>
      </button>
    </div>
  );
}
