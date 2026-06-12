// Probe: nota de urgencia (trabalho) na trilha + sheet de troca no Perfil
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');
const root = path.dirname(fileURLToPath(import.meta.url));
const server = await preview({ root, preview: { port: 4399, strictPort: true } });
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'msedge' }));
const ctx = await browser.newContext({
  viewport: { width: 412, height: 892 }, deviceScaleFactor: 2, locale: 'pt-BR', isMobile: true, hasTouch: true,
});
await ctx.addInitScript(() => {
  localStorage.setItem('tp.v1', JSON.stringify({ versao: 1, onboardingCompleto: true, objetivo: 'trabalho' }));
  localStorage.setItem('tp.ftue.v1', JSON.stringify({ cristaisColetados: true, lojaVista: true }));
});
const page = await ctx.newPage();
await page.goto('http://localhost:4399/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: '_shots/trilha-trabalho-nota-412x892.png' });
console.log('nota:', (await page.locator('.trilha-nota').innerText()).trim());
console.log('2a unidade:', await page.locator('.unit-locked-titulo').first().innerText());
await page.goto('http://localhost:4399/perfil', { waitUntil: 'networkidle' });
await page.locator('.ajuste-som', { hasText: 'Treinando para' }).click();
await page.waitForSelector('.objetivo-lista', { timeout: 4000 });
await page.waitForTimeout(500);
await page.screenshot({ path: '_shots/perfil-troca-objetivo-412x892.png' });
await page.locator('.objetivo-opcao', { hasText: 'Presentear' }).click();
await page.waitForTimeout(400);
const estado = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')));
console.log('objetivo apos troca:', estado.objetivo);
await page.goto('http://localhost:4399/', { waitUntil: 'networkidle' });
console.log('2a unidade apos troca:', await page.locator('.unit-locked-titulo').first().innerText());
await browser.close();
server.httpServer.close();
