// Verificacao independente de regressao (F2.5): flashcards, dica (com e
// sem saldo), ficha de bolso, micro-aula (+5 XP uma vez), toggle de som
// persistente, integridade do localStorage e zero erros de console.
// Uso: npm run build && node _verify-f25-regressao.mjs
import { createRequire } from 'module';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '_shots', 'verify-f25');
mkdirSync(dir, { recursive: true });

const PORT = 4318;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });
const base = `http://localhost:${PORT}`;

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}

/* ----------------------- Seed pos-onboarding ------------------------- */
const AGORA = Date.now();
const HABILIDADES = ['tanino', 'acidez', 'corpo', 'docura', 'frutado', 'rotulo', 'harmonizacao'];
function dataLocalNode(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const SEED_XP = 60;
const SEED_CRISTAIS = 60;
const progresso = {};
for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5']) {
  progresso[id] = {
    coroas: 1,
    vezesConcluida: 1,
    ultimaConclusao: AGORA,
    proximaRevisao: AGORA + 7 * 86400000,
    errosPendentes: [],
  };
}
const SEED = {
  versao: 1,
  wallet: {
    xpTotal: SEED_XP,
    cristais: SEED_CRISTAIS,
    vidas: 5,
    vidasTs: AGORA,
    streak: 0,
    bestStreak: 0,
    freezes: 0,
    lastDone: null,
    metaDiaria: 50,
    xpHoje: 0,
    dataHoje: dataLocalNode(AGORA),
    licoesHoje: 0,
    praticasHoje: 0,
    criadoEm: AGORA,
  },
  progresso,
  scorePaladar: Object.fromEntries(HABILIDADES.map((h) => [h, 60])),
  scorePaladarTs: Object.fromEntries(HABILIDADES.map((h) => [h, AGORA])),
  checkpoints: ['u1'],
  ultimoDesafioXp: null,
  objetivo: 'mercado',
  nivelDeclarado: 'iniciante',
  onboardingCompleto: true,
};

const ctx = await browser.newContext({
  viewport: { width: 412, height: 892 },
  deviceScaleFactor: 2,
  locale: 'pt-BR',
  isMobile: true,
  hasTouch: true,
});
await ctx.addInitScript(
  ({ seed, ftue }) => {
    if (localStorage.getItem('tp.verify.seeded')) return;
    localStorage.setItem('tp.v1', JSON.stringify(seed));
    localStorage.setItem('tp.ftue.v1', JSON.stringify(ftue));
    localStorage.setItem('tp.verify.seeded', '1');
  },
  { seed: SEED, ftue: { cristaisColetados: true, lojaVista: true } },
);

const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

const results = [];
let shotN = 0;
const shot = async (name) => {
  shotN += 1;
  await page.screenshot({ path: path.join(dir, `${String(shotN).padStart(2, '0')}-${name}.png`) });
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
const lerStore = () => page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')));

/* Avanca a micro-aula clicando no palco ate fechar (ou mostrar o XP). */
async function assistirMicroAulaInteira() {
  for (let i = 0; i < 14; i++) {
    if ((await page.locator('.microaula').count()) === 0) return 'fechou';
    if ((await page.locator('.microaula-xp').count()) > 0) {
      await page.locator('.microaula').waitFor({ state: 'detached', timeout: 4000 });
      return 'xp';
    }
    const palco = page.locator('.tchin-cena-palco');
    if ((await palco.count()) === 0) break;
    await palco.click();
    await page.waitForTimeout(220);
  }
  if ((await page.locator('.microaula-xp').count()) > 0) {
    await page.locator('.microaula').waitFor({ state: 'detached', timeout: 4000 });
    return 'xp';
  }
  await page.locator('.microaula').waitFor({ state: 'detached', timeout: 6000 });
  return 'fechou';
}

try {
  /* ------------------------------ Trilha ------------------------------ */
  await step('setup: seed abre direto na Trilha', async () => {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 10000 });
    const estado = await lerStore();
    assert(estado.wallet.xpTotal === SEED_XP, `xpTotal seed = ${estado.wallet.xpTotal}`);
  });

  /* --------------------- (d) micro-aula da unidade -------------------- */
  await step('(d1) micro-aula roda: cena com fala e 6 passos', async () => {
    await page.locator('.unit-aula').first().click();
    await page.waitForSelector('.microaula', { timeout: 6000 });
    const fala1 = (await page.locator('.tchin-cena-balao').innerText()).trim();
    assert(fala1.length > 0, 'balao da cena vazio');
    const dots = await page.locator('.tchin-cena-dot').count();
    assert(dots === 6, `roteiro u1 com ${dots} passos, esperava 6`);
    await shot('microaula-rodando');
    /* toque no palco avanca o passo (cena viva, interrompivel) */
    await page.locator('.tchin-cena-palco').click();
    await page.waitForTimeout(250);
    const fala2 = (await page.locator('.tchin-cena-balao').innerText()).trim();
    assert(fala2 !== fala1, `palco nao avancou a fala ("${fala2}")`);
  });

  await step('(d2) Pular fecha sem pagar XP', async () => {
    await page.locator('.tchin-cena-pular').click();
    await page.locator('.microaula').waitFor({ state: 'detached', timeout: 4000 });
    const estado = await lerStore();
    assert(estado.wallet.xpTotal === SEED_XP, `pular pagou XP: ${estado.wallet.xpTotal}`);
    assert(!estado.microAulas.includes('u1'), 'u1 marcada como paga apos pular');
  });

  await step('(d3) assistir inteira paga +5 XP uma vez', async () => {
    await page.locator('.unit-aula').first().click();
    await page.waitForSelector('.microaula', { timeout: 6000 });
    const fim = await assistirMicroAulaInteira();
    assert(fim === 'xp', `nao mostrou o selo de XP (fim=${fim})`);
    const estado = await lerStore();
    assert(
      estado.wallet.xpTotal === SEED_XP + 5,
      `xpTotal ${estado.wallet.xpTotal}, esperava ${SEED_XP + 5}`,
    );
    assert(
      JSON.stringify(estado.microAulas) === JSON.stringify(['u1']),
      `microAulas = ${JSON.stringify(estado.microAulas)}`,
    );
  });

  await step('(d4) reassistir inteira NAO paga de novo', async () => {
    await page.locator('.unit-aula').first().click();
    await page.waitForSelector('.microaula', { timeout: 6000 });
    const fim = await assistirMicroAulaInteira();
    assert(fim === 'fechou', `revisita mostrou XP de novo (fim=${fim})`);
    const estado = await lerStore();
    assert(
      estado.wallet.xpTotal === SEED_XP + 5,
      `revisita mudou o XP: ${estado.wallet.xpTotal}`,
    );
  });

  /* -------------------- (c) ficha de bolso na licao ------------------- */
  await step('(c) ficha de bolso abre com 3 fatos e pula sem travar', async () => {
    await page.goto(`${base}/licao/u1-l1`, { waitUntil: 'load' });
    await page.waitForSelector('.player-meio .opcao', { timeout: 8000 });
    const opcoesAntes = await page.locator('.player-meio .opcao').count();
    await page.locator('.ficha-chamada').click();
    await page.waitForSelector('.folha', { timeout: 4000 });
    const fichas = await page.locator('.ficha-carta').count();
    assert(fichas === 3, `ficha com ${fichas} cards, esperava 3`);
    await shot('ficha-bolso-aberta');
    await page.getByRole('button', { name: 'Pronto, bora jogar' }).click();
    await page.locator('.folha').waitFor({ state: 'detached', timeout: 4000 });
    const opcoesDepois = await page.locator('.player-meio .opcao').count();
    assert(opcoesDepois === opcoesAntes, 'fechar a ficha mudou o exercicio');
  });

  /* ----------------- (b) dica com saldo e sem saldo ------------------- */
  await step('(b1) dica com saldo: -10 cristais e 1 alternativa eliminada', async () => {
    const antes = (await lerStore()).wallet.cristais;
    assert(antes === SEED_CRISTAIS, `cristais antes = ${antes}`);
    await page.locator('.dica-botao').click();
    await page.waitForSelector('.opcao-eliminada', { timeout: 4000 });
    const depois = (await lerStore()).wallet.cristais;
    assert(depois === antes - 10, `dica debitou ${antes - depois}, esperava 10`);
    const eliminadas = await page.locator('.opcao-eliminada').count();
    assert(eliminadas === 1, `eliminadas: ${eliminadas}`);
    assert((await page.locator('.dica-botao').count()) === 0, 'botao de dica nao sumiu');
    await shot('dica-com-saldo');
    await page.locator('.player-fechar').click();
    await page.getByRole('button', { name: 'Sair mesmo assim' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
  });

  await step('(b2) dica sem saldo: aviso acolhedor, nada debitado', async () => {
    await page.evaluate(() => {
      const estado = JSON.parse(localStorage.getItem('tp.v1'));
      estado.wallet.cristais = 5;
      localStorage.setItem('tp.v1', JSON.stringify(estado));
    });
    await page.goto(`${base}/licao/u1-l1`, { waitUntil: 'load' });
    await page.waitForSelector('.player-meio .opcao', { timeout: 8000 });
    await page.locator('.dica-botao').click();
    await page.waitForSelector('.dica-aviso', { timeout: 4000 });
    const aviso = (await page.locator('.dica-aviso').innerText()).trim();
    assert(aviso.includes('Cristais curtos por agora'), `aviso: "${aviso}"`);
    assert((await page.locator('.opcao-eliminada').count()) === 0, 'eliminou opcao sem saldo');
    const estado = await lerStore();
    assert(estado.wallet.cristais === 5, `cristais mudaram: ${estado.wallet.cristais}`);
    await shot('dica-sem-saldo');
    await page.locator('.player-fechar').click();
    await page.getByRole('button', { name: 'Sair mesmo assim' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
  });

  /* ------------------------- (a) flashcards --------------------------- */
  let totalCartas = 0;
  await step('(a1) abrir modo cartas e virar o 1o card', async () => {
    await page.goto(`${base}/pratica`, { waitUntil: 'load' });
    await page.getByRole('button', { name: /Revisar com cartas/ }).click();
    await page.waitForSelector('.carta3d', { timeout: 8000 });
    const contagem = (await page.locator('.pratica-contagem').innerText()).trim();
    totalCartas = Number(contagem.split('/')[1]);
    assert(totalCartas >= 3, `sessao com ${totalCartas} cards (< 3)`);
    assert(
      (await page.locator('.cartas-avaliacao').count()) === 0,
      'autoavaliacao visivel antes do flip',
    );
    await shot('carta-frente');
    await page.locator('.carta3d').click();
    await page.getByRole('button', { name: 'Sabia', exact: true }).waitFor({ timeout: 4000 });
    const rotulo = await page.locator('.carta3d').getAttribute('aria-label');
    assert(rotulo === 'Carta virada, fato completo', `aria-label pos-flip: "${rotulo}"`);
    await shot('carta-verso');
  });

  await step('(a2) autoavaliar 3 cards alimenta a agenda tp.cartas.v1', async () => {
    /* card 1 ja virado: Sabia; card 2: Quase; card 3: Nao sabia */
    await page.getByRole('button', { name: 'Sabia', exact: true }).click();
    await page.locator('.carta3d').click();
    await page.getByRole('button', { name: 'Quase', exact: true }).waitFor({ timeout: 4000 });
    await page.getByRole('button', { name: 'Quase', exact: true }).click();
    await page.locator('.carta3d').click();
    await page.getByRole('button', { name: 'Não sabia', exact: true }).waitFor({ timeout: 4000 });
    await page.getByRole('button', { name: 'Não sabia', exact: true }).click();
    const agenda = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.cartas.v1')));
    const itens = Object.values(agenda ?? {});
    assert(itens.length === 3, `agenda com ${itens.length} cards, esperava 3`);
    const fases = itens.map((i) => i.fase).sort();
    assert(
      JSON.stringify(fases) === JSON.stringify([0, 0, 1]),
      `fases ${JSON.stringify(fases)}, esperava [0,0,1] (sabia sobe, quase/naosabia ficam em 0)`,
    );
    assert(itens.every((i) => i.proxima > Date.now()), 'proxima revisao no passado');
  });

  await step('(a3) concluir a sessao paga XP de revisao no store', async () => {
    const xpAntes = (await lerStore()).wallet.xpTotal;
    const praticasAntes = (await lerStore()).wallet.praticasHoje;
    for (let i = 3; i < totalCartas; i++) {
      await page.locator('.carta3d').click();
      await page.getByRole('button', { name: 'Sabia', exact: true }).waitFor({ timeout: 4000 });
      await page.getByRole('button', { name: 'Sabia', exact: true }).click();
    }
    await page.waitForSelector('.pratica-placar', { timeout: 8000 });
    const ganho = Number(
      await page.locator('.pratica-ganho-xp .odometro').getAttribute('aria-label'),
    );
    assert(ganho === 10, `XP exibido na conclusao: ${ganho}, esperava 10 (D0 sem soft cap)`);
    const estado = await lerStore();
    assert(
      estado.wallet.xpTotal === xpAntes + 10,
      `xpTotal ${estado.wallet.xpTotal}, esperava ${xpAntes + 10}`,
    );
    assert(
      estado.wallet.praticasHoje === praticasAntes + 1,
      `praticasHoje = ${estado.wallet.praticasHoje}`,
    );
    const agenda = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.cartas.v1')));
    assert(
      Object.keys(agenda).length === totalCartas,
      `agenda final com ${Object.keys(agenda).length} cards, esperava ${totalCartas}`,
    );
    await shot('cartas-resultado');
    await page.getByRole('button', { name: 'Voltar à trilha' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
  });

  /* ---------------------- (e) toggle de som --------------------------- */
  await step('(e1) som: padrao ligado, desligar persiste apos reload', async () => {
    await page.goto(`${base}/perfil`, { waitUntil: 'load' });
    await page.waitForSelector('.ajuste-som', { timeout: 8000 });
    assert(
      (await page.locator('.ajuste-som').getAttribute('aria-pressed')) === 'true',
      'som nao nasce ligado',
    );
    await page.locator('.ajuste-som').click();
    assert(
      (await page.locator('.ajuste-som').getAttribute('aria-pressed')) === 'false',
      'toggle nao desligou',
    );
    const chave = await page.evaluate(() => localStorage.getItem('tp.som.v1'));
    assert(chave === 'off', `tp.som.v1 = "${chave}"`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.ajuste-som', { timeout: 8000 });
    assert(
      (await page.locator('.ajuste-som').getAttribute('aria-pressed')) === 'false',
      'som religou sozinho apos reload',
    );
    await shot('som-off-apos-reload');
  });

  await step('(e2) som: religar persiste apos reload', async () => {
    await page.locator('.ajuste-som').click();
    const chave = await page.evaluate(() => localStorage.getItem('tp.som.v1'));
    assert(chave === 'on', `tp.som.v1 = "${chave}"`);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.ajuste-som', { timeout: 8000 });
    assert(
      (await page.locator('.ajuste-som').getAttribute('aria-pressed')) === 'true',
      'som nao voltou ligado apos reload',
    );
  });

  /* ------------------ (4) integridade do localStorage ----------------- */
  await step('(4) localStorage integro: tp.v1 valido, nenhuma chave corrompida', async () => {
    const dump = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });
    const NAO_JSON = new Set(['tp.som.v1']);
    for (const [k, v] of Object.entries(dump)) {
      if (NAO_JSON.has(k)) continue;
      try {
        JSON.parse(v);
      } catch {
        throw new Error(`chave corrompida (JSON invalido): ${k} = ${String(v).slice(0, 80)}`);
      }
    }
    assert(['on', 'off'].includes(dump['tp.som.v1']), `tp.som.v1 = ${dump['tp.som.v1']}`);
    const estado = JSON.parse(dump['tp.v1']);
    assert(estado.versao === 1, `versao = ${estado.versao}`);
    const w = estado.wallet;
    assert(w.xpTotal === SEED_XP + 5 + 10, `xpTotal final ${w.xpTotal}, esperava ${SEED_XP + 15}`);
    assert(w.cristais === 5, `cristais finais ${w.cristais}, esperava 5`);
    assert(w.vidas >= 0 && w.vidas <= 5, `vidas = ${w.vidas}`);
    assert(w.streak === 1, `streak = ${w.streak} (pratica deveria garantir o dia)`);
    assert(w.praticasHoje === 1, `praticasHoje = ${w.praticasHoje}`);
    assert(estado.onboardingCompleto === true, 'onboardingCompleto nao e true');
    assert(
      JSON.stringify(estado.microAulas) === JSON.stringify(['u1']),
      `microAulas = ${JSON.stringify(estado.microAulas)}`,
    );
    for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5']) {
      assert(estado.progresso[id]?.vezesConcluida >= 1, `progresso ${id} sumiu`);
    }
    console.log('  chaves:', Object.keys(dump).join(', '));
    console.log('  wallet final:', JSON.stringify(w));
  });

  await step('(5) zero erros de console no fluxo inteiro', async () => {
    assert(
      consoleErrors.length === 0,
      `${consoleErrors.length} erros: ${consoleErrors.slice(0, 3).join(' | ')}`,
    );
  });
} finally {
  console.log('\n================= RESUMO VERIFY F2.5 =================');
  for (const r of results) console.log(r);
  console.log('\nConsole errors (' + consoleErrors.length + '):');
  for (const e of consoleErrors.slice(0, 12)) console.log('  -', e.slice(0, 240));
  await browser.close();
  server.httpServer.close();
  if (fatal || consoleErrors.length > 0) process.exitCode = 1;
}
