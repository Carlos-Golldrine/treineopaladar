/**
 * Balão e toast do mascote, com o MESMO contrato da API atual de
 * onboarding/Mascote.tsx: o integrador só troca o import.
 * Diferença: quem fala agora é o Tchin vivo (rig com máquina de estados),
 * com `estado` opcional para dar a emoção certa à fala.
 */
import { Tchin, type EstadoTchin } from './Tchin';
import './mascote.css';

/** Balão inline do mascote (reações dentro de uma jogada). */
export function MascoteBalao({ texto, estado = 'ensina' }: { texto: string; estado?: EstadoTchin }) {
  return (
    <div className="tchin-balao app-chrome" role="status">
      <Tchin estado={estado} tamanho={46} />
      <p className="tchin-balao-texto">{texto}</p>
    </div>
  );
}

/**
 * Toast do mascote (ensino pontual: vidas, loja) ou celebração curta.
 * `inline` vive na faixa reservada do FTUE (nunca cobre conteúdo);
 * `fixo` ancora em position fixed (telas com scroll, caso da Trilha).
 */
export function MascoteToast({
  texto,
  inline,
  fixo,
  onFechar,
  estado = 'ensina',
}: {
  texto: string;
  inline?: boolean;
  fixo?: boolean;
  onFechar?: () => void;
  estado?: EstadoTchin;
}) {
  const conteudo = (
    <>
      <Tchin estado={estado} tamanho={36} />
      <span className="tchin-mtoast-texto">{texto}</span>
    </>
  );
  const classe = inline ? 'tchin-mtoast-inline' : fixo ? 'tchin-mtoast tchin-mtoast-fixa' : 'tchin-mtoast';
  return (
    <div className={classe} role="status">
      {onFechar ? (
        <button
          type="button"
          className="tchin-mtoast-caixa tap app-chrome"
          onClick={onFechar}
          aria-label={`${texto} Toque para fechar.`}
        >
          {conteudo}
        </button>
      ) : (
        <div className="tchin-mtoast-caixa app-chrome">{conteudo}</div>
      )}
    </div>
  );
}
