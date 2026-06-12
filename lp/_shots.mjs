// Screenshot loop das LPs (412 mobile + 1280 desktop), full page, via HTTP local.
// Usa o playwright de C:\Users\camargo\tchin-tchin-app\node_modules.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire("file:///C:/Users/camargo/tchin-tchin-app/package.json");
const { chromium } = require("playwright");

const here = path.dirname(fileURLToPath(import.meta.url));
const lps = ["mercado", "conversa", "ocasiao", "treino", "desafio", "trabalho"];
const PORT = 8741;

// servidor estatico raiz = lp/
const server = spawn("python", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  cwd: here, stdio: "ignore",
});
await new Promise(r => setTimeout(r, 1200));

try {
  const browser = await chromium.launch();
  for (const [w, h, tag] of [[412, 892, "mobile"], [1280, 900, "desktop"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const lp of lps) {
      await page.goto(`http://127.0.0.1:${PORT}/${lp}/`, { waitUntil: "networkidle" });
      // rolar ate o fim para disparar lazy-load, depois voltar ao topo
      await page.evaluate(async () => {
        await new Promise(done => {
          let y = 0;
          const step = () => {
            y += 800; window.scrollTo(0, y);
            if (y < document.body.scrollHeight) setTimeout(step, 60);
            else { window.scrollTo(0, 0); setTimeout(done, 250); }
          };
          step();
        });
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(here, "_review", `${lp}-${tag}.png`), fullPage: true });
      console.log(`${lp}-${tag} ok`);
    }
    await ctx.close();
  }
  await browser.close();
} finally {
  server.kill();
}
