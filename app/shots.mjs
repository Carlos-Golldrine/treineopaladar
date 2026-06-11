// Sobe o vite preview (exige build feito) e salva screenshots das 4 abas
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

const routes = [
  ['trilha', '/'],
  ['desafio', '/desafio'],
  ['mesa', '/mesa'],
  ['perfil', '/perfil'],
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
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
    locale: 'pt-BR',
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  for (const [name, route] of routes) {
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

await browser.close();
server.httpServer.close();
