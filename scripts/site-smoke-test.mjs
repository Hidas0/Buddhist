/**
 * Smoke-тест сайта: загрузка страниц, overflow на mobile, мобильное меню.
 * Запуск: node scripts/site-smoke-test.mjs
 */
import { chromium, devices } from "playwright";

const BASE = process.env.SITE_URL || "http://localhost:3456";
const PAGES = [
  "/index.html",
  "/catalog.html",
  "/map.html",
  "/media.html",
  "/audio.html",
  "/kalm.html",
  "/video-player.html",
];

const iPhone = devices["iPhone 13"];
const desktop = { viewport: { width: 1280, height: 800 } };

function rel(path) {
  return path.replace(/^\//, "");
}

async function testPage(browser, pagePath, device) {
  const ctx = await browser.newContext(device);
  const page = await ctx.newPage();
  const url = `${BASE}${pagePath}`;
  const errors = [];
  const warnings = [];

  page.on("pageerror", (e) => errors.push(`JS: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      if (!/favicon|404.*config\.local|openrouter|ymaps|Failed to load resource/i.test(t)) {
        warnings.push(`Console: ${t}`);
      }
    }
  });

  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = res?.status() ?? 0;
  } catch (e) {
    errors.push(`Load: ${e.message}`);
  }

  await page.waitForTimeout(800);

  const overflow = await page.evaluate(() => {
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { scrollWidth: sw, clientWidth: cw, overflow: sw - cw };
  });

  if (overflow.overflow > 2) {
    warnings.push(`Horizontal overflow: ${overflow.overflow}px`);
  }

  if (device.isMobile) {
    const toggle = page.locator("[data-mobile-nav-toggle]");
    if ((await toggle.count()) > 0) {
      await toggle.click();
      await page.waitForTimeout(200);
      const open = await page.locator("[data-mobile-nav-panel].open").count();
      if (open !== 1) warnings.push("Mobile nav did not open");
      await page.keyboard.press("Escape");
    }
  }

  await ctx.close();
  return { pagePath, status, errors, warnings, device: device.isMobile ? "mobile" : "desktop" };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const p of PAGES) {
    results.push(await testPage(browser, p, { ...iPhone, isMobile: true }));
    results.push(await testPage(browser, p, { ...desktop, isMobile: false }));
  }

  await browser.close();

  let fail = 0;
  for (const r of results) {
    const ok = r.status === 200 && r.errors.length === 0;
    if (!ok) fail++;
    console.log(
      `${ok ? "OK" : "FAIL"} [${r.device}] ${r.pagePath} HTTP ${r.status}`
    );
    r.errors.forEach((e) => console.log(`  ERR: ${e}`));
    r.warnings.forEach((w) => console.log(`  WARN: ${w}`));
  }

  console.log(`\nTotal: ${results.length}, issues: ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
