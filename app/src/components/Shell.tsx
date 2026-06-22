import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TabBar } from './TabBar';
import { TourGuiado } from './TourGuiado';
import { DelayedSkeleton } from './DelayedSkeleton';
import { telaVista } from '../lib/analytics';

/* Ordem das abas (igual a TabBar) pra dar DIRECAO ao deslize entre telas. */
const ORDEM_ABAS = ['/', '/trilha', '/desafio', '/mesa', '/perfil'];
function indiceAba(pathname: string): number {
  let idx = 0;
  let maior = -1;
  ORDEM_ABAS.forEach((p, i) => {
    const bate = p === '/' ? pathname === '/' : pathname.startsWith(p);
    if (bate && p.length > maior) {
      maior = p.length;
      idx = i;
    }
  });
  return idx;
}

export function Shell() {
  const { pathname } = useLocation();
  /* Direcao do deslize: avancar nas abas entra pela direita; voltar, pela esquerda. */
  const atual = indiceAba(pathname);
  const anterior = useRef(atual);
  const dir = atual >= anterior.current ? 'tela-dir' : 'tela-esq';

  useEffect(() => {
    anterior.current = atual;
  }, [atual]);
  /* Jornada: marca cada troca de aba (Inicio/Trilha/Desafio/Mesa/Perfil). */
  useEffect(() => {
    telaVista(pathname);
  }, [pathname]);

  return (
    <div className="shell">
      <main className="screen">
        {/* key=pathname remonta a tela -> a nova desliza ao entrar (so transform/opacity) */}
        <div className={`tela-anim ${dir}`} key={pathname}>
          <Suspense fallback={<DelayedSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <TabBar />
      <TourGuiado />
    </div>
  );
}
