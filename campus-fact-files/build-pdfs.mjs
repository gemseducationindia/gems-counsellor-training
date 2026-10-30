// Makes pdf/<slug>.pdf for every live campus from the site's print layout.
// Run from this folder: node build-pdfs.mjs
import { createRequire } from "module";
import { mkdirSync, readFileSync } from "fs";
import { pathToFileURL, fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(dir, "campuses.js"), "utf8");
const live = [...src.matchAll(/slug:\s*"([^"]+)",\s*\n?\s*live:\s*true/g)].map(m => m[1]);

mkdirSync(path.join(dir, "pdf"), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const slug of live) {
  await page.goto(pathToFileURL(path.join(dir, "index.html")).href + "#" + slug, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.pdf({ path: path.join(dir, "pdf", slug + ".pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log("built pdf/" + slug + ".pdf");
}
await browser.close();
