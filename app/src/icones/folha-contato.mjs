// Folha de contato do set de icones proprietarios + emblemas + logo.
// Renderiza os componentes reais (Icones.tsx / Emblemas.tsx / LogoTchin.tsx)
// via Vite SSR, gera HTML estatico e tira screenshot em _shots/icones/.
// Uso: node src/icones/folha-contato.mjs  (a partir da raiz do app)
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..', '..');
const outDir = path.join(appRoot, '_shots', 'icones');
mkdirSync(outDir, { recursive: true });

const vite = await createServer({
  root: appRoot,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const Icones = await vite.ssrLoadModule('/src/icones/Icones.tsx');
const Emblemas = await vite.ssrLoadModule('/src/icones/Emblemas.tsx');
const Logo = await vite.ssrLoadModule('/src/icones/LogoTchin.tsx');

const { Ic, NOMES_ICONES } = Icones;
const { Emblema } = Emblemas;
const { LogoTchin } = Logo;

const h = React.createElement;

const celula = (nome, tamanho, escuro) =>
  `<div class="cel${escuro ? ' escuro' : ''}">
     <div class="vis">${renderToStaticMarkup(h(Ic, { nome, size: tamanho }))}</div>
     <span class="rotulo">${nome}</span>
   </div>`;

const gradeClaro = NOMES_ICONES.map((n) => celula(n, 40, false)).join('\n');
// Amostra em chrome escuro (header/tab bar sobre wine): traco vira cream
const amostraEscura = [
  'chama-streak',
  'coracao-vida',
  'cristal',
  'taca',
  'seta-voltar',
  'x-fechar',
  'compartilhar',
  'cadeado',
]
  .map((n) => celula(n, 40, true))
  .join('\n');
// Tamanho real de uso (24px, tab bar / linhas de stats)
const tamanhoReal = NOMES_ICONES.map(
  (n) => `<span class="mini">${renderToStaticMarkup(h(Ic, { nome: n, size: 24 }))}</span>`,
).join('\n');

const emblemas = [1, 2, 3, 4, 5, 6]
  .map(
    (u) =>
      `<div class="cel"><div class="vis">${renderToStaticMarkup(
        h(Emblema, { unidade: u, size: 88 }),
      )}</div><span class="rotulo">unidade ${u}</span></div>`,
  )
  .join('\n');

const logo = renderToStaticMarkup(h(LogoTchin, { size: 40 }));

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Folha de contato: icones Treine seu Paladar</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 32px; background: #FAFAF8; color: #4A1F24;
         font: 500 13px/1.4 Segoe UI, system-ui, sans-serif; width: 1136px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 12px; color: #722F37; }
  p  { margin: 0; color: #857770; }
  .grade { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
  .cel { display: flex; flex-direction: column; align-items: center; gap: 8px;
         padding: 14px 6px 10px; background: #fff; border: 1px solid #EDE8E5;
         border-radius: 12px; }
  .cel.escuro { background: #722F37; border-color: #4A1F24; color: #FAFAF8; }
  .cel.escuro .rotulo { color: #F2E3E1; }
  .vis { display: flex; }
  .rotulo { font-size: 10.5px; color: #857770; text-align: center; }
  .linha { display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
           padding: 12px 16px; background: #fff; border: 1px solid #EDE8E5;
           border-radius: 12px; }
  .mini { display: inline-flex; }
  .logo { display: inline-flex; align-items: center; gap: 10px; color: #722F37; }
</style>
</head>
<body>
  <h1>Treine seu Paladar: set proprietario</h1>
  <p>grid 24, traco 2.25-2.5 round, duotone wine-900 + gold-500/wine-100 (1 area por icone)</p>

  <h2>Icones (40px de inspecao)</h2>
  <div class="grade">${gradeClaro}</div>

  <h2>Sobre chrome escuro (wine-700, traco herda cream)</h2>
  <div class="grade" style="grid-template-columns: repeat(8, 1fr); color: #FAFAF8;">${amostraEscura}</div>

  <h2>Tamanho real de uso (24px)</h2>
  <div class="linha">${tamanhoReal}</div>

  <h2>Emblemas de unidade (64x64, aqui a 88px)</h2>
  <div class="grade" style="grid-template-columns: repeat(6, 1fr);">${emblemas}</div>

  <h2>LogoTchin (slot provisorio tt-glasses)</h2>
  <div class="linha"><span class="logo">${logo} <strong>by Tchin Tchin</strong></span></div>
</body>
</html>`;

const htmlPath = path.join(outDir, 'folha-contato.html');
writeFileSync(htmlPath, html, 'utf8');

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(htmlPath).href);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, 'folha-contato.png'), fullPage: true });
console.log('shot', path.join(outDir, 'folha-contato.png'));

await browser.close();
await vite.close();
