/**
 * Entrada do laboratório do mascote (dev only).
 * Servida pelo vite dev em /src/mascote/demo.html; não entra no build.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

import '@fontsource/fraunces/latin-600.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';

import '../design/tokens.css';
import '../design/base.css';
import './mascote.css';

import DemoMascote from './DemoMascote';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoMascote />
  </React.StrictMode>,
);
