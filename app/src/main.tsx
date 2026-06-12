import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

/* Fontes self-hosted, latin subset, font-display: swap */
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/latin-600-italic.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-500.css';

import './design/tokens.css';
import './design/base.css';
import './app.css';

import { Shell } from './components/Shell';

/* Onboarding FTUE no bundle principal: do toque em "Começar" à primeira
   pergunta da Lição 1 em menos de 10s, mesmo em rede ruim */
import Splash from './onboarding/Splash';
import LicaoUm from './onboarding/Licao1';
import { PortaoOnboarding } from './onboarding/Portao';

/* Code-splitting por rota: cada aba carrega sob demanda */
const Trilha = lazy(() => import('./routes/Trilha'));
const Desafio = lazy(() => import('./routes/Desafio'));
const Mesa = lazy(() => import('./routes/Mesa'));
const Perfil = lazy(() => import('./routes/Perfil'));
const Pratica = lazy(() => import('./routes/Pratica'));

const router = createBrowserRouter([
  {
    path: '/',
    /* 1a visita (onboardingCompleto=false) vai ao splash; depois, Trilha direto */
    element: (
      <PortaoOnboarding>
        <Shell />
      </PortaoOnboarding>
    ),
    children: [
      { index: true, element: <Trilha /> },
      { path: 'desafio', element: <Desafio /> },
      { path: 'mesa', element: <Mesa /> },
      { path: 'perfil', element: <Perfil /> },
    ],
  },
  {
    /* Splash unico do FTUE: logo, 1 frase, 1 botao */
    path: '/comecar',
    element: <Splash />,
  },
  {
    /* Licao 1 = o tutorial que nao se chama tutorial (7 jogadas) */
    path: '/licao-1',
    element: <LicaoUm />,
  },
  {
    /* Player em tela cheia, fora do Shell (sem tab bar durante a licao).
       Lazy DE ROTA (nao React.lazy): o router espera o chunk antes de
       trocar a tela, e a View Transition do no da trilha captura a licao
       pronta (morph do circulo), nunca um fallback vazio. */
    path: '/licao/:id',
    lazy: async () => ({ Component: (await import('./licao/Player')).default }),
  },
  {
    /* Pratica livre em tela cheia: drill do banco da fabrica, sem vidas */
    path: '/pratica',
    element: (
      <Suspense fallback={null}>
        <Pratica />
      </Suspense>
    ),
  },
  /* Laboratorio do mascote, so no dev server */
  ...(import.meta.env.DEV
    ? [
        {
          path: '/mascote',
          lazy: async () => ({ Component: (await import('./mascote/DemoMascote')).default }),
        },
      ]
    : []),
]);

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
