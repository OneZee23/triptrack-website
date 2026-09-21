#!/usr/bin/env node
/**
 * Walks the BUILT pages in a real browser at the widths people actually hold
 * and fails on the two layout bugs that make a site read as broken before
 * anyone can say why:
 *
 *   1. the page is wider than the screen (`scrollWidth > innerWidth`) — one
 *      overflowing element gives the whole document a sideways scroll;
 *   2. a link or button smaller than 44 px in either direction — Apple's own
 *      minimum, and the difference between "tap" and "aim";
 *   3. the page's <h1> sitting underneath the fixed header. The header does
 *      not take a row of its own, so every page clears it with its own top
 *      padding — and a padding trimmed for a phone stops clearing it without
 *      breaking anything a test would otherwise notice.
 *
 * Both are checked per page PER LANGUAGE, because Russian strings run ~25 %
 * longer than English and the widths they break at are not the same ones.
 *
 * Prose links (`display: inline`, a word inside a sentence) are exempt from
 * the 44 px rule on purpose: growing them to 44 px would mean 44 px line
 * height in body copy. Everything laid out as a control — block, flex, grid,
 * inline-flex, inline-block — is not exempt.
 *
 * Needs a Chromium. `npm i -D playwright` provides one; without it the script
 * says so and exits 0, so a machine that cannot run a browser does not fail
 * the build over a check it could not perform.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Widths: two phones, a large phone, tablet portrait, tablet landscape, laptop. */
const WIDTHS = [360, 390, 430, 768, 1024, 1280];

/** Every prerendered marketing page, in both languages, plus the 404. */
const PATHS = [
  '', 'features', 'download', 'google-timeline-alternative',
  'fog-of-war-map', 'about', 'roadmap', 'privacy',
];
const PAGES = [
  ...PATHS.map((p) => `/${p}`),
  ...PATHS.map((p) => `/ru/${p}`),
  '/app/login',
  '/ru/app/login',
];

/**
 * Pages that are NOT prerendered get the home page as an SPA shell, so when
 * one of them fails to render the browser shows the home page and nothing
 * looks broken — no error, no blank screen, correct-looking layout. These
 * expectations are the only thing that tells the difference.
 */
const MUST_CONTAIN = {
  '/app/login': 'Apple',
  '/ru/app/login': 'Apple',
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml',
};

const isFile = async (p) => {
  try { return (await stat(p)).isFile(); } catch { return false; }
};

/** Serves dist/ the way nginx does: a directory is its index.html, misses are the SPA shell. */
async function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const candidates = [
      join(DIST, url.pathname),
      join(DIST, url.pathname, 'index.html'),
      join(DIST, 'index.html'),
    ];
    for (const file of candidates) {
      if (!file.startsWith(DIST) || !(await isFile(file))) continue;
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(await readFile(file));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

function loadChromium() {
  // PLAYWRIGHT_PATH points at a node_modules directory that already has one —
  // the usual case here, since playwright is deliberately NOT a devDependency:
  // its postinstall downloads ~500 MB of browsers into every CI image and
  // Docker layer that only ever runs `vite build`.
  const roots = [process.env.PLAYWRIGHT_PATH, ROOT + '/', import.meta.url].filter(Boolean);
  for (const from of roots) {
    const at = from.endsWith('/') || from.startsWith('file:') ? from : from + '/';
    try { return createRequire(at)('playwright').chromium; } catch { /* next */ }
  }
  return null;
}

const chromium = loadChromium();
if (!chromium) {
  console.log('check-mobile: no Chromium found — skipped. Point PLAYWRIGHT_PATH at a node_modules that has playwright, or `npm i -D playwright`.');
  process.exit(0);
}

/** What the page reports about itself, measured inside the browser. */
const AUDIT = `(() => {
  const doc = document.documentElement;
  const overflow = doc.scrollWidth - window.innerWidth;
  const wide = [];
  if (overflow > 1) {
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right <= window.innerWidth + 1 && r.left >= -1) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      wide.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '')
        + ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      if (wide.length >= 5) break;
    }
  }
  // The header is fixed, so nothing is pushed down by it; a page that trims
  // its top padding slides its own heading underneath.
  let buried = null;
  const header = document.querySelector('header');
  const h1 = document.querySelector('h1');
  if (header && h1) {
    const hb = header.getBoundingClientRect().bottom;
    const tb = h1.getBoundingClientRect().top;
    if (tb < hb - 0.5) buried = Math.round(hb - tb);
  }
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, [role="button"], summary')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.display === 'inline') continue;
    if (el.closest('[hidden]') || el.getAttribute('aria-hidden') === 'true') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (Math.min(r.width, r.height) >= 43.5) continue;
    small.push(el.tagName.toLowerCase() + ' "' + (el.textContent || el.ariaLabel || '').trim().slice(0, 24)
      + '" ' + Math.round(r.width) + '×' + Math.round(r.height));
    if (small.length >= 6) break;
  }
  return { overflow, wide, small, buried };
})()`;

const { server, base } = await serve();
const browser = await chromium.launch();
const problems = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 768,
    hasTouch: width < 768,
    deviceScaleFactor: 2,
    // The globe is WebGL, a tile fetch and a spin — none of it is layout, and
    // all of it is flaky in a headless run. The page renders its poster instead.
    reducedMotion: 'reduce',
  });
  await ctx.route('**/api/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await ctx.route('**/analytics.trip-track.app/**', (r) => r.fulfill({ status: 200, body: '' }));
  await ctx.route('**/tiles.openfreemap.org/**', (r) => r.abort());
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: 'load' });
    await page.waitForTimeout(350);
    const { overflow, wide, small, buried } = await page.evaluate(AUDIT);
    const where = `${path || '/'} @ ${width}px`;
    const needle = MUST_CONTAIN[path];
    if (needle && !(await page.evaluate((n) => document.body.innerText.includes(n), needle))) {
      problems.push(`${where}: page did not render — no "${needle}" on it (the SPA shell's home page is what you are looking at)`);
    }
    if (overflow > 1) problems.push(`${where}: page is ${overflow}px wider than the screen — ${wide.join('; ') || 'source not identified'}`);
    if (buried) problems.push(`${where}: the <h1> runs ${buried}px under the fixed header`);
    for (const s of small) problems.push(`${where}: tap target under 44px — ${s}`);
  }
  await ctx.close();
}

await browser.close();
server.close();

if (problems.length) {
  console.error(`check-mobile: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`check-mobile: ${PAGES.length} pages × ${WIDTHS.length} widths — no overflow, no small tap targets, no heading under the header.`);
