/**
 * Mascote Tchin: duas tacas brindando, SVG proprietario flat
 * (porte melhorado do TchinDuo do legacy do Tchin Tchin).
 * Regra do ruido: o mascote so aparece para ensinar ou celebrar,
 * sempre com fala de no maximo 8 palavras.
 */

export function TchinDuo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Taca da esquerda, inclinada para o brinde */}
      <g transform="rotate(-12 22 34)">
        <path
          d="M15 17 C15 26 17.5 31.5 22 33.4 C26.5 31.5 29 26 29 17 Z"
          fill="var(--wine-700)"
        />
        <path
          d="M14 14 H30 C30 25 27 32 22 34 C17 32 14 25 14 14 Z"
          stroke="var(--wine-900)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <line x1="22" y1="34" x2="22" y2="45" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16.5 47.5 Q22 45 27.5 47.5" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Taca da direita */}
      <g transform="rotate(12 42 34)">
        <path
          d="M35 17 C35 26 37.5 31.5 42 33.4 C46.5 31.5 49 26 49 17 Z"
          fill="var(--wine-700)"
        />
        <path
          d="M34 14 H50 C50 25 47 32 42 34 C37 32 34 25 34 14 Z"
          stroke="var(--wine-900)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <line x1="42" y1="34" x2="42" y2="45" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M36.5 47.5 Q42 45 47.5 47.5" stroke="var(--wine-900)" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      {/* Brilho do vidro (os "olhinhos" do mascote) */}
      <circle cx="26.5" cy="21.5" r="1.6" fill="var(--bg)" />
      <circle cx="37.5" cy="21.5" r="1.6" fill="var(--bg)" />

      {/* Faisca do brinde */}
      <path d="M32 5.5 L33.8 10 L38.5 12 L33.8 14 L32 18.5 L30.2 14 L25.5 12 L30.2 10 Z" fill="var(--gold-500)" />
      <circle cx="24" cy="7" r="1.3" fill="var(--gold-500)" />
      <circle cx="40" cy="7" r="1.3" fill="var(--gold-500)" />
    </svg>
  );
}

/** Balao inline do mascote (reacoes dentro de uma jogada). */
export function MascoteBalao({ texto }: { texto: string }) {
  return (
    <div className="balao app-chrome" role="status">
      <TchinDuo size={48} />
      <p className="balao-texto">{texto}</p>
    </div>
  );
}

/**
 * Toast do mascote (ensino pontual: vidas, loja) ou celebracao curta.
 * `inline` vive na faixa reservada do FTUE (nunca cobre conteudo);
 * `fixo` ancora em position fixed (telas com scroll, caso da Trilha).
 */
export function MascoteToast({
  texto,
  inline,
  fixo,
  onFechar,
}: {
  texto: string;
  inline?: boolean;
  fixo?: boolean;
  onFechar?: () => void;
}) {
  const conteudo = (
    <>
      <TchinDuo size={38} />
      <span className="mtoast-texto">{texto}</span>
    </>
  );
  const classe = inline ? 'mtoast-inline' : fixo ? 'mtoast mtoast-fixa' : 'mtoast';
  return (
    <div className={classe} role="status">
      {onFechar ? (
        <button type="button" className="mtoast-caixa tap app-chrome" onClick={onFechar} aria-label={`${texto} Toque para fechar.`}>
          {conteudo}
        </button>
      ) : (
        <div className="mtoast-caixa app-chrome">{conteudo}</div>
      )}
    </div>
  );
}
