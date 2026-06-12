// E2E F2: trilha de 6 unidades, desbloqueio da unidade 2, licao real da
// unidade 2, pratica livre (8 exercicios respondidos lendo o DOM, com
// rotulo real) e Desafio do Dia (4 perguntas, grade, XP, 1 por dia).
// Uso: npm run build && node e2e-f2.mjs
// Screenshots em _shots/e2e-f2/. Sai com codigo 1 se algum passo falhar.
import { createRequire } from 'module';
import { mkdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(root, '_shots', 'e2e-f2');
mkdirSync(dir, { recursive: true });

/* ------------------- Dados canonicos (mesmos do app) ------------------ */

const lerJson = (rel) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
const LICAO_U2L1 = lerJson('src/content/unidade-2/licao-01.json');
const BANCO = lerJson('src/content/pratica/banco-pratica.json');
const DESAFIOS = lerJson('src/content/pratica/desafios.json');

/* Mesma logica da rota Desafio: dia oficial America/Sao_Paulo + modulo */
function diaSaoPaulo(agora) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}
function indiceDoDia(dia, total) {
  const [ano, mes, diaN] = dia.split('-').map(Number);
  const dias = Math.floor(Date.UTC(ano, mes - 1, diaN) / 86400000);
  return ((dias % total) + total) % total;
}
const DIA = diaSaoPaulo(Date.now());
const DESAFIO_HOJE = DESAFIOS.desafios[indiceDoDia(DIA, DESAFIOS.desafios.length)];

/* --------------------- Seed: tp.v1 pos-onboarding --------------------- */

const HABILIDADES = ['tanino', 'acidez', 'corpo', 'docura', 'frutado', 'rotulo', 'harmonizacao'];
function dataLocalNode(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const AGORA = Date.now();
const SEED_XP = 60;
const SEED_CRISTAIS = 60;
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
  progresso: {},
  /* rotulo zerado e o resto alto: a pratica deve focar a habilidade mais
     fraca (leitura de rotulo), que e a unica com exercicios de imagem */
  scorePaladar: Object.fromEntries(HABILIDADES.map((h) => [h, h === 'rotulo' ? 0 : 60])),
  scorePaladarTs: Object.fromEntries(HABILIDADES.map((h) => [h, AGORA])),
  checkpoints: [],
  ultimoDesafioXp: null,
  objetivo: 'mercado',
  nivelDeclarado: 'iniciante',
  onboardingCompleto: true,
};

/* ------------------------------ Setup -------------------------------- */

const PORT = 4317;
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

/* Seed roda UMA vez (guard): reloads seguintes provam persistencia real */
await ctx.addInitScript(
  ({ seed, ftue }) => {
    if (localStorage.getItem('tp.e2e.seeded')) return;
    localStorage.setItem('tp.v1', JSON.stringify(seed));
    localStorage.setItem('tp.ftue.v1', JSON.stringify(ftue));
    localStorage.setItem('tp.e2e.seeded', '1');
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

/* ------------------------------ Helpers ------------------------------ */

const lerStore = () => page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')));

const continuarBtn = () => page.locator('.painel-reveal button.btn.btn-cheio');

async function esperarRevealOk(rotuloEsperado) {
  await page.waitForSelector('.painel-calibrar, .painel-reveal', { timeout: 8000 });
  if ((await page.locator('.painel-calibrar').count()) > 0) {
    await page.getByRole('button', { name: 'Certeza' }).click();
  }
  await page.waitForSelector('.painel-reveal.painel-ok', { timeout: 8000 });
  const rotulo = (await continuarBtn().innerText()).trim();
  if (rotuloEsperado) assert(rotulo.includes(rotuloEsperado), `botao "${rotulo}"`);
  await continuarBtn().click();
  return rotulo;
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

/** Le o exercicio atual do DOM (pergunta, opcoes, imagem, tipo aparente). */
async function lerExercicioDoDom() {
  return page.evaluate(() => {
    const texto = (el) => (el ? el.textContent.trim() : null);
    const img = document.querySelector('.player-meio .ex img');
    return {
      pergunta: texto(document.querySelector('.player-meio .ex-pergunta')),
      eyebrow: texto(document.querySelector('.player-meio .ex-eyebrow')),
      opcoes: [...document.querySelectorAll('.player-meio .opcao')].map((b) => b.textContent.trim()),
      temDeck: document.querySelector('.btn-deck-sim') !== null,
      temSlider: document.querySelector('.regua input[type="range"]') !== null,
      imgSrc: img ? img.getAttribute('src') : null,
      imgCarregada: img ? img.complete && img.naturalWidth > 0 : false,
    };
  });
}

/**
 * Responde corretamente o exercicio atual da LICAO u2-l1, lendo o DOM e
 * cruzando com o JSON canonico. Retorna o rotulo do botao de continuar.
 */
async function resolverExercicioLicao() {
  await page.waitForSelector(
    '.player-meio .opcao, .btn-deck-sim, .regua input[type="range"]',
    { timeout: 8000 },
  );
  const dom = await lerExercicioDoDom();

  if (dom.temDeck) {
    const ex = LICAO_U2L1.exercicios.find((e) => e.tipo === 'swipe');
    for (const carta of ex.cartas) {
      await page.locator(carta.verdade ? '.btn-deck-sim' : '.btn-deck-nao').click();
      await page.waitForTimeout(420);
    }
    return esperarRevealOk();
  }

  if (dom.temSlider) {
    const ex = LICAO_U2L1.exercicios.find((e) => e.tipo === 'slider' && e.pergunta === dom.pergunta);
    assert(ex, `slider sem par no JSON: "${dom.pergunta}"`);
    await setSlider(ex.alvo);
    await page.getByRole('button', { name: 'Cravar palpite' }).click();
    return esperarRevealOk();
  }

  if (dom.eyebrow && dom.eyebrow.startsWith('Duas verdades')) {
    const ex = LICAO_U2L1.exercicios.find((e) => e.tipo === 'duasverdades');
    await page.locator('.player-meio .opcao').nth(ex.mentira).click();
    await page.getByRole('button', { name: 'Conferir' }).click();
    return esperarRevealOk();
  }

  const ex = LICAO_U2L1.exercicios.find(
    (e) => (e.tipo === 'mc' || e.tipo === 'intruso') && e.pergunta === dom.pergunta,
  );
  assert(ex, `pergunta sem par no JSON da licao: "${dom.pergunta}"`);
  const idx = ex.tipo === 'mc' ? ex.correta : ex.intruso;
  assert(
    dom.opcoes[idx] === ex.opcoes[idx],
    `opcao ${idx} do DOM ("${dom.opcoes[idx]}") difere do JSON ("${ex.opcoes[idx]}")`,
  );
  await page.locator('.player-meio .opcao').nth(idx).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  return esperarRevealOk();
}

/** Acha no banco da pratica o item exibido (pergunta + imagem + opcoes). */
function acharNoBanco(dom) {
  let cands = BANCO.exercicios.filter((e) => e.pergunta === dom.pergunta);
  if (cands.length > 1 && dom.imgSrc) {
    cands = cands.filter((e) => e.imagem && dom.imgSrc.endsWith(e.imagem));
  }
  if (cands.length > 1) {
    cands = cands.filter((e) => JSON.stringify(e.opcoes) === JSON.stringify(dom.opcoes));
  }
  return cands[0] ?? null;
}

/* ------------------------------- Fluxo -------------------------------- */

try {
  await step('(a) seed tp.v1 pos-onboarding abre direto na Trilha (sem splash)', async () => {
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 10000 });
    assert(new URL(page.url()).pathname === '/', `URL e ${page.url()}`);
    assert((await page.locator('.splash').count()) === 0, 'splash apareceu com onboarding completo');
    const estado = await lerStore();
    assert(estado.onboardingCompleto === true, 'onboardingCompleto nao persistiu');
  });

  await step('(b) Trilha mostra 6 unidades, com a 2 em diante bloqueadas', async () => {
    const visao = await page.evaluate(() => ({
      abertas: document.querySelectorAll('.unit-card').length,
      bloqueadas: [...document.querySelectorAll('.unit-locked')].map(
        (s) => s.querySelector('.unit-locked-eyebrow')?.textContent.trim() ?? '',
      ),
    }));
    assert(visao.abertas === 1, `unidades abertas: ${visao.abertas}, esperava 1`);
    assert(visao.bloqueadas.length === 5, `bloqueadas: ${visao.bloqueadas.length}, esperava 5`);
    assert(
      JSON.stringify(visao.bloqueadas) ===
        JSON.stringify(['Unidade 2', 'Unidade 3', 'Unidade 4', 'Unidade 5', 'Unidade 6']),
      `ordem das bloqueadas: ${JSON.stringify(visao.bloqueadas)}`,
    );
    const pill = await page.locator('.trail-item.current .start-pill').first().innerText();
    assert(pill.trim() === 'Começar', `pill do no atual: "${pill}"`);
    await shot('trilha-6-unidades-seed');
    /* rolar ate o fim para ver as bloqueadas */
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await shot('trilha-unidades-bloqueadas');
    await page.evaluate(() => window.scrollTo(0, 0));
  });

  await step('(c) unidade 1 completa via progresso injetado abre a unidade 2', async () => {
    await page.evaluate((agora) => {
      const estado = JSON.parse(localStorage.getItem('tp.v1'));
      for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5']) {
        estado.progresso[id] = {
          coroas: 1,
          vezesConcluida: 1,
          ultimaConclusao: agora,
          proximaRevisao: agora + 7 * 86400000,
          errosPendentes: [],
        };
      }
      estado.checkpoints = ['u1'];
      localStorage.setItem('tp.v1', JSON.stringify(estado));
    }, AGORA);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 10000 });
    const visao = await page.evaluate(() => ({
      abertas: [...document.querySelectorAll('.unit-card')].map(
        (c) => c.querySelector('.unit-eyebrow')?.textContent.trim() ?? '',
      ),
      bloqueadas: document.querySelectorAll('.unit-locked').length,
      coroasU1: document.querySelectorAll('.coroa-ganha').length,
    }));
    assert(
      JSON.stringify(visao.abertas) === JSON.stringify(['Unidade 1', 'Unidade 2']),
      `abertas: ${JSON.stringify(visao.abertas)}`,
    );
    assert(visao.bloqueadas === 4, `bloqueadas: ${visao.bloqueadas}, esperava 4`);
    assert(visao.coroasU1 >= 5, `coroas ganhas na u1: ${visao.coroasU1}`);
    /* o no atual (pill Comecar) deve ser a 1a licao da unidade 2 */
    await page.locator('.trail-item.current').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await shot('trilha-unidade2-aberta');
  });

  let xpAposLicao = 0;
  await step('(d) licao u2-l1 jogada de verdade ate a conclusao', async () => {
    await page.locator('.trail-item.current button.node-taca').click();
    await page.waitForSelector('.player-meio', { timeout: 8000 });
    assert(new URL(page.url()).pathname === '/licao/u2-l1', `URL e ${page.url()}`);
    let fim = false;
    for (let i = 0; i < 14 && !fim; i++) {
      if (i === 2) {
        await page.waitForTimeout(700); /* entrada estabilizada antes do shot */
        await shot('licao-u2l1-exercicio');
      }
      const rotulo = await resolverExercicioLicao();
      fim = rotulo.includes('Ver resultado');
    }
    assert(fim, 'a licao nao chegou ao "Ver resultado" em 14 jogadas');
    await page.waitForSelector('.conclusao', { timeout: 8000 });
    await page.waitForTimeout(1100);
    const placar = await page.locator('.placar').innerText();
    assert(placar.includes('XP'), `placar sem XP: "${placar}"`);
    await shot('licao-u2l1-conclusao');
    const estado = await lerStore();
    assert(
      (estado.progresso['u2-l1']?.vezesConcluida ?? 0) === 1,
      'progresso de u2-l1 nao registrou conclusao',
    );
    assert(estado.wallet.xpTotal > SEED_XP, `xpTotal nao subiu: ${estado.wallet.xpTotal}`);
    xpAposLicao = estado.wallet.xpTotal;
    await page.getByRole('button', { name: 'Continuar na trilha' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
  });

  let teveImagem = false;
  await step('(e) cartao Pratica livre visivel e rodada de 8 jogada de verdade', async () => {
    await page.locator('.pratica-card').waitFor({ timeout: 6000 });
    const titulo = await page.locator('.pratica-titulo').innerText();
    assert(titulo.includes('Prática livre'), `cartao: "${titulo}"`);
    await page.locator('.pratica-card').click();
    await page.waitForSelector('.vazio-titulo', { timeout: 8000 });
    assert(new URL(page.url()).pathname === '/pratica', `URL e ${page.url()}`);
    /* a rodada adaptativa deve focar a habilidade mais fraca do seed */
    const intro = await page.locator('.vazio-texto').first().innerText();
    assert(intro.includes('leitura de rótulo'), `foco da rodada: "${intro}"`);
    await shot('pratica-pronto');
    await page.getByRole('button', { name: 'Começar a rodada' }).click();

    const MAX_RODADAS = 5;
    for (let rodada = 1; rodada <= MAX_RODADAS; rodada++) {
      for (let qi = 0; qi < 8; qi++) {
        await page.waitForSelector('.player-meio .opcao', { timeout: 8000 });
        /* contador confere a posicao real */
        const contagem = await page.locator('.pratica-contagem').innerText();
        assert(contagem.trim() === `${qi + 1}/8`, `contador "${contagem}", esperava ${qi + 1}/8`);
        const dom = await lerExercicioDoDom();
        const ex = acharNoBanco(dom);
        assert(ex, `item da pratica sem par no banco: "${dom.pergunta}"`);
        if (dom.imgSrc) {
          assert(dom.imgSrc.startsWith('/rotulos/'), `imagem fora de /rotulos/: ${dom.imgSrc}`);
          /* lazy + decoding async: espera o load real antes de conferir */
          await page.waitForFunction(
            () => {
              const img = document.querySelector('.player-meio .ex img');
              return img && img.complete && img.naturalWidth > 0;
            },
            { timeout: 8000 },
          );
          if (!teveImagem) {
            teveImagem = true;
            await page.waitForTimeout(700); /* entrada estabilizada antes do shot */
            await shot('pratica-exercicio-rotulo-real');
          }
        }
        const idx = ex.tipo === 'mc' ? ex.correta : ex.intruso;
        await page.locator('.player-meio .opcao').nth(idx).click();
        await page.getByRole('button', { name: 'Conferir' }).click();
        await esperarRevealOk(qi === 7 ? 'Ver resultado' : 'Continuar');
      }
      await page.waitForSelector('.pratica-placar', { timeout: 8000 });
      const ganho = await page.locator('.pratica-ganho-xp').innerText();
      assert(/\+\d+ XP/.test(ganho), `placar da pratica: "${ganho}"`);
      if (teveImagem) break;
      assert(rodada < MAX_RODADAS, `nenhum exercicio com rotulo real em ${MAX_RODADAS} rodadas`);
      await page.getByRole('button', { name: 'Mais uma rodada' }).click();
    }
    assert(teveImagem, 'nenhum exercicio com imagem de /rotulos/ apareceu');
    await shot('pratica-resultado');
    const estado = await lerStore();
    assert(estado.wallet.praticasHoje >= 1, `praticasHoje = ${estado.wallet.praticasHoje}`);
    assert(estado.wallet.xpTotal > xpAposLicao, `xp da pratica nao entrou: ${estado.wallet.xpTotal}`);
    await page.getByRole('button', { name: 'Voltar à trilha' }).click();
    await page.waitForSelector('.trail', { timeout: 8000 });
  });

  let xpAntesDesafio = 0;
  await step('(f) Desafio do Dia: 4 perguntas, grade no resultado, XP +30', async () => {
    xpAntesDesafio = (await lerStore()).wallet.xpTotal;
    await page.locator('.tabbar a', { hasText: 'Desafio' }).click();
    await page.waitForSelector('.daily-card', { timeout: 8000 });
    const imgOk = await page.evaluate((src) => {
      const img = document.querySelector('.daily-rotulo img');
      return img && img.getAttribute('src') === src && img.complete && img.naturalWidth > 0;
    }, DESAFIO_HOJE.imagem);
    assert(imgOk, `rotulo do dia nao carregou (${DESAFIO_HOJE.imagem})`);
    await shot('desafio-aberto');
    await page.getByRole('button', { name: 'Aceitar o desafio' }).click();

    for (let qi = 0; qi < 4; qi++) {
      await page.waitForSelector('.player-meio .opcao', { timeout: 8000 });
      const dom = await lerExercicioDoDom();
      const ex = DESAFIO_HOJE.perguntas.find((p) => p.pergunta === dom.pergunta);
      assert(ex, `pergunta do desafio sem par no JSON: "${dom.pergunta}"`);
      await page.locator('.player-meio .opcao').nth(ex.correta).click();
      await page.getByRole('button', { name: 'Conferir' }).click();
      await esperarRevealOk(qi === 3 ? 'Ver resultado' : 'Continuar');
    }

    await page.waitForSelector('.grade', { timeout: 8000 });
    const grade = await page.evaluate(() => ({
      quadros: document.querySelectorAll('.grade .grade-quadro').length,
      certos: document.querySelectorAll('.grade .grade-certo').length,
      xp: document.querySelector('.daily-xp')?.textContent.trim() ?? null,
    }));
    assert(grade.quadros === 4, `grade com ${grade.quadros} quadros`);
    assert(grade.certos === 4, `acertos na grade: ${grade.certos} de 4`);
    assert(grade.xp === '+30 XP', `XP exibido: "${grade.xp}"`);
    const estado = await lerStore();
    assert(
      estado.wallet.xpTotal === xpAntesDesafio + 30,
      `xpTotal ${estado.wallet.xpTotal}, esperava ${xpAntesDesafio + 30}`,
    );
    assert(estado.ultimoDesafioXp === DIA, `ultimoDesafioXp = ${estado.ultimoDesafioXp}`);
    const tentativa = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.desafio.v1')));
    assert(tentativa.data === DIA && tentativa.grade === '■■■■' && tentativa.acertos === 4,
      `tentativa persistida: ${JSON.stringify(tentativa)}`);
    await shot('desafio-resultado-grade');
  });

  await step('(f2) 2a visita no dia mostra resultado e nao deixa rejogar', async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('.grade', { timeout: 8000 });
    assert(
      (await page.getByRole('button', { name: 'Aceitar o desafio' }).count()) === 0,
      'botao de jogar reapareceu na 2a visita',
    );
    const proximo = await page.locator('.revelado-proximo').innerText();
    assert(proximo.includes('Próximo rótulo em'), `contagem ausente: "${proximo}"`);
    const estado = await lerStore();
    assert(estado.wallet.xpTotal === xpAntesDesafio + 30, 'XP mudou na revisita (rejogou?)');
    await shot('desafio-revisita-mesmo-dia');
  });

  await step('(g) localStorage: xp e cristais subiram, tudo sobrevive ao reload', async () => {
    const antes = await lerStore();
    assert(antes.wallet.xpTotal > SEED_XP, `xpTotal final ${antes.wallet.xpTotal} <= seed ${SEED_XP}`);
    assert(
      antes.wallet.cristais > SEED_CRISTAIS,
      `cristais ${antes.wallet.cristais} <= seed ${SEED_CRISTAIS}`,
    );
    console.log(
      `  wallet final: xpTotal ${antes.wallet.xpTotal} (seed ${SEED_XP}), cristais ${antes.wallet.cristais} (seed ${SEED_CRISTAIS})`,
    );
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.trail', { timeout: 8000 });
    const depois = await lerStore();
    assert(depois.wallet.xpTotal === antes.wallet.xpTotal, 'xpTotal mudou no reload');
    assert(depois.wallet.cristais === antes.wallet.cristais, 'cristais mudaram no reload');
    assert(depois.progresso['u2-l1']?.vezesConcluida === 1, 'progresso u2-l1 sumiu no reload');
    assert(depois.ultimoDesafioXp === DIA, 'desafio do dia sumiu no reload');
    const tentativa = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.desafio.v1')));
    assert(tentativa?.data === DIA, 'tp.desafio.v1 sumiu no reload');
    await shot('trilha-final-apos-reload');
  });

  await step('(h) zero erros de console no fluxo inteiro', async () => {
    assert(
      consoleErrors.length === 0,
      `${consoleErrors.length} erros: ${consoleErrors.slice(0, 3).join(' | ')}`,
    );
  });
} finally {
  console.log('\n================= RESUMO E2E F2 =================');
  for (const r of results) console.log(r);
  console.log('\nConsole errors (' + consoleErrors.length + '):');
  for (const e of consoleErrors.slice(0, 12)) console.log('  -', e.slice(0, 240));
  await browser.close();
  server.httpServer.close();
  if (fatal || consoleErrors.length > 0) process.exitCode = 1;
}
