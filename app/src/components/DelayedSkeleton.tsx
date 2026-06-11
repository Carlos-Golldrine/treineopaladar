import { useEffect, useState } from 'react';

/**
 * Skeleton que so aparece apos 300ms: em conexao boa a tela
 * carrega antes e nada pisca (BRIEF-DESIGN.md secao 4, item 12).
 */
export function DelayedSkeleton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 300);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) {
    return <div className="skeleton-slot" aria-hidden="true" />;
  }

  return (
    <div className="skeleton-slot" aria-hidden="true">
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
    </div>
  );
}
