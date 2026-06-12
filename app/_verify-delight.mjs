// Verificador independente de DELIGHT: rajadas de frames próprias.
// Uso: node _verify-delight.mjs   (exige build feito em dist/)
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '_verify');
mkdirSync(dir, { recursive: true });

const PORT = 4399;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });

const SEED_APP = {
  estado: JSON.stringify({ versao: 1, onboardingCompleto: true }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true }),
};
const progressoFeito = {};
for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5']) {
  progressoFeito[id] = { coroas: 2, vezesConcluida: 2, ultimaConclusao: Date.now(), proximaRevisao: null, errosPendentes: [] };
}
const SEED_PROGRESSO = {
  estado: JSON.stringify({
    versao: 1, onboardingCompleto: true, progresso: progressoFeito, checkpoints: ['u1'],
    wallet: { cristais: 230, xpTotal: 320, streak: 4, bestStreak: 4 },
  }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true }),
};
const SEED_TACA = {
  estado: JSON.stringify({
    versao: 1, onboardingCompleto: true,
    progresso: {
      'u1-l1': { coroas: 1, vezesConcluida: 1, ultimaConclusao: Date.now(), proximaRevisao: null, errosPendentes: [] },
      'u1-l2': { coroas: 1, vezesConcluida: 1, ultimaConclusao: Date.now(), proximaRevisao: null, errosPendentes: [] },
    },
    wallet: { cristais: 80, xpTotal: 90 },
  }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true }),
  anim: JSON.stringify({ licao: 'u1-l2', coroa: true }),
};

let browser;
try { browser = await chromium.launch(); }
catch { browser = await chromium.launch({ channel: 'msedge' }); }

async function novoCtx(seed) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 892 }, deviceScaleFactor: 2,
    locale: 'pt-BR', isMobile: true, hasTouch: true,
  });
  if (seed) {
    await ctx.addInitScript((s) => {
      try {
        localStorage.setItem('tp.v1', s.estado);
        localStorage.setItem('tp.ftue.v1', s.flags);
        if (s.anim) sessionStorage.setItem('tp.anim.v1', s.anim);
      } catch {}
    }, seed);
  } else {
    await ctx.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  }
  return ctx;
}

async function burst(page, nome, frames, intervalo, clip) {
  for (let i = 0; i < frames; i++) {
    await page.screenshot({ path: path.join(dir, `${nome}-f${String(i).padStart(2, '0')}.png`), clip });
    if (i < frames - 1) await page.waitForTimeout(intervalo);
  }
  console.log('burst ok:', nome);
}

/* ---- 0. rede do load inicial (bundle no caminho critico) ---- */
{
  const ctx = await novoCtx(SEED_APP);
  const page = await ctx.newPage();
  const js = [];
  page.on('response', async (r) => {
    const u = r.url();
    if (u.endsWith('.js')) {
      const h = r.headers();
      js.push({ url: u.split('/').pop(), len: h['content-length'] || '?' });
    }
  });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  console.log('JS no load inicial da Trilha:', JSON.stringify(js));
  await ctx.close();
}

/* ---- 1. splash idle: espera 30s, rajada cheia + rajada densa dos olhos ---- */
{
  const ctx = await novoCtx(null);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/comecar`, { waitUntil: 'networkidle' });
  console.log('aguardando 30s no splash...');
  await page.waitForTimeout(30000);
  await burst(page, 'splash-idle-30s', 5, 260);
  const box = await page.locator('svg.tchin').first().boundingBox();
  if (box) {
    const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 };
    for (let i = 0; i < 50; i++) {
      await page.screenshot({ path: path.join(dir, `splash-olhos-f${String(i).padStart(2, '0')}.png`), clip });
      await page.waitForTimeout(100);
    }
    console.log('burst denso dos olhos ok');
  } else {
    console.log('FALHA: svg.tchin nao encontrado no splash');
  }
  await ctx.close();
}

/* ---- 2. erro na licao (FTUE cena erro): mascote reage? ---- */
{
  const ctx = await novoCtx(null);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/licao-1?cena=erro`, { waitUntil: 'load' });
  await burst(page, 'mascote-erro', 6, 220);
  await ctx.close();
}

/* ---- 3. acerto REAL no player (clica opcao certa + conferir) ---- */
{
  const ctx = await novoCtx(SEED_APP);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/licao/u1-l1?cena=mc`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.locator('.opcao').first().click();
  await page.waitForTimeout(250);
  await page.locator('.ex-rodape .btn-jogo').first().click();
  await burst(page, 'acerto', 6, 200);
  await ctx.close();
}

/* ---- 4. conclusao perfeita: confete + odometro + chama (1 navegacao) ---- */
{
  const ctx = await novoCtx(SEED_APP);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/licao/u1-l1?cena=conclusao`, { waitUntil: 'load' });
  await burst(page, 'conclusao-confete-odometro-chama', 8, 220);
  await ctx.close();
}

/* ---- 5. taca da trilha enchendo ---- */
{
  const ctx = await novoCtx(SEED_TACA);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await burst(page, 'taca-enche', 7, 220);
  await ctx.close();
}

/* ---- 6. botao 3D: mouse down SEGURADO ---- */
{
  const ctx = await novoCtx(null);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/comecar`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const el = page.locator('.splash-acao .btn-jogo').first();
  const box = await el.boundingBox();
  if (box) {
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await page.screenshot({ path: path.join(dir, 'botao3d-f00-solto.png'), clip: { x: box.x - 10, y: box.y - 14, width: box.width + 20, height: box.height + 28 } });
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(dir, 'botao3d-f01-press.png'), clip: { x: box.x - 10, y: box.y - 14, width: box.width + 20, height: box.height + 28 } });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, 'botao3d-f02-press.png'), clip: { x: box.x - 10, y: box.y - 14, width: box.width + 20, height: box.height + 28 } });
    await page.mouse.up();
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dir, 'botao3d-f03-solto.png'), clip: { x: box.x - 10, y: box.y - 14, width: box.width + 20, height: box.height + 28 } });
    console.log('burst ok: botao3d');
  } else console.log('FALHA: botao do splash nao encontrado');
  await ctx.close();
}

/* ---- 7. flip do flashcard ---- */
{
  const ctx = await novoCtx(SEED_PROGRESSO);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/pratica?cena=cartas`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const carta = page.locator('.carta3d').first();
  const n = await carta.count();
  if (n === 0) console.log('FALHA: .carta3d nao encontrada');
  else {
    await carta.click({ force: true });
    await burst(page, 'carta-flip', 6, 150);
  }
  await ctx.close();
}

/* ---- 8. micro-aula rodando ---- */
{
  const ctx = await novoCtx(SEED_APP);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/licao/u2-l1?cena=microaula`, { waitUntil: 'load' });
  await burst(page, 'microaula', 6, 300);
  await ctx.close();
}

/* ---- 9. estaticos p/ revisao visual (icones, marca, carisma) ---- */
{
  const estaticos = [
    ['vis-splash', null, '/comecar'],
    ['vis-trilha', SEED_PROGRESSO, '/'],
    ['vis-perfil', SEED_PROGRESSO, '/perfil'],
    ['vis-desafio', SEED_PROGRESSO, '/desafio'],
    ['vis-licao-mc', SEED_APP, '/licao/u1-l1?cena=mc'],
    ['vis-conclusao', SEED_APP, '/licao/u1-l1?cena=conclusao'],
  ];
  for (const [nome, seed, rota] of estaticos) {
    const ctx = await novoCtx(seed);
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}${rota}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: path.join(dir, `${nome}.png`) });
    if (nome === 'vis-splash') {
      const box = await page.locator('svg.tchin').first().boundingBox();
      if (box) await page.screenshot({ path: path.join(dir, 'vis-mascote-closeup.png'), clip: box });
    }
    console.log('estatico ok:', nome);
    await ctx.close();
  }
}

await browser.close();
server.httpServer.close();
console.log('FIM');
