import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import { TourGuiado } from './TourGuiado';
import { DelayedSkeleton } from './DelayedSkeleton';
import { telaVista } from '../lib/analytics';

export function Shell() {
  const { pathname } = useLocation();
  /* Jornada: marca cada troca de aba (Inicio/Trilha/Desafio/Mesa/Perfil). */
  useEffect(() => {
    telaVista(pathname);
  }, [pathname]);

  return (
    <div className="shell">
      <main className="screen">
        <Suspense fallback={<DelayedSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <TourGuiado />
    </div>
  );
}
