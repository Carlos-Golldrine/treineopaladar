// Rajada de frames do mascote vivo (review de motion, item 7 do delight
// checklist): 5 frames com 300ms entre eles por estado + a micro-cena.
// Frames idênticos = mascote morto = reprovado.
// Uso: node src/mascote/capturas.mjs   (a partir de app/)
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = path.join(root, '_shots', 'mascote');
mkdirSync(outDir, { recursive: true });

const PORT = 4317;
const server = await createServer({
  root,
  server: { port: PORT, strictPort: true },
  logLevel: 'error',
});
await server.listen();

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}

const ctx = await browser.newContext({
  viewport: { width: 412, height: 892 },
  deviceScaleFactor: 1,
  locale: 'pt-BR',
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.emulateMedia({ reducedMotion: 'no-preference' });

const base = `http://localhost:${PORT}/src/mascote/demo.html`;
const estados = ['idle', 'feliz', 'lamenta', 'ensina', 'celebra', 'surpreso'];

for (const estado of estados) {
  await page.goto(`${base}?estado=${estado}&rajada=1`, { waitUntil: 'load' });
  await page.waitForSelector('#palco svg');
  await page.waitForTimeout(300);
  const palco = page.locator('#palco');
  for (let f = 1; f <= 5; f++) {
    await palco.screenshot({ path: path.join(outDir, `${estado}-f${f}.png`) });
    if (f < 5) await page.waitForTimeout(300);
  }
  console.log('rajada', estado);
}

/* Micro-cena: frames mais espaçados para ver os passos do roteiro */
await page.goto(`${base}?cena=1`, { waitUntil: 'load' });
await page.waitForSelector('#cena svg');
await page.waitForTimeout(300);
const cena = page.locator('#cena');
for (let f = 1; f <= 6; f++) {
  await cena.screenshot({ path: path.join(outDir, `cena-f${f}.png`) });
  if (f < 6) await page.waitForTimeout(900);
}
console.log('rajada cena');

await browser.close();
await server.close();
