// Sobe o vite preview (exige build feito) e salva screenshots das telas
// em 412x892 e 360x800 dentro de _shots/.
// Uso: npm run build && node shots.mjs
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(root, '_shots');
mkdirSync(shotsDir, { recursive: true });

const PORT = 4173;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });

/* Seeds de localStorage por grupo de cenas:
   - ftue: store limpo (1a visita real, onboardingCompleto=false)
   - app: onboarding concluido + cristais ja coletados (telas do dia a dia)
   - coleta: 1a licao da trilha feita, cristais ainda nao coletados */
const SEED_APP = {
  estado: JSON.stringify({ versao: 1, onboardingCompleto: true }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true }),
};
const SEED_COLETA = {
  estado: JSON.stringify({
    versao: 1,
    onboardingCompleto: true,
    progresso: {
      'u1-l1': {
        coroas: 1,
        vezesConcluida: 1,
        ultimaConclusao: Date.now(),
        proximaRevisao: null,
        errosPendentes: [],
      },
    },
    wallet: { cristais: 67, xpTotal: 45 },
  }),
  flags: JSON.stringify({ cristaisColetados: false, lojaVista: true }),
};

const grupos = [
  {
    seed: null,
    routes: [
      // Fluxo FTUE: splash + cenas da Licao 1
      ['splash', '/comecar'],
      ['licao1-j1', '/licao-1?cena=j1'],
      ['licao1-j3', '/licao-1?cena=j3'],
      ['licao1-erro', '/licao-1?cena=erro'],
      ['licao1-conclusao', '/licao-1?cena=conclusao'],
      ['licao1-softwall', '/licao-1?cena=softwall'],
    ],
  },
  {
    seed: SEED_APP,
    routes: [
      ['trilha', '/'],
      ['desafio', '/desafio'],
      ['mesa', '/mesa'],
      ['perfil', '/perfil'],
      // Player de licao: cenas demo por tipo de exercicio + feedback de erro + conclusao
      ['licao-mc', '/licao/u1-l1?cena=mc'],
      ['licao-mc-erro', '/licao/u1-l1?cena=mc&estado=erro'],
      ['licao-swipe', '/licao/u1-l1?cena=swipe'],
      ['licao-slider', '/licao/u1-l1?cena=slider'],
      ['licao-ordenar', '/licao/u1-l3?cena=ordenar'],
      ['licao-intruso', '/licao/u1-l1?cena=intruso'],
      ['licao-duasverdades', '/licao/u1-l1?cena=duasverdades'],
      ['licao-conclusao', '/licao/u1-l1?cena=conclusao'],
    ],
  },
  {
    seed: SEED_COLETA,
    routes: [['trilha-coleta', '/']],
  },
];

const viewports = [
  { width: 412, height: 892 },
  { width: 360, height: 800 },
];

let browser;
try {
  browser = await chromium.launch();
} catch {
  // Fallback: canal do navegador instalado no Windows
  browser = await chromium.launch({ channel: 'msedge' });
}

for (const vp of viewports) {
  for (const grupo of grupos) {
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: 2,
      locale: 'pt-BR',
      isMobile: true,
      hasTouch: true,
    });
    if (grupo.seed) {
      await ctx.addInitScript((seed) => {
        try {
          localStorage.setItem('tp.v1', seed.estado);
          localStorage.setItem('tp.ftue.v1', seed.flags);
        } catch {
          /* sem localStorage */
        }
      }, grupo.seed);
    } else {
      await ctx.addInitScript(() => {
        try {
          localStorage.clear();
        } catch {
          /* sem localStorage */
        }
      });
    }
    const page = await ctx.newPage();
    for (const [name, route] of grupo.routes) {
      await page
        .goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' })
        .catch(() => {});
      await page.waitForTimeout(900);
      const file = path.join(shotsDir, `${name}-${vp.width}x${vp.height}.png`);
      await page.screenshot({ path: file });
      console.log('shot', path.basename(file));
    }
    await ctx.close();
  }
}

await browser.close();
server.httpServer.close();
