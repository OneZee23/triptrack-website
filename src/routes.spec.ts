import { describe, expect, it } from 'vitest';
import { PAGE_PATHS } from './routes';
import { href, LANGS, ROUTES } from './lib/site';
import { PAGE_META } from './lib/meta';

describe('the route tree and the sitemap describe the same site', () => {
  it('has a reachable page for every route the sitemap lists', () => {
    const reachable = PAGE_PATHS.map(({ path }) => (path === '' ? '/' : `/${path}`)).sort();
    expect(reachable).toEqual([...ROUTES].sort());
  });

  it('has meta for every reachable page, in both languages', () => {
    for (const { path } of PAGE_PATHS) {
      const route = (path === '' ? '/' : `/${path}`) as (typeof ROUTES)[number];
      for (const lang of LANGS) expect(PAGE_META[route][lang].title, route).toBeTruthy();
    }
  });

  it('mounts the Russian pages under the prefix the links use', () => {
    for (const { path } of PAGE_PATHS) {
      const route = path === '' ? '/' : `/${path}`;
      expect(href(route, 'ru')).toBe(path === '' ? '/ru/' : `/ru/${path}`);
    }
  });
});
