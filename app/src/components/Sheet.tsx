import type { ReactNode } from 'react';

/**
 * Bottom sheet simples: veu + painel ancorado embaixo, fecha no fundo
 * ou no botao. Animacao so transform/opacity.
 */
export function Sheet({
  titulo,
  onFechar,
  children,
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  return (
    <div className="folha" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" className="folha-fundo" aria-label="Fechar" onClick={onFechar} />
      <div className="folha-painel app-chrome">
        <div className="folha-alca" aria-hidden="true" />
        <h2 className="folha-titulo">{titulo}</h2>
        <div className="folha-conteudo">{children}</div>
        <button type="button" className="btn btn-outline folha-fechar tap" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}
