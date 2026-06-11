import React, { lazy } from 'react';
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

/* Code-splitting por rota: cada aba carrega sob demanda */
const Trilha = lazy(() => import('./routes/Trilha'));
const Desafio = lazy(() => import('./routes/Desafio'));
const Mesa = lazy(() => import('./routes/Mesa'));
const Perfil = lazy(() => import('./routes/Perfil'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Trilha /> },
      { path: 'desafio', element: <Desafio /> },
      { path: 'mesa', element: <Mesa /> },
      { path: 'perfil', element: <Perfil /> },
    ],
  },
]);

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
