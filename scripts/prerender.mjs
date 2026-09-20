#!/usr/bin/env node
/**
 * Turns the built SPA into a set of static pages — one per route × language —
 * without a browser.
 *
 * Input:  dist/index.html        (the client build: hashed asset tags, markers)
 *         dist-server/entry-server.js  (the same app, built for Node)
 * Output: dist/<path>/index.html with the page already rendered inside #root
 *         and a head that is right for THAT page, plus dist/404.html,
 *         dist/sitemap.xml and dist/robots.txt.
 *
 * `dist/index.html` is overwritten with the English home page: it is both the
 * page at `/` and the shell nginx falls back to for anything it has no file
 * for (the signed-in `/app` area, which is deliberately not prerendered).
 *
 * The script is plain Node on purpose. Everything it needs to know about
 * routes, meta and the sitemap it imports from the SSR bundle, so there is one
 * source of truth and no second copy of the route list to forget to update.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SERVER_ENTRY = join(ROOT, 'dist-server', 'entry-server.js');

const HEAD_MARKER = /<!--app-head-->[\s\S]*?<!--\/app-head-->/;
const BODY_MARKER = '<!--app-html-->';

const { render, buildHead, buildSitemap, buildRobots, ROUTES, LANGS, href } = await import(
  pathToFileURL(SERVER_ENTRY).href
);

const template = await readFile(join(DIST, 'index.html'), 'utf8');
if (!HEAD_MARKER.test(template)) throw new Error('index.html lost its <!--app-head--> marker');
if (!template.includes(BODY_MARKER)) throw new Error('index.html lost its <!--app-html--> marker');

/** `/ru/features` → `dist/ru/features/index.html`; `/` → `dist/index.html`. */
function fileFor(path) {
  return path === '/' ? join(DIST, 'index.html') : join(DIST, path.replace(/^\/|\/$/g, ''), 'index.html');
}

function compose({ html, head, lang }) {
  return template
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(HEAD_MARKER, `<!--app-head-->\n    ${head}\n    <!--/app-head-->`)
    .replace(BODY_MARKER, html);
}

const written = [];

for (const route of ROUTES) {
  for (const lang of LANGS) {
    const path = href(route, lang);
    const html = await render(path);
    const file = fileFor(path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, compose({ html, head: buildHead(route, lang), lang }));
    written.push([path, file]);
  }
}

// The 404 body is served by nginx for any address no file matches, so it
// cannot be language-specific — it is rendered from an English URL that no
// route claims, which is exactly the state a real 404 is in.
const notFound = await render('/this-address-does-not-exist');
await writeFile(join(DIST, '404.html'), compose({ html: notFound, head: buildHead('404', 'en'), lang: 'en' }));
written.push(['(404)', join(DIST, '404.html')]);

await writeFile(join(DIST, 'sitemap.xml'), buildSitemap());
await writeFile(join(DIST, 'robots.txt'), buildRobots());

const rel = (file) => file.slice(ROOT.length + 1);
for (const [path, file] of written) console.log(`  ${path.padEnd(32)} → ${rel(file)}`);
console.log(`  sitemap.xml, robots.txt`);
console.log(`prerendered ${written.length} pages`);
