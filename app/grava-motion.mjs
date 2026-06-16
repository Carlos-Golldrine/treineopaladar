// GATE DE REVIEW POR VIDEO (BRIEF secao 7, item 7: rajada de frames).
//
// Screenshot estatica nao enxerga vida. Este script GRAVA o movimento em
// duas formas, e depois OLHA cada quadro:
//   1) VIDEO .webm de cada captura (Playwright recordVideo), util para o
//      dono assistir no gate de review;
//   2) RAJADA de >= 12 frames a ~80ms (a regra da rajada), com um hash
//      perceptual barato por frame para PROVAR que os quadros diferem.
//
// O que grava:
//   (a) uma MICRO-AULA GSAP inteira (a que landou na F2.6 em
//       src/trilha/MicroAula.tsx): avanca PASSO A PASSO por TOQUE, sem
//       corte seco. A rajada cobre a transicao entre dois passos (a saida
//       do anterior em overlap com a entrada do novo).
//   (b) cada CENA interativa por habilidade (src/cenas/cenas.tsx): uma
//       rajada de IDLE (sem toque, so a vida continua) e uma rajada de
//       REACAO (logo apos o toque). As duas precisam ter frames distintos.
//   (c) um controle de prefers-reduced-motion: a cena idle precisa
//       CONGELAR (todos os frames iguais) quando o motion e reduzido.
//
// Saida: _shots/motion/  (webm + PNGs + relatorio.json + veredito no stdout)
// Uso: npm run build && node grava-motion.mjs
//
// Playwright vem de C:/Users/camargo/tchin-tchin-app/node_modules
// (mesmo require de shots.mjs). O preview exige build feito.

import { createRequire } from 'module';
import { mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, renameSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { createHash } from 'crypto';
import { preview } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, '_shots', 'motion');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const PORT = Number(process.env.MOTION_PORT) || 4319;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });
const base = `http://localhost:${PORT}`;

const VP = { width: 412, height: 892 };

/* Mesmos seeds de shots.mjs: cenas precisam de onboarding feito + flag
   fichaApontada (senao o toast do mascote cobre a cena). */
const SEED_CENAS = {
  estado: JSON.stringify({ versao: 1, onboardingCompleto: true, objetivo: 'mercado' }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true, fichaApontada: true }),
};
const SEED_APP = {
  estado: JSON.stringify({ versao: 1, onboardingCompleto: true, objetivo: 'mercado' }),
  flags: JSON.stringify({ cristaisColetados: true, lojaVista: true }),
};

/* ----------------------------------------------------------------------
   Hash perceptual barato: reduz o PNG a uma assinatura por amostragem dos
   bytes em passos largos. Frames visualmente iguais -> hash igual. Nao e
   criptografico; e so para distinguir "mexeu" de "morto". Para robustez
   contra ruido de compressao, usamos o tamanho do PNG + um digest de
   bytes amostrados: quando o conteudo muda, ambos mudam.
---------------------------------------------------------------------- */
function assinaturaFrame(buf) {
  const h = createHash('sha1');
  const passo = Math.max(1, Math.floor(buf.length / 4096));
  for (let i = 0; i < buf.length; i += passo) h.update(buf.subarray(i, i + 1));
  return `${buf.length}:${h.digest('hex').slice(0, 16)}`;
}

/** Quantos frames distintos numa rajada (pela assinatura). */
function distintos(assinaturas) {
  return new Set(assinaturas).size;
}

const NUM_FRAMES = 14; /* >= 12, com folga */
const INTERVALO = 80; /* ~80ms entre frames (a rajada da regra) */

/**
 * Grava uma rajada de frames numa pagina ja posicionada na cena.
 * `antesDeCadaFrame(i)` pode disparar toques/avancos no meio da rajada.
 * Devolve { arquivos, assinaturas, distintos }.
 */
async function rajada(page, nome, { antesDeCadaFrame } = {}) {
  const assinaturas = [];
  const arquivos = [];
  for (let i = 0; i < NUM_FRAMES; i++) {
    if (antesDeCadaFrame) await antesDeCadaFrame(i);
    const buf = await page.screenshot();
    const arq = path.join(outDir, `${nome}-f${String(i).padStart(2, '0')}.png`);
    writeFileSync(arq, buf);
    arquivos.push(path.basename(arq));
    assinaturas.push(assinaturaFrame(buf));
    if (i < NUM_FRAMES - 1) await page.waitForTimeout(INTERVALO);
  }
  return { nome, arquivos, assinaturas, distintos: distintos(assinaturas) };
}

/* Move o video gravado pelo contexto para um nome legivel. */
async function fecharComVideo(ctx, page, nomeVideo) {
  const video = page.video();
  await ctx.close();
  if (!video) return null;
  try {
    const origem = await video.path();
    const destino = path.join(outDir, `${nomeVideo}.webm`);
    renameSync(origem, destino);
    return path.basename(destino);
  } catch {
    return null;
  }
}

async function novoContexto(seed, { reduzMotion = false } = {}) {
  const ctx = await browser.newContext({
    viewport: VP,
    deviceScaleFactor: 1, /* leve: a rajada nao precisa de 2x */
    locale: 'pt-BR',
    isMobile: true,
    hasTouch: true,
    reducedMotion: reduzMotion ? 'reduce' : 'no-preference',
    recordVideo: { dir: outDir, size: VP },
  });
  if (seed) {
    await ctx.addInitScript((s) => {
      try {
        localStorage.setItem('tp.v1', s.estado);
        localStorage.setItem('tp.ftue.v1', s.flags);
      } catch {
        /* sem storage */
      }
    }, seed);
  } else {
    await ctx.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        /* sem storage */
      }
    });
  }
  return ctx;
}

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}

const relatorio = { microaula: null, cenas: [], reducedMotion: null, problemas: [] };

/* ====================================================================== */
/* (a) MICRO-AULA GSAP INTEIRA: avanca por toque, capturando a transicao  */
/* ====================================================================== */
{
  const ctx = await novoContexto(SEED_APP);
  const page = await ctx.newPage();
  await page.goto(`${base}/licao/u2-l1?cena=microaula`, { waitUntil: 'load' }).catch(() => {});
  /* Espera o palco aparecer (a cena existe se ha roteiro para a unidade) */
  const palco = page.locator('.tchin-cena-toque').first();
  await palco.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});

  const nPassos = await page.locator('.tchin-cena-dot').count();

  /* Rajada do passo 1 inteiro: entrada -> pausa (mascote, prop, fala
     palavra a palavra). Frames distintos = ritmo de entrada vivo. */
  const passo1 = await rajada(page, 'microaula-passo1-entrada');

  /* Para capturar a TRANSICAO de verdade (saida do passo 1 em overlap com
     a entrada do passo 2), o passo 1 precisa estar PRONTO antes do toque:
     tocar antes de pronto so completa a entrada (progress(1)) e nao
     avanca. Espera a affordance "Toque para continuar" aparecer. */
  const hintTransicao = page.locator('.tchin-cena-hint-visivel').first();
  await hintTransicao.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
  const dotsAntesTransicao = await page.locator('.tchin-cena-dot-ativa').count();

  /* Toca no f0 com o passo pronto: a rajada captura o overlap se
     desenrolando (passo 1 saindo, passo 2 entrando). */
  const transicao = await rajada(page, 'microaula-transicao-1-2', {
    antesDeCadaFrame: async (i) => {
      if (i === 0) await palco.click({ position: { x: 180, y: 120 } }).catch(() => {});
    },
  });
  const dotsDepoisTransicao = await page.locator('.tchin-cena-dot-ativa').count();

  /* Avanca o resto da micro-aula passo a passo, por toque, ate o fim.
     Prova: avanco por TOQUE, nunca autoplay (cada toque muda o passo).
     Espera o passo ficar PRONTO (a affordance "Toque para continuar"
     so aparece em prontoRef.current) antes de tocar, senao o toque so
     completa a entrada na hora (progress(1)) e nao avanca - que e o
     comportamento correto, mas confunde a contagem de dots. */
  /* A transicao ja levou ao passo 2 (dots=2). Daqui ate o ultimo passo,
     toca a toque enquanto houver proximo. Guarda contra loop infinito. */
  const hint = page.locator('.tchin-cena-hint-visivel');
  const dotsPorPasso = [];
  for (let guarda = 0; guarda < nPassos + 2; guarda++) {
    const ativasAntes = await page.locator('.tchin-cena-dot-ativa').count();
    if (ativasAntes >= nPassos) break; /* ja no ultimo passo */
    const pronto = await hint
      .first()
      .waitFor({ state: 'visible', timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    await palco.click({ position: { x: 180, y: 120 } }).catch(() => {});
    await page.waitForTimeout(450);
    const ativasDepois = await page.locator('.tchin-cena-dot-ativa').count();
    dotsPorPasso.push({ passo: ativasAntes + 1, pronto, ativasAntes, ativasDepois });
  }

  const videoMicro = await fecharComVideo(ctx, page, 'microaula-inteira');

  const transicaoAvancou = dotsDepoisTransicao > dotsAntesTransicao;

  relatorio.microaula = {
    nPassos,
    passo1Distintos: passo1.distintos,
    transicaoDistintos: transicao.distintos,
    transicaoAvancou,
    dotsTransicao: { antes: dotsAntesTransicao, depois: dotsDepoisTransicao },
    avancoPorToque: dotsPorPasso,
    video: videoMicro,
    frames: { passo1: passo1.arquivos, transicao: transicao.arquivos },
  };

  /* Vereditos da micro-aula */
  if (passo1.distintos < 8) {
    relatorio.problemas.push(
      `MICRO-AULA: entrada do passo 1 tem so ${passo1.distintos}/${NUM_FRAMES} frames distintos (esperado ritmo vivo, >=8).`,
    );
  }
  /* A transicao tem de AVANCAR de fato (dot ativa sobe): senao a rajada
     so capturou o passo 1 assentando, nao o overlap 1->2. */
  if (!transicaoAvancou) {
    relatorio.problemas.push(
      `MICRO-AULA: a rajada de transicao nao avancou de passo (dots ${dotsAntesTransicao}->${dotsDepoisTransicao}); o overlap 1->2 nao foi capturado.`,
    );
  }
  if (transicao.distintos < 6) {
    relatorio.problemas.push(
      `MICRO-AULA: transicao passo 1->2 tem so ${transicao.distintos}/${NUM_FRAMES} frames distintos (esperado overlap visivel, >=6).`,
    );
  }
  /* Avanco por toque: um toque num passo PRONTO (affordance visivel) tem
     de avancar (dot ativa sobe). Tocar antes de pronto so completa a
     entrada (correto), entao so cobramos avanco quando pronto=true. */
  const travados = dotsPorPasso.filter((d) => d.pronto && d.ativasDepois <= d.ativasAntes);
  if (travados.length > 0) {
    relatorio.problemas.push(
      `MICRO-AULA: ${travados.length} toque(s) num passo pronto nao avancaram (travou).`,
    );
  }
  /* Anti-autoplay: o ultimo passo da rajada de entrada (passo 1) ficou
     no mesmo indice ate o toque; se algum passo "avancou sozinho" antes
     do toque a contagem teria pulado. A progressao total tem de ir de 1
     ate nPassos (chegou ao fim toque a toque). */
  const chegouAoFim = dotsPorPasso.length === 0 || dotsPorPasso[dotsPorPasso.length - 1].ativasDepois >= nPassos;
  if (nPassos > 1 && !chegouAoFim) {
    relatorio.problemas.push(
      `MICRO-AULA: a progressao por toque nao chegou ao ultimo passo (${nPassos}); algo travou no meio.`,
    );
  }
}

/* ====================================================================== */
/* (b) CADA CENA INTERATIVA: rajada de IDLE e rajada de REACAO ao toque    */
/* ====================================================================== */

/* Uma cena por habilidade, na rota de demo que a faz aparecer (mesma
   tabela de shots.mjs, secao "Cenas por habilidade"). */
const CENAS = [
  { hab: 'tanino', rota: '/licao/u1-l1?cena=mc' },
  { hab: 'acidez', rota: '/licao/u1-l2?cena=slider' },
  { hab: 'corpo', rota: '/licao/u1-l3?cena=slider' },
  { hab: 'docura', rota: '/licao/u1-l4?cena=mc' },
  { hab: 'frutado', rota: '/licao/u2-l2?cena=swipe' },
  { hab: 'rotulo', rota: '/licao/u4-l1?cena=mc' },
  { hab: 'harmonizacao', rota: '/licao/u5-l1?cena=mc' },
];

for (const cena of CENAS) {
  const ctx = await novoContexto(SEED_CENAS);
  const page = await ctx.newPage();
  await page.goto(`${base}${cena.rota}`, { waitUntil: 'load' }).catch(() => {});

  const svg = page.locator('.cena-svg').first();
  const presente = await svg.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);

  const reg = { habilidade: cena.hab, rota: cena.rota, presente };
  if (!presente) {
    relatorio.problemas.push(`CENA ${cena.hab}: .cena-svg nao apareceu em ${cena.rota} (cena ausente).`);
    relatorio.cenas.push(reg);
    await fecharComVideo(ctx, page, `cena-${cena.hab}`);
    continue;
  }

  /* Recorta a rajada na area da cena (so o cartao), para o hash medir o
     movimento da cena, nao do resto da tela. */
  const box = await svg.boundingBox();
  const clip = box
    ? {
        x: Math.max(0, box.x - 8),
        y: Math.max(0, box.y - 8),
        width: Math.min(VP.width, box.width + 16),
        height: Math.min(VP.height, box.height + 16),
      }
    : undefined;

  const tirar = async (nome) => {
    const assinaturas = [];
    const arquivos = [];
    for (let i = 0; i < NUM_FRAMES; i++) {
      const buf = await page.screenshot(clip ? { clip } : {});
      const arq = path.join(outDir, `${nome}-f${String(i).padStart(2, '0')}.png`);
      writeFileSync(arq, buf);
      arquivos.push(path.basename(arq));
      assinaturas.push(assinaturaFrame(buf));
      if (i < NUM_FRAMES - 1) await page.waitForTimeout(INTERVALO);
    }
    return { arquivos, assinaturas, distintos: distintos(assinaturas) };
  };

  /* 1) IDLE: sem tocar, so a vida continua (vapor sobe, limao respira...) */
  await page.waitForTimeout(400);
  const idle = await tirar(`cena-${cena.hab}-idle`);

  /* 2) REACAO: dispara o toque no centro da cena e grava o que acontece.
     pointerdown e o gatilho (onPointerDown no <svg>). */
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
  }
  const reacao = await tirar(`cena-${cena.hab}-reacao`);

  /* Comparacao idle x reacao: a reacao precisa diferir do idle (frames
     diferentes), senao o toque nao fez nada. */
  const idleSet = new Set(idle.assinaturas);
  const reacaoNova = reacao.assinaturas.filter((a) => !idleSet.has(a)).length;

  const video = await fecharComVideo(ctx, page, `cena-${cena.hab}`);

  reg.idleDistintos = idle.distintos;
  reg.reacaoDistintos = reacao.distintos;
  reg.reacaoFramesNovos = reacaoNova;
  reg.video = video;
  relatorio.cenas.push(reg);

  if (idle.distintos < 3) {
    relatorio.problemas.push(
      `CENA ${cena.hab}: IDLE com so ${idle.distintos}/${NUM_FRAMES} frames distintos (idle morto: sem vida continua).`,
    );
  }
  if (reacao.distintos < 4 || reacaoNova < 2) {
    relatorio.problemas.push(
      `CENA ${cena.hab}: REACAO fraca (${reacao.distintos} distintos, ${reacaoNova} frames novos vs idle): o toque quase nao mexeu na cena.`,
    );
  }
}

/* ====================================================================== */
/* (c) CONTROLE prefers-reduced-motion: idle precisa CONGELAR              */
/* ====================================================================== */
{
  const ctx = await novoContexto(SEED_CENAS, { reduzMotion: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/licao/u1-l1?cena=mc`, { waitUntil: 'load' }).catch(() => {});
  const svg = page.locator('.cena-svg').first();
  const ok = await svg.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);

  let idleRM = null;
  if (ok) {
    const box = await svg.boundingBox();
    const clip = box
      ? { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 }
      : undefined;
    const assinaturas = [];
    for (let i = 0; i < NUM_FRAMES; i++) {
      const buf = await page.screenshot(clip ? { clip } : {});
      assinaturas.push(assinaturaFrame(buf));
      if (i < NUM_FRAMES - 1) await page.waitForTimeout(INTERVALO);
    }
    idleRM = distintos(assinaturas);
  }
  await fecharComVideo(ctx, page, 'cena-tanino-reduced-motion');
  relatorio.reducedMotion = { presente: ok, idleDistintos: idleRM };
  /* Com reduced motion, o idle NAO deve animar: idealmente 1 frame
     distinto (congelado). 1-2 e aceitavel (ruido de compressao). */
  if (ok && idleRM !== null && idleRM > 2) {
    relatorio.problemas.push(
      `REDUCED-MOTION: cena ainda anima no idle (${idleRM} frames distintos); deveria congelar.`,
    );
  }
}

await browser.close();
server.httpServer.close();

/* Limpa videos orfaos do contexto (Playwright as vezes deixa .webm sem nome) */
try {
  for (const f of readdirSync(outDir)) {
    if (f.endsWith('.webm') && /^[a-f0-9]{20,}\.webm$/i.test(f)) rmSync(path.join(outDir, f));
  }
} catch {
  /* ignora */
}

writeFileSync(path.join(outDir, 'relatorio.json'), JSON.stringify(relatorio, null, 2));

/* ---------------------------- VEREDITO -------------------------------- */
console.log('\n================= GATE DE MOTION (rajada de frames) =================');
console.log(`Frames por rajada: ${NUM_FRAMES} a ~${INTERVALO}ms. Saida: ${outDir}\n`);

if (relatorio.microaula) {
  const m = relatorio.microaula;
  console.log(
    `MICRO-AULA (u2-l1, ${m.nPassos} passos): entrada passo1 ${m.passo1Distintos}/${NUM_FRAMES} distintos, ` +
      `transicao ${m.transicaoDistintos}/${NUM_FRAMES} distintos, video=${m.video ?? 'nao'}`,
  );
}
for (const c of relatorio.cenas) {
  if (!c.presente) {
    console.log(`CENA ${c.habilidade}: AUSENTE (${c.rota})`);
    continue;
  }
  console.log(
    `CENA ${c.habilidade}: idle ${c.idleDistintos}/${NUM_FRAMES}, ` +
      `reacao ${c.reacaoDistintos}/${NUM_FRAMES} (${c.reacaoFramesNovos} novos vs idle)`,
  );
}
if (relatorio.reducedMotion) {
  console.log(
    `REDUCED-MOTION: idle ${relatorio.reducedMotion.idleDistintos}/${NUM_FRAMES} distintos (esperado ~1, congelado)`,
  );
}

console.log('\n--- PROBLEMAS ---');
if (relatorio.problemas.length === 0) {
  console.log('nenhum: todas as rajadas tem frames distintos (nada morto).');
} else {
  for (const p of relatorio.problemas) console.log(`  - ${p}`);
}

const veredito = relatorio.problemas.length === 0 ? 'PASS' : 'REPROVA';
console.log(`\nVEREDITO DO GATE: ${veredito}`);
process.exitCode = relatorio.problemas.length === 0 ? 0 : 1;
