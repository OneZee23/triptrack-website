import { translate } from '../i18n/dict';
import { FAQ_IDS } from './faq';
import { isIndexable, NOINDEX_ROBOTS, PAGE_META, type MetaKey } from './meta';
import { canonicalUrl, DEFAULT_LANG, LANGS, ROUTE_PRIORITY, ROUTES, SITE_URL, type Lang, type Route } from './site';

/**
 * The static `<head>` of every prerendered page, and the sitemap and robots
 * that point at them.
 *
 * This runs at BUILD time (from `scripts/prerender.mjs`, through the SSR
 * bundle) and produces plain strings — there is no DOM here and no React. The
 * running app never calls it; `usePageMeta` keeps the client in step after a
 * soft navigation, from the same `PAGE_META` table.
 */

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

const OG_LOCALE: Record<Lang, string> = { en: 'en_US', ru: 'ru_RU' };

/** Short page name, used by the breadcrumbs. */
const BREADCRUMB_KEY: Record<Route, string> = {
  '/': 'page.home',
  '/features': 'page.features',
  '/download': 'page.download',
  '/google-timeline-alternative': 'page.google_timeline',
  '/fog-of-war-map': 'page.fog_of_war',
  '/about': 'page.about',
  '/roadmap': 'page.roadmap',
  '/privacy': 'page.privacy',
};

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** `</script>` inside a JSON string would end the block early. */
function jsonLd(data: unknown): string {
  const body = JSON.stringify(data, null, 0).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${body}</script>`;
}

/**
 * The app itself. Deliberately WITHOUT `aggregateRating`: the only numbers we
 * have are two App Store reviews, and shipping a 5.0/2 rating as structured
 * data is exactly the kind of invented authority this rewrite is removing.
 * It comes back when there is a real count to read.
 */
function softwareApplication(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TripTrack',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'iOS 17.0 or later',
    description: PAGE_META['/'][lang].description,
    url: canonicalUrl('/', lang),
    downloadUrl: APP_STORE_URL,
    inLanguage: lang,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Organization', name: 'OneZee', url: SITE_URL },
  };
}

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OneZee',
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    sameAs: ['https://t.me/triptrack_app', 'https://github.com/OneZee23/trip-track-ios', 'https://www.youtube.com/@onezee_dev'],
  };
}

function faqPage(lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_IDS.map((id) => ({
      '@type': 'Question',
      name: translate(lang, `home.faq.${id}.q`),
      acceptedAnswer: { '@type': 'Answer', text: translate(lang, `home.faq.${id}.a`) },
    })),
  };
}

function breadcrumbs(route: Route, lang: Lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: translate(lang, 'page.home'), item: canonicalUrl('/', lang) },
      { '@type': 'ListItem', position: 2, name: translate(lang, BREADCRUMB_KEY[route]), item: canonicalUrl(route, lang) },
    ],
  };
}

/** Everything structured-data for one page, in the order it is emitted. */
export function structuredData(key: MetaKey, lang: Lang): unknown[] {
  if (!isIndexable(key)) return [];
  if (key === '/') return [softwareApplication(lang), organization(), faqPage(lang)];
  if (key === '/download') return [softwareApplication(lang), breadcrumbs(key, lang)];
  return [breadcrumbs(key, lang)];
}

/**
 * The `<head>` contents for one page × one language.
 *
 * A page that is not indexable gets no canonical and no hreflang: the 404
 * exists at every wrong address at once and `/app` exists only for the person
 * signed into it, so pointing search engines at a canonical would be a lie.
 * They get `noindex` instead (`NOINDEX_ROBOTS`).
 */
export function buildHead(key: MetaKey, lang: Lang): string {
  const { title, description } = PAGE_META[key][lang];
  const lines: string[] = [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  ];

  const robots = NOINDEX_ROBOTS[key];
  if (robots) {
    lines.push(`<meta name="robots" content="${robots}" />`);
  } else {
    lines.push(`<link rel="canonical" href="${canonicalUrl(key, lang)}" />`);
    for (const alt of LANGS) {
      lines.push(`<link rel="alternate" hreflang="${alt}" href="${canonicalUrl(key, alt)}" />`);
    }
    lines.push(`<link rel="alternate" hreflang="x-default" href="${canonicalUrl(key, DEFAULT_LANG)}" />`);
  }

  lines.push(
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="TripTrack" />',
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
  );
  if (!robots) lines.push(`<meta property="og:url" content="${canonicalUrl(key, lang)}" />`);

  for (const data of structuredData(key, lang)) lines.push(jsonLd(data));

  return lines.join('\n    ');
}

/**
 * Sitemap over the same route table the prerender walks, with an
 * `xhtml:link` alternate per language on every entry — the pair is what tells
 * Google that `/features` and `/ru/features` are one page in two languages
 * rather than two pages competing with each other.
 */
export function buildSitemap(lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls: string[] = [];
  for (const route of ROUTES) {
    const { priority, changefreq } = ROUTE_PRIORITY[route];
    for (const lang of LANGS) {
      const alternates = [
        ...LANGS.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${canonicalUrl(route, alt)}" />`),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${canonicalUrl(route, DEFAULT_LANG)}" />`,
      ].join('\n');
      urls.push(
        [
          '  <url>',
          `    <loc>${canonicalUrl(route, lang)}</loc>`,
          alternates,
          `    <lastmod>${lastmod}</lastmod>`,
          `    <changefreq>${changefreq}</changefreq>`,
          `    <priority>${priority}</priority>`,
          '  </url>',
        ].join('\n'),
      );
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * `/app` is the signed-in trips viewer: it is nobody's landing page, it needs
 * a session to show anything, and a crawler that follows it gets a login
 * screen. It stays out of the index and out of the sitemap.
 */
export function buildRobots(): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /app', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n');
}
