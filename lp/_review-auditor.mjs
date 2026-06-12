// Script proprio do revisor (independente do _shots.mjs do construtor)
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire("file:///C:/Users/camargo/tchin-tchin-app/package.json");
const { chromium } = require("playwright");

const ROOT = "C:/Users/camargo/Downloads/treino-paladar-app/lp";
const OUT = join(ROOT, "_review_auditor");
await mkdir(OUT, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  try {
    const file = join(ROOT, p);
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(8765, r));

const pages = ["", "mercado/", "conversa/", "ocasiao/", "treino/", "desafio/", "trabalho/"];
const browser = await chromium.launch();
const report = [];

for (const slug of pages) {
  const name = slug ? slug.replace("/", "") : "indice";
  for (const [label, vw, vh] of [["mob", 412, 892], ["desk", 1280, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
    const page = await ctx.newPage();
    const reqs = [];
    page.on("response", async (r) => {
      try {
        const body = await r.body().catch(() => Buffer.alloc(0));
        reqs.push({ url: r.url(), status: r.status(), bytes: body.length });
      } catch {}
    });
    await page.goto(`http://localhost:8765/${slug}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      await new Promise(done => {
        let y = 0;
        const step = () => {
          y += 600; window.scrollTo({ top: y, behavior: "instant" });
          if (y < document.body.scrollHeight) setTimeout(step, 80);
          else { window.scrollTo({ top: 0, behavior: "instant" }); setTimeout(done, 600); }
        };
        step();
      });
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    // broken images?
    const imgs = await page.$$eval("img", els => els.map(e => ({ src: e.getAttribute("src"), ok: e.complete && e.naturalWidth > 0, w: e.naturalWidth, h: e.naturalHeight })));
    const external = reqs.filter(r => !r.url.startsWith("http://localhost:8765"));
    const failed = reqs.filter(r => r.status >= 400);
    const totalKB = Math.round(reqs.reduce((s, r) => s + r.bytes, 0) / 1024);
    const fontsLoaded = await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style} ${f.status}`));
    await page.screenshot({ path: join(OUT, `${name}-${label}.png`), fullPage: true });
    report.push({ page: name, viewport: label, totalKB, external: external.map(e => e.url), failed: failed.map(f => f.url), brokenImgs: imgs.filter(i => !i.ok), fontsLoaded });
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(report, null, 1));
