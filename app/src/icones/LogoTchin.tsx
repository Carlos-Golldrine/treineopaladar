/**
 * ============================================================================
 * PROVISORIO: substituir pela logo oficial quando o Gabriel anexar a pasta.
 * ============================================================================
 * Slot UNICO da logo da marca-mae Tchin Tchin no app (BRIEF-DESIGN.md secao 7,
 * item 8: lockup "by Tchin Tchin" no splash e no Perfil).
 *
 * Asset atual: porte fiel do simbolo `tt-glasses` (duas tacas brindando) do
 * protótipo tchin-social-v2 (`_tchin.js`). Quando a logo oficial chegar,
 * trocar SOMENTE o miolo do <svg> mantendo viewBox 0 0 24 24 e as props:
 * nenhum chamador precisa mudar.
 */

type LogoTchinProps = {
  size?: number;
  /** Quando presente, vira imagem acessivel; sem label, e decorativa */
  label?: string;
  className?: string;
};

export function LogoTchin({ size = 24, label, className }: LogoTchinProps) {
  return (
    <span
      className={className ? `logo-tchin ${className}` : 'logo-tchin'}
      style={{ display: 'inline-flex', flex: 'none', width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* >>> PROVISORIO (tt-glasses do tchin-social-v2): trocar este miolo <<< */}
        <path
          d="M5 3 L11 4 L9.6 11 Q9 13.4 6.6 13.4 Q4.2 13.4 3.8 11 Z"
          fill="currentColor"
          opacity=".92"
        />
        <path
          d="M6.6 13.4 L6.6 20 M3.8 20.5 L9.4 20.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M19 3 L13 4 L14.4 11 Q15 13.4 17.4 13.4 Q19.8 13.4 20.2 11 Z"
          fill="currentColor"
          opacity=".92"
        />
        <path
          d="M17.4 13.4 L17.4 20 M14.6 20.5 L20.2 20.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* >>> fim do asset provisorio <<< */}
      </svg>
    </span>
  );
}
