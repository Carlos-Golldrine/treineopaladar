import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');
const root = path.dirname(fileURLToPath(import.meta.url));

const server = await preview({ root, preview: { port: 4401, strictPort: true } });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 892 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { try { localStorage.clear(); } catch {} });
const page = await ctx.newPage();
await page.goto('http://localhost:4401/comecar', { waitUntil: 'networkidle' });

const eventos = await page.evaluate(
  () =>
    new Promise((res) => {
      const hits = [];
      const vistos = new Set();
      const t0 = performance.now();
      const iv = setInterval(() => {
        for (const a of document.getAnimations()) {
          const d = a.effect?.getTiming?.().duration;
          if (d === 140 && !vistos.has(a)) {
            vistos.add(a);
            hits.push(Math.round(performance.now() - t0));
          }
        }
        if (performance.now() - t0 > 13000) {
          clearInterval(iv);
          res(hits);
        }
      }, 40);
    }),
);
console.log('piscadas detectadas (ms desde o load; 2 anims de 140ms por piscada):', JSON.stringify(eventos));

const vivas = await page.evaluate(() =>
  document.getAnimations().map((a) => Math.round(Number(a.effect?.getTiming?.().duration) || -1)),
);
console.log('animacoes vivas no splash idle (duracoes ms):', JSON.stringify(vivas));

await browser.close();
server.httpServer.close();
