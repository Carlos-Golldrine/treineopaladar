/* Gera os prints do app pro guia (docs/img/), via Edge do sistema (sem baixar navegador).
   Uso: npm run build && node prints.mjs [CODIGO_SALA]
   Telas principais via preview local com localStorage semeado (pula gate de termos e
   onboarding). A Sala usa o fluxo real de entrar pelo codigo (sala criada antes). */
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(root, '..', 'docs', 'img');
mkdirSync(outDir, { recursive: true });

const SALA_CODE = (process.argv[2] || '').toUpperCase();
const PORT = 4188;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });
const BASE = `http://localhost:${PORT}`;

/* Semente: termos aceitos + onboarding concluido + carteira com progresso (telas "cheias"). */
const SEED_APP = {
  estado: JSON.stringify({
    versao: 1,
    onboardingCompleto: true,
    objetivo: 'mercado',
    wallet: { cristais: 230, xpTotal: 320, streak: 4, bestStreak: 4 },
  }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true, tourFeito: true }),
};

const browser = await chromium.launch({ channel: 'msedge' });

async function novaPagina(seedApp) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    serviceWorkers: 'block', // sem SW: cada goto navega de verdade (senao serve o index cacheado)
  });
  await ctx.addInitScript((s) => {
    try {
      localStorage.setItem('tp.termos.v1', '1'); // pula o gate de consentimento
      if (s) {
        localStorage.setItem('tp.v1', s.estado);
        localStorage.setItem('tp.ftue.v1', s.flags);
      } else {
        localStorage.removeItem('tp.v1');
        localStorage.removeItem('tp.ftue.v1');
      }
    } catch {
      /* sem storage */
    }
  }, seedApp);
  return ctx;
}

async function tira(page, route, nome, espera = 1100) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(espera);
  // mata animacoes residuais pra nao pegar frame no meio
  await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => {});
  await page.waitForTimeout(150);
  const file = path.join(outDir, `${nome}.png`);
  await page.screenshot({ path: file });
  console.log('print', nome);
}

try {
  // ---- Onboarding (sem seed de app: cai no splash) ----
  let ctx = await novaPagina(null);
  let page = await ctx.newPage();
  await tira(page, '/comecar', '01-abertura');
  await ctx.close();

  // ---- Telas do dia a dia (com seed) ----
  ctx = await novaPagina(SEED_APP);
  page = await ctx.newPage();
  await tira(page, '/', '02-trilha');
  await tira(page, '/licao/u1-l1?cena=mc', '03-licao');
  await tira(page, '/licao/u1-l1?cena=conclusao', '04-conclusao', 1400);
  await tira(page, '/desafio', '05-desafio');
  await tira(page, '/mesa', '06-mesa');
  await tira(page, '/perfil', '07-perfil');
  await tira(page, '/lente', '08-lente');
  await ctx.close();

  // ---- Sala Ao Vivo (entra pelo codigo de uma sala real) ----
  if (SALA_CODE) {
    ctx = await novaPagina(SEED_APP);
    page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/lente`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(900);
      await page.getByRole('button', { name: /entrar numa sala/i }).first().click();
      await page.waitForTimeout(500);
      await page.locator('.lente-codigo-input').fill(SALA_CODE);
      await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
      await page.waitForSelector('.sala-lobby', { timeout: 8000 });
      await page.waitForTimeout(1200);
      await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => {});
      await page.screenshot({ path: path.join(outDir, '09-sala-lobby.png') });
      console.log('print 09-sala-lobby');

      // inicia a sala (host, por fora) e espera o quiz sincronizar
      execSync(`node --env-file=.env inicia-sala-teste.mjs ${SALA_CODE}`, {
        cwd: path.resolve(root, '..', 'supabase'),
        stdio: 'ignore',
      });
      await page.waitForSelector('.sala-ranking', { timeout: 12000 });
      await page.waitForTimeout(1200);
      await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => {});
      await page.screenshot({ path: path.join(outDir, '10-sala-quiz.png') });
      console.log('print 10-sala-quiz');
    } catch (e) {
      console.log('(sala: pulou —', e.message.split('\n')[0], ')');
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.httpServer.close();
}
console.log('PRONTO. Imagens em', outDir);
