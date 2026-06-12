/**
 * Slot UNICO da logo da marca-mae Tchin Tchin no app (BRIEF-DESIGN.md secao 7,
 * item 8: lockup "by Tchin Tchin" no splash e no Perfil).
 *
 * Asset OFICIAL desde 12/jun/2026: processado de `logo/logo_tchin.jpg`
 * (anexada pelo Gabriel) por `scripts/processar_logo.py`, que gera
 * `/marca/logo-tchin-glifo.png` (so as tacas, fundo transparente) e
 * `/marca/logo-tchin.png` (lockup completo com o wordmark Tchin).
 * Para retrocar o asset, rode o script de novo; nenhum chamador muda.
 */

type LogoTchinProps = {
  size?: number;
  /** Quando presente, vira imagem acessivel; sem label, e decorativa */
  label?: string;
  className?: string;
  /** "glifo" (tacas, default) ou "completa" (tacas + wordmark Tchin) */
  variante?: 'glifo' | 'completa';
};

const PROPORCAO = { glifo: 349 / 433, completa: 400 / 641 } as const;

export function LogoTchin({ size = 24, label, className, variante = 'glifo' }: LogoTchinProps) {
  const src = variante === 'completa' ? '/marca/logo-tchin.png' : '/marca/logo-tchin-glifo.png';
  return (
    <span
      className={className ? `logo-tchin ${className}` : 'logo-tchin'}
      style={{
        display: 'inline-flex',
        flex: 'none',
        width: Math.round(size * PROPORCAO[variante]),
        height: size,
      }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <img
        src={src}
        alt=""
        width="100%"
        height="100%"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
    </span>
  );
}
