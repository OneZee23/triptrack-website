#!/usr/bin/env node
/**
 * Reads the BUILT pages and fails the build if any of them would be a bad
 * search result. It looks at the artefact rather than at the source, because
 * everything it checks is the product of three moving parts — the route table,
 * the prerender script and the template — and only the output knows whether
 * they agreed.
 *
 * Checked per page: one <title>, a description, a canonical, an hreflang pair,
 * exactly one <h1>, <html lang> matching the path, no unreplaced markers, and
 * that every asset the page references actually exists on disk (a hash that
 * differed between the client and SSR builds would otherwise ship a broken
 * image nobody notices until a user hits it).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const problems = [];
const fail = (file, message) => problems.push(`${relative(DIST, file) || 'index.html'}: ${message}`);

async function htmlFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const count = (html, re) => (html.match(re) ?? []).length;

/** `dist/ru/features/index.html` → `/ru/features`; `dist/index.html` → `/`. */
function urlFor(file) {
  const rel = relative(DIST, file).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '(404)';
  return `/${rel.replace(/\/index\.html$/, '')}`;
}

const files = (await htmlFiles(DIST)).sort();
if (files.length === 0) problems.push('dist has no HTML at all — did the build run?');

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const url = urlFor(file);
  const is404 = url === '(404)';

  if (html.includes('<!--app-html-->')) fail(file, 'body marker was never replaced — the page has no prerendered markup');
  if (/<!--app-head-->\s*<!--\/app-head-->/.test(html)) fail(file, 'head marker was never filled in');

  const titles = count(html, /<title[\s>]/g);
  if (titles !== 1) fail(file, `${titles} <title> tags, expected exactly 1`);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (title.trim().length === 0) fail(file, 'empty <title>');
  if (title.length > 60) fail(file, `title is ${title.length} characters (max 60): "${title}"`);

  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!description) fail(file, 'no meta description');
  else if (description.length < 140 || description.length > 160) fail(file, `description is ${description.length} characters (140–160)`);

  const h1s = count(html, /<h1[\s>]/g);
  if (h1s !== 1) fail(file, `${h1s} <h1> elements, expected exactly 1`);

  const lang = html.match(/<html lang="([^"]*)"/)?.[1];
  const expected = url.startsWith('/ru') ? 'ru' : 'en';
  if (lang !== expected) fail(file, `<html lang="${lang}"> but the path says ${expected}`);

  if (is404) {
    if (!/<meta name="robots" content="noindex/.test(html)) fail(file, '404 page is not noindex');
    if (/rel="canonical"/.test(html)) fail(file, '404 page must not claim a canonical URL');
  } else {
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    if (!canonical) fail(file, 'no canonical link');
    else {
      // `/ru/` and `/ru` are the same page; anything else is a mismatch.
      const trim = (u) => (u.length > 1 ? u.replace(/\/+$/, '') : u);
      const path = canonical.replace(/^https?:\/\/[^/]+/, '');
      if (trim(path) !== trim(url)) fail(file, `canonical "${canonical}" does not match the path ${url}`);
    }

    for (const hreflang of ['en', 'ru', 'x-default']) {
      if (!html.includes(`hreflang="${hreflang}"`)) fail(file, `missing hreflang="${hreflang}"`);
    }
    if (!/<meta property="og:title"/.test(html)) fail(file, 'no og:title');
    if (!/<meta name="twitter:card"/.test(html)) fail(file, 'no twitter:card');
  }

  for (const asset of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
    if (!(await exists(join(DIST, asset[1])))) fail(file, `references ${asset[1]}, which is not in dist`);
  }
}

for (const required of ['sitemap.xml', 'robots.txt']) {
  if (!(await exists(join(DIST, required)))) problems.push(`dist/${required} is missing`);
}
const robots = (await exists(join(DIST, 'robots.txt'))) ? await readFile(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots.includes('Disallow: /app')) problems.push('robots.txt does not keep crawlers out of /app');

console.log(`check-seo: ${files.length} pages in dist`);
for (const file of files) {
  const url = urlFor(file);
  const broken = problems.some((p) => p.startsWith(`${relative(DIST, file) || 'index.html'}:`));
  console.log(`  ${broken ? 'FAIL' : ' ok '} ${url}`);
}

if (problems.length) {
  console.error(`\ncheck-seo FAILED — ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}
console.log('check-seo: all pages have a title, a description, a canonical, an hreflang pair and one h1');
