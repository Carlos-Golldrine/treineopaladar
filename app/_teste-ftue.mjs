// Teste manual do fluxo REAL do FTUE (engine de verdade, store limpo).
// Uso: npm run build && node _teste-ftue.mjs
import { createRequire } from 'module';
import { preview } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/camargo/tchin-tchin-app/node_modules/playwright-core');

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = 4174;
const server = await preview({ root, preview: { port: PORT, strictPort: true } });

let browser;
try {
  browser = await chromium.launch();
} catch {
  browser = await chromium.launch({ channel: 'msedge' });
}
const ctx = await browser.newContext({
  viewport: { width: 412, height: 892 },
  locale: 'pt-BR',
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const erros = [];
const passo = async (nome, fn) => {
  try {
    await fn();
    console.log('ok ', nome);
  } catch (e) {
    erros.push(`${nome}: ${e.message?.split('\n')[0]}`);
    console.log('ERRO', nome, e.message?.split('\n')[0]);
  }
};

await passo('1a visita redireciona ao splash', async () => {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForURL('**/comecar', { timeout: 5000 });
  await page.getByRole('button', { name: 'Começar' }).waitFor({ timeout: 5000 });
});

await passo('Comecar abre a J1', async () => {
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByText('Qual destes você serviria gelado?').waitFor({ timeout: 5000 });
});

await passo('J1 certa celebra com o mascote', async () => {
  await page.getByRole('button', { name: 'Vinho branco' }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByText('Viu? Você já sabia o começo.').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J2 sensorial', async () => {
  await page.getByText('gole de espumante bem gelado').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /Bolhas pinicando/ }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J3 objetivo com reacao e payoff', async () => {
  await page.getByText('Onde você mais quer mandar bem?').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /mercado/ }).click();
  await page.getByText('Boa. A prateleira vai virar terreno seu.').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J4 errada dispara o tooltip de vidas (e so ele)', async () => {
  await page.getByText('E o tinto, pode ir à geladeira?').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /Nunca\. Tinto se serve/ }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByText('Errou? Tranquilo. Você tem 5 vidas.').waitFor({ timeout: 3000 });
  await page.getByLabel('5 vidas').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J5 personalizada pelo objetivo (mercado)', async () => {
  await page.getByText('No mercado, o rótulo diz seco.').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /quase nada de açúcar/ }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J6 nivel aparece com 1 erro so', async () => {
  await page.getByText('Quanto você já conhece de vinho?').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Estou começando' }).click();
});

await passo('J7 consolidacao', async () => {
  await page.getByText('amigos a caminho e um espumante').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /Geladeira nele/ }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
});

await passo('J4 volta no fim (hipercorrecao) e fecha acertando', async () => {
  await page.getByText('De novo essa, agora vai').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /Os leves agradecem/ }).click();
  await page.getByRole('button', { name: 'Conferir' }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
});

await passo('Conclusao nomeia XP e oferece meta', async () => {
  await page.getByText('Seu paladar acordou.').waitFor({ timeout: 3000 });
  await page.getByText('Dia 1 da sua sequência', { exact: false }).waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /Leve/ }).click();
});

await passo('Soft wall com Depois discreto', async () => {
  await page.getByText('Salve seu progresso').waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.getByText('Contas abrem na próxima versão do beta', { exact: false }).waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'Seguir treinando' }).click();
});

await passo('Cai na Trilha, sem chip de cristais, streak 1', async () => {
  await page.waitForURL(`http://localhost:${PORT}/`, { timeout: 5000 });
  await page.getByText('Fundamentos do Paladar').waitFor({ timeout: 5000 });
  const cristais = await page.locator('.hud-gems').count();
  if (cristais !== 0) throw new Error('chip de cristais visivel antes da coleta');
  await page.getByLabel(/Sequência de 1 dia/).waitFor({ timeout: 3000 });
});

await passo('Recarregar volta direto a Trilha (onboardingCompleto)', async () => {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.getByText('Fundamentos do Paladar').waitFor({ timeout: 5000 });
  const meta = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')).wallet.metaDiaria);
  const objetivo = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')).objetivo);
  const nivel = await page.evaluate(() => JSON.parse(localStorage.getItem('tp.v1')).nivelDeclarado);
  if (meta !== 20) throw new Error(`metaDiaria=${meta}, esperado 20`);
  if (objetivo !== 'mercado') throw new Error(`objetivo=${objetivo}`);
  if (nivel !== 'iniciante') throw new Error(`nivel=${nivel}`);
});

console.log(erros.length === 0 ? '\nFTUE real: tudo verde' : `\nFalhas: ${erros.length}\n${erros.join('\n')}`);
await browser.close();
server.httpServer.close();
process.exit(erros.length === 0 ? 0 : 1);
