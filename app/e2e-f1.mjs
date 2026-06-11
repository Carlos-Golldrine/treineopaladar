// E2E F1: fluxo real do FTUE + Licao da trilha contra vite preview.
// Uso: npm run build && node e2e-f1.mjs
// Screenshots em _shots/e2e/. Sai com codigo 1 se algum passo falhar.
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '_shots', 'e2e');
mkdirSync(dir, { recursive: true });

const PORT = 4316;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });
const base = `http://localhost:${PORT}`;

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}

const ctx = await browser.newContext({
  viewport: { width: 412, height: 892 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
  isMobile: true,
  hasTouch: true,
});
await ctx.addInitScript(() => {
  // nada: storage do contexto ja nasce limpo (1a visita real)
});
const page = await ctx.newPage();

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

const results = [];
const a11y = {};
let shotN = 0;
const shot = async (name) => {
  shotN += 1;
  const file = path.join(dir, `${String(shotN).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  console.log('  shot', path.basename(file));
};
let fatal = null;
async function step(name, fn) {
  if (fatal) return;
  try {
    await fn();
    results.push(`PASS  ${name}`);
    console.log('PASS ', name);
  } catch (e) {
    results.push(`FAIL  ${name}: ${e.message}`);
    console.log('FAIL ', name, '::', e.message);
    try {
      await shot(`FAIL-${name.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40)}`);
    } catch {}
    fatal = e;
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

/* ------------------------------ helpers ------------------------------ */

const pergunta = () => page.locator('.player-meio .ex-pergunta');
async function esperarPergunta(trecho, timeout = 8000) {
  await pergunta().waitFor({ timeout });
  const t = (await pergunta().innerText()).trim();
  if (trecho) assert(t.includes(trecho), `pergunta esperada contendo "${trecho}", veio "${t}"`);
  return t;
}
const opcao = (i) => page.locator('.player-meio .opcao').nth(i);
const conferir = () => page.getByRole('button', { name: 'Conferir' }).click();
const continuar = () => page.locator('.painel-reveal button.btn.btn-cheio').click();

async function responderMC(idx, esperadoOk) {
  await opcao(idx).click();
  await conferir();
  await page.waitForSelector(esperadoOk ? '.painel-reveal.painel-ok' : '.painel-reveal.painel-erro', {
    timeout: 6000,
  });
}

async function calibrar() {
  await page.waitForSelector('.painel-calibrar', { timeout: 6000 });
  await page.getByRole('button', { name: 'Certeza' }).click();
}

async function setSlider(valor) {
  await page.waitForSelector('.regua input[type="range"]', { timeout: 6000 });
  await page.evaluate((v) => {
    const input = document.querySelector('.regua input[type="range"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, String(v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, valor);
}

async function medirAlvos(rotulo) {
  const dados = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('button, input[type="range"], a')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      out.push({
        cls: (el.className && String(el.className).split(' ').slice(0, 2).join('.')) || el.tagName,
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
    return out;
  });
  a11y[rotulo] = dados;
}

const vidasNoTopo = async () => Number(await page.locator('.player-vidas-num').innerText());

/* ------------------------------- fluxo ------------------------------- */

try {
  await step('(a) 1a visita em "/" redireciona ao splash', async () => {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.splash', { timeout: 8000 });
    assert(new URL(page.url()).pathname === '/comecar', `URL e ${page.url()}, esperava /comecar`);
    await page.getByRole('button', { name: 'Começar' }).waitFor();
    await shot('splash');
  });

  let msAteJ1 = -1;
  await step('(b) tocar Começar abre a J1 em ate 3s', async () => {
    const t0 = Date.now();
    await page.getByRole('button', { name: 'Começar' }).click();
    await esperarPergunta('Qual destes você serviria gelado?', 3000);
    msAteJ1 = Date.now() - t0;
    console.log(`  Comecar -> J1 em ${msAteJ1}ms`);
    assert(msAteJ1 <= 3000, `J1 demorou ${msAteJ1}ms`);
    await medirAlvos('ftue-j1');
    await shot('j1-visual');
  });

  await step('(c) J1 correta (carta visual)', async () => {
    await responderMC(0, true);
    await shot('j1-acerto');
    await continuar();
  });

  await step('(c) J2 correta', async () => {
    await esperarPergunta('espumante bem gelado');
    await responderMC(0, true);
    await continuar();
  });

  await step('(c) J3 objetivo (intersticial) e payoff', async () => {
    await esperarPergunta('Onde você mais quer mandar bem?');
    await page.locator('.player-meio .carta-grande').first().click();
    await page.getByRole('button', { name: 'Continuar' }).waitFor({ timeout: 4000 });
    await shot('j3-objetivo');
    await page.getByRole('button', { name: 'Continuar' }).click();
  });

  await step('(c) J4 erro proposital mostra tooltip de vidas', async () => {
    await esperarPergunta('E o tinto, pode ir à geladeira?');
    const antes = await page.locator('.player-vidas').count();
    assert(antes === 0, 'chip de vidas ja estava visivel antes do 1o erro');
    await responderMC(1, false);
    const toast = await page.locator('.ftue-faixa').innerText();
    assert(toast.includes('5 vidas'), `toast de vidas nao apareceu, faixa = "${toast}"`);
    await page.waitForSelector('.player-vidas', { timeout: 4000 });
    const v = await vidasNoTopo();
    assert(v === 5, `grace do 1o erro: vidas deviam seguir 5, estao ${v}`);
    await shot('j4-erro-tooltip-vidas');
    await continuar();
  });

  await step('(c) J5 personalizada pelo objetivo (mercado)', async () => {
    const t = await esperarPergunta();
    assert(t.includes('No mercado'), `J5 nao refletiu o objetivo: "${t}"`);
    await responderMC(0, true);
    await continuar();
  });

  await step('(c) J6 nivel (intersticial)', async () => {
    await esperarPergunta('Quanto você já conhece de vinho?');
    await shot('j6-nivel');
    await page.locator('.player-meio .carta-grande').first().click();
  });

  await step('(c) J7 consolidacao correta', async () => {
    await esperarPergunta('Para fechar');
    await responderMC(0, true);
    await continuar();
  });

  await step('(c) J4 reaparece no fim e e corrigida', async () => {
    await page.waitForSelector('.tag-denovo', { timeout: 6000 });
    await esperarPergunta('E o tinto, pode ir à geladeira?');
    await responderMC(0, true);
    const rotulo = await page.locator('.painel-reveal button.btn.btn-cheio').innerText();
    assert(rotulo.includes('Ver resultado'), `botao final era "${rotulo}"`);
    await continuar();
  });

  await step('(d) conclusao mostra XP e streak dia 1', async () => {
    await page.waitForSelector('.conclusao.c1', { timeout: 8000 });
    await page.waitForTimeout(1100);
    const xpTxt = (await page.locator('.c1-xp-num').innerText()).trim();
    const xpNum = Number(xpTxt.replace('+', ''));
    assert(xpNum > 0, `XP exibido invalido: "${xpTxt}"`);
    const streakTxt = await page.locator('.c1-streak').innerText();
    assert(/Dia\s*1/.test(streakTxt), `streak dia 1 nao apareceu: "${streakTxt}"`);
    await medirAlvos('conclusao-l1');
    await shot('conclusao-licao1');
  });

  await step('(e) escolher meta diaria (Leve)', async () => {
    await page.locator('.meta-carta', { hasText: 'Leve' }).click();
  });

  await step('(f) soft wall aparece e "Depois" leva a Trilha', async () => {
    await page.waitForSelector('.wall', { timeout: 6000 });
    const titulo = await page.locator('.wall-titulo').innerText();
    assert(titulo.includes('Salve seu progresso'), `soft wall sem titulo esperado: "${titulo}"`);
    await shot('softwall');
    await page.getByRole('button', { name: 'Depois' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
    assert(new URL(page.url()).pathname === '/', `apos Depois a URL e ${page.url()}`);
  });

  let trilhaPosFtue = null;
  await step('(g-pre) estado da Trilha logo apos o FTUE', async () => {
    trilhaPosFtue = await page.evaluate(() => {
      const itens = [...document.querySelectorAll('.trail-item')];
      return itens.map((li) => ({
        classe: li.className,
        pill: li.querySelector('.start-pill')?.textContent ?? null,
        coroas: li.querySelector('.node-coroas') !== null,
        rotulo: li.querySelector('.node-label')?.textContent ?? '',
      }));
    });
    await medirAlvos('trilha-pos-ftue');
    await shot('trilha-pos-ftue');
    assert(trilhaPosFtue.length === 5, `trilha tem ${trilhaPosFtue.length} nos, esperava 5`);
    assert(trilhaPosFtue[0].classe.includes('current'), `no 1 nao esta disponivel: ${trilhaPosFtue[0].classe}`);
    assert(trilhaPosFtue[1].classe.includes('locked'), `no 2 deveria estar bloqueado: ${trilhaPosFtue[1].classe}`);
  });

  await step('(h) abrir a licao 2 do dia (no 1 da trilha, u1-l1)', async () => {
    await page.locator('.trail-item').first().locator('button.node-taca').click();
    await esperarPergunta('chá preto que ficou tempo demais');
    assert(new URL(page.url()).pathname === '/licao/u1-l1', `URL e ${page.url()}`);
  });

  const PERG_EX0 = 'chá preto que ficou tempo demais';

  await step('(h) erro proposital 1 no ex0 (grace, sem perder vida)', async () => {
    await responderMC(1, false);
    const v = await vidasNoTopo();
    assert(v === 5, `grace: vidas deviam ser 5, estao ${v}`);
    await continuar();
  });

  await step('(h) ex1 MC correta', async () => {
    await esperarPergunta('Essa mesma secura aparece');
    await responderMC(0, true);
    await continuar();
  });

  await step('(h) ex2 swipe (deck de 5 cartas)', async () => {
    await esperarPergunta('Tem tanino aqui ou não tem?');
    await medirAlvos('ex-swipe');
    await shot('ex-swipe');
    const seq = [true, false, true, true, false];
    for (const v of seq) {
      const btn = page.locator(v ? '.btn-deck-sim' : '.btn-deck-nao');
      await btn.click();
      await page.waitForTimeout(420);
    }
    await page.waitForSelector('.painel-reveal.painel-ok', { timeout: 6000 });
    await continuar();
  });

  await step('(h) ex3 MC correta', async () => {
    await esperarPergunta('Onde o tanino dá as caras');
    await responderMC(0, true);
    await continuar();
  });

  await step('(h) ex4 slider no alvo', async () => {
    await esperarPergunta('Na régua do tanino');
    await setSlider(85);
    await medirAlvos('ex-slider');
    await shot('ex-slider');
    await page.getByRole('button', { name: 'Cravar palpite' }).click();
    await page.waitForSelector('.painel-reveal.painel-ok', { timeout: 6000 });
    await continuar();
  });

  await step('(h) ex5 duas verdades + calibracao', async () => {
    await page.locator('.ex-eyebrow', { hasText: 'Duas verdades' }).waitFor({ timeout: 6000 });
    await opcao(2).click();
    await conferir();
    await shot('ex-duasverdades-calibrar');
    await calibrar();
    await page.waitForSelector('.painel-reveal.painel-ok', { timeout: 6000 });
    await continuar();
  });

  await step('(h) ex6 MC desafio correta', async () => {
    await esperarPergunta('Por que o tinto seca a boca');
    await responderMC(0, true);
    await continuar();
  });

  await step('(h) ex7 intruso + calibracao', async () => {
    await esperarPergunta('NÃO costuma deixar a boca seca');
    await shot('ex-intruso');
    await opcao(2).click();
    await conferir();
    await calibrar();
    await page.waitForSelector('.painel-reveal.painel-ok', { timeout: 6000 });
    await continuar();
  });

  await step('(h) ex8 MC correta', async () => {
    await esperarPergunta('Para fechar');
    await responderMC(0, true);
    await continuar();
  });

  await step('(h) ex0 reaparece: erro proposital 2 custa vida', async () => {
    await page.waitForSelector('.tag-denovo', { timeout: 6000 });
    await esperarPergunta(PERG_EX0);
    await responderMC(1, false);
    const v = await vidasNoTopo();
    assert(v === 4, `2o erro devia custar 1 vida (5 -> 4), vidas = ${v}`);
    await shot('ex0-repetida-erro2');
    await continuar();
  });

  await step('(h) ex0 reaparece DE NOVO antes do fim e e corrigida', async () => {
    await page.waitForSelector('.tag-denovo', { timeout: 6000 });
    await esperarPergunta(PERG_EX0);
    await responderMC(0, true);
    const rotulo = await page.locator('.painel-reveal button.btn.btn-cheio').innerText();
    assert(rotulo.includes('Ver resultado'), `botao final era "${rotulo}"`);
    await continuar();
  });

  await step('(i) conclusao da licao 2 (sem confete: nao foi perfeita)', async () => {
    await page.waitForSelector('.conclusao', { timeout: 8000 });
    await page.waitForTimeout(1100);
    const confete = await page.locator('.confete').count();
    assert(confete === 0, 'confete apareceu em licao com erros');
    const placar = await page.locator('.placar').innerText();
    assert(placar.includes('XP'), `placar sem XP: "${placar}"`);
    await shot('conclusao-licao2');
    await page.getByRole('button', { name: 'Continuar na trilha' }).click();
  });

  await step('(g) coleta de cristais aparece 1 vez na Trilha', async () => {
    await page.waitForSelector('.coleta', { timeout: 8000 });
    await shot('trilha-coleta-cristais');
    await page.locator('.coleta-cartao').click();
    await page.waitForSelector('.hud-gems', { timeout: 4000 });
  });

  await step('(g) no 1 preenchido (taca com vinho + coroa) e no 2 disponivel', async () => {
    const nos = await page.evaluate(() => {
      const itens = [...document.querySelectorAll('.trail-item')];
      return itens.map((li) => ({
        classe: li.className,
        pill: li.querySelector('.start-pill')?.textContent ?? null,
        coroas: li.querySelectorAll('.coroa-ganha').length,
        temVinho: li.querySelector('svg g[clip-path] rect') !== null,
        rotulo: li.querySelector('.node-label')?.textContent ?? '',
      }));
    });
    assert(nos[0].classe.includes('reached') && !nos[0].classe.includes('locked'), `no 1: ${nos[0].classe}`);
    assert(nos[0].temVinho, 'taca do no 1 nao esta preenchida de vinho');
    assert(nos[0].coroas >= 1, `no 1 sem coroa ganha (${nos[0].coroas})`);
    assert(nos[1].classe.includes('current'), `no 2 nao esta disponivel: ${nos[1].classe}`);
    assert(nos[1].pill === 'Começar', `pill do no 2: ${nos[1].pill}`);
    assert(nos[2].classe.includes('locked'), `no 3 deveria estar bloqueado: ${nos[2].classe}`);
    await medirAlvos('trilha-final');
    await shot('trilha-tacas');
  });

  let snapshotAntes = null;
  await step('(i) localStorage tp.v1: xpTotal > 0, streak 1, licoesHoje 2, vidas <= 5', async () => {
    const estado = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')));
    assert(estado && estado.versao === 1, 'tp.v1 ausente ou versao errada');
    const w = estado.wallet;
    assert(w.xpTotal > 0, `xpTotal = ${w.xpTotal}`);
    assert(w.streak === 1, `streak = ${w.streak}`);
    assert(w.licoesHoje === 2, `licoesHoje = ${w.licoesHoje}`);
    assert(w.vidas <= 5, `vidas = ${w.vidas}`);
    assert(estado.onboardingCompleto === true, 'onboardingCompleto nao e true');
    snapshotAntes = { xpTotal: w.xpTotal, streak: w.streak, vidas: w.vidas, cristais: w.cristais };
    console.log('  wallet:', JSON.stringify(w));
  });

  await step('(j) recarregar: estado persiste e abre direto na Trilha', async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 8000 });
    assert(new URL(page.url()).pathname === '/', `apos reload a URL e ${page.url()}`);
    const splash = await page.locator('.splash').count();
    assert(splash === 0, 'splash apareceu apos reload');
    const depois = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')).wallet);
    assert(depois.xpTotal === snapshotAntes.xpTotal, `xpTotal mudou: ${depois.xpTotal}`);
    assert(depois.streak === snapshotAntes.streak, `streak mudou: ${depois.streak}`);
    const hudStreak = await page.locator('.hud-streak .hud-value').innerText();
    assert(hudStreak.trim() === '1', `HUD streak = ${hudStreak}`);
    await shot('trilha-apos-reload');
  });

  await step('(extra) cena demo do tipo ordenar (screenshot)', async () => {
    await page.goto(`${base}/licao/u1-l3?cena=ordenar`, { waitUntil: 'load' });
    await page.waitForSelector('.ex', { timeout: 8000 });
    await page.waitForTimeout(700);
    await medirAlvos('ex-ordenar');
    await shot('ex-ordenar-demo');
  });

  await step('(a11y) foco visivel e contraste sobre wine-700', async () => {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 8000 });
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName, cls: String(el.className).slice(0, 40), outline: s.outlineStyle, largura: s.outlineWidth, cor: s.outlineColor };
    });
    a11y.foco = foco;
    assert(foco && foco.outline !== 'none' && parseFloat(foco.largura) >= 2, `foco visivel fraco: ${JSON.stringify(foco)}`);
    const btn = await page.evaluate(() => {
      const el = document.querySelector('.start-pill') ?? document.querySelector('.btn-primary');
      if (!el) return null;
      const s = getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor };
    });
    a11y.contrasteWine = btn;
  });
} finally {
  console.log('\n================= RESUMO =================');
  for (const r of results) console.log(r);
  console.log('\nConsole errors (' + consoleErrors.length + '):');
  for (const e of consoleErrors.slice(0, 12)) console.log('  -', e.slice(0, 240));
  console.log('\nA11Y (alvos de toque, foco, contraste):');
  console.log(JSON.stringify(a11y, null, 1).slice(0, 6000));
  await browser.close();
  server.httpServer.close();
  if (fatal || consoleErrors.length > 0) process.exitCode = fatal ? 1 : 0;
}
