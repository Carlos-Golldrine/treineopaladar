import { createRequire } from "node:module";
const require = createRequire("file:///C:/Users/camargo/tchin-tchin-app/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("requestfailed", r => console.log("FAIL:", r.url(), r.failure()?.errorText));
page.on("console", m => console.log("CONSOLE:", m.text()));
await page.goto("file:///C:/Users/camargo/Downloads/treino-paladar-app/lp/mercado/index.html", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const img = document.querySelector(".rodape .by img");
  return { src: img.currentSrc, complete: img.complete, nw: img.naturalWidth, nh: img.naturalHeight,
           w: img.clientWidth, h: img.clientHeight };
});
console.log(info);
await browser.close();
