import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useProgresso } from '../engine';

/**
 * Roteamento da primeira visita: enquanto o onboarding nao foi
 * concluido, qualquer aba do Shell leva ao splash. Depois disso,
 * a Trilha abre direto.
 */
export function PortaoOnboarding({ children }: { children: ReactNode }) {
  const { onboardingCompleto } = useProgresso();
  if (!onboardingCompleto) return <Navigate to="/comecar" replace />;
  return <>{children}</>;
}
