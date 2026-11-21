// Opens every built page in Chrome at 360/768/1280px, fails on horizontal overflow, saves screenshots.
// Run after a build: npm run layout            (all pages)
//                    npm run layout -- / /id/  (only these routes)
//                    WIDTHS=360 npm run layout
import { spawn } from 'node:child_process';
import { readdirSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = new URL('../', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SHOTS = join(ROOT, '.layout-shots');
const PORT = 4399;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIDTHS = (process.env.WIDTHS || '360,768,1280').split(',').map(Number);

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const allRoutes = walk(DIST)
  .filter((f) => f.endsWith('index.html'))
  .map((f) => '/' + relative(DIST, f).replace(/index\.html$/, ''))
  .sort();
const wanted = process.argv.slice(2);
const routes = wanted.length ? allRoutes.filter((r) => wanted.includes(r)) : allRoutes;

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview server did not start');
}

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
await waitUp();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const failures = [];
for (const route of routes) {
  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0' });
    // scroll to the bottom in steps so lazy images load before the screenshot
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
      const settle = (i) => (i.complete ? 0 : Promise.race([new Promise((r) => { i.onload = i.onerror = r; }), new Promise((r) => setTimeout(r, 2500))]));
      await Promise.all([...document.images].map(settle));
    });
    const over = await page.evaluate(() => {
      const de = document.documentElement;
      const bad = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > de.clientWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 3).map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
      return { overflow: de.scrollWidth > de.clientWidth, sw: de.scrollWidth, cw: de.clientWidth, bad };
    });
    if (over.overflow) failures.push(`${route} @${w}px: scrollWidth ${over.sw} > ${over.cw} (${over.bad.join(', ')})`);
    const name = (route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '_')) + `-${w}.png`;
    await page.screenshot({ path: join(SHOTS, name), fullPage: true });
    await page.close();
  }
}
await browser.close();
stop();
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`ok: ${routes.length} page(s) x ${WIDTHS.join('/')}px, no horizontal overflow. Screenshots: ${SHOTS}`);
