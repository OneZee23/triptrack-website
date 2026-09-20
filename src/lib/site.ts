/**
 * The site's address book: which pages exist, which languages they exist in,
 * and how a path is spelled in each one.
 *
 * Language lives in the PATH (`/features` is English, `/ru/features` is
 * Russian) so every page has its own URL, its own `hreflang` pair and its own
 * entry in the sitemap. `?lang=` and `localStorage` survive only as a one-time
 * redirect for links handed out before this wave.
 *
 * Everything here is a pure function over strings on purpose: the prerender
 * script, the sitemap generator and the running app must all agree on what a
 * URL looks like, and the only way to guarantee that is to have one place that
 * decides it.
 */

export const SITE_URL = 'https://trip-track.app';

export const LANGS = ['en', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

/** The language that gets no prefix. */
export const DEFAULT_LANG: Lang = 'en';

/** Prefix of every non-default language, without a trailing slash. */
export const LANG_PREFIX: Record<Lang, string> = { en: '', ru: '/ru' };

/**
 * Every indexable page, spelled the English way (no prefix). The order is the
 * order they appear in the sitemap, most important first.
 */
export const ROUTES = [
  '/',
  '/features',
  '/download',
  '/google-timeline-alternative',
  '/fog-of-war-map',
  '/about',
  '/roadmap',
  '/privacy',
] as const;
export type Route = (typeof ROUTES)[number];

/** Sitemap weight per route. Not SEO magic — just an honest ordering. */
export const ROUTE_PRIORITY: Record<Route, { priority: string; changefreq: string }> = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/features': { priority: '0.9', changefreq: 'monthly' },
  '/download': { priority: '0.9', changefreq: 'monthly' },
  '/google-timeline-alternative': { priority: '0.8', changefreq: 'monthly' },
  '/fog-of-war-map': { priority: '0.8', changefreq: 'monthly' },
  '/about': { priority: '0.6', changefreq: 'monthly' },
  '/roadmap': { priority: '0.7', changefreq: 'weekly' },
  '/privacy': { priority: '0.4', changefreq: 'yearly' },
};

export function isRoute(path: string): path is Route {
  return (ROUTES as readonly string[]).includes(path);
}

/** Strip the trailing slash off anything but the root. */
function trimTrailing(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') || '/' : path;
}

/**
 * Which language a pathname is written in. `/ru`, `/ru/` and `/ru/features`
 * are Russian; `/ruby` is not — the prefix has to be a whole segment.
 */
export function langFromPath(pathname: string): Lang {
  return pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'en';
}

/**
 * The English spelling of a pathname: `/ru/features` → `/features`,
 * `/ru` → `/`. Unknown paths come back unchanged (the 404 needs them).
 */
export function routeFromPath(pathname: string): string {
  const lang = langFromPath(pathname);
  const bare = lang === 'en' ? pathname : pathname.slice(LANG_PREFIX[lang].length) || '/';
  return trimTrailing(bare) || '/';
}

/**
 * The one helper every internal link goes through. `path` is always the
 * English spelling; the current language decides the prefix.
 */
export function href(path: string, lang: Lang): string {
  const bare = trimTrailing(path.startsWith('/') ? path : `/${path}`);
  if (lang === DEFAULT_LANG) return bare;
  return bare === '/' ? `${LANG_PREFIX[lang]}/` : `${LANG_PREFIX[lang]}${bare}`;
}

/**
 * The same page in the other language, keeping whatever page the person is on
 * (including query and hash, which are theirs, not ours).
 */
export function switchLangPath(pathname: string, to: Lang): string {
  return href(routeFromPath(pathname), to);
}

/** Absolute URL for `<link rel=canonical>`, `og:url` and the sitemap. */
export function canonicalUrl(path: string, lang: Lang): string {
  return `${SITE_URL}${href(path, lang)}`;
}
