import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';
import { DelayedSkeleton } from './DelayedSkeleton';
import { ConvitePwa } from './ConvitePwa';

export function Shell() {
  return (
    <div className="shell">
      <main className="screen">
        <Suspense fallback={<DelayedSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      {/* Convite "Adicionar a tela inicial" (PWA), uma vez pos-onboarding */}
      <ConvitePwa />
    </div>
  );
}
