/** Проверка ссылок на ресурсы и JSON (без браузера). */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PAGES = [
  "index.html",
  "catalog.html",
  "map.html",
  "media.html",
  "audio.html",
  "kalm.html",
  "video-player.html",
];

const issues = [];
const checked = new Set();

function exists(rel) {
  const p = path.join(ROOT, rel.replace(/^\//, "").split("?")[0].split("#")[0]);
  return fs.existsSync(p);
}

function extractRefs(html, page) {
  const refs = [];
  for (const m of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const u = m[1];
    if (/^(https?:|data:|mailto:|#|javascript:)/i.test(u)) continue;
    if (u.includes("config.local.js")) continue;
    refs.push(u);
  }
  for (const r of refs) {
    const key = `${page} -> ${r}`;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!exists(r)) issues.push(`MISSING [${page}]: ${r}`);
  }
}

for (const p of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, p), "utf8");
  extractRefs(html, p);
}

try {
  JSON.parse(fs.readFileSync(path.join(ROOT, "data/places.json"), "utf8"));
  console.log("OK data/places.json");
} catch (e) {
  issues.push(`INVALID data/places.json: ${e.message}`);
}

for (const js of fs.readdirSync(path.join(ROOT, "js"))) {
  if (!js.endsWith(".js")) continue;
  const src = fs.readFileSync(path.join(ROOT, "js", js), "utf8");
  try {
    new Function(src);
  } catch (e) {
    if (!js.includes("example")) issues.push(`JS SYNTAX [js/${js}]: ${e.message}`);
  }
}

console.log(`Checked ${checked.size} local refs`);
if (issues.length) {
  issues.forEach((i) => console.log(i));
  process.exit(1);
}
console.log("All checks passed");
