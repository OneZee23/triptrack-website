import { describe, expect, it } from 'vitest';
import { buildHead, buildRobots, buildSitemap, structuredData } from './head';
import { translate } from '../i18n/dict';
import { FAQ_IDS } from './faq';
import { canonicalUrl, LANGS, ROUTES } from './site';

describe('buildHead', () => {
  it('gives every page a title, a description and a canonical', () => {
    for (const route of ROUTES) {
      for (const lang of LANGS) {
        const head = buildHead(route, lang);
        expect(head).toContain('<title>');
        expect(head).toContain('<meta name="description"');
        expect(head).toContain(`<link rel="canonical" href="${canonicalUrl(route, lang)}" />`);
      }
    }
  });

  it('pairs the languages with hreflang, x-default pointing at English', () => {
    const head = buildHead('/features', 'ru');
    expect(head).toContain('<link rel="alternate" hreflang="en" href="https://trip-track.app/features" />');
    expect(head).toContain('<link rel="alternate" hreflang="ru" href="https://trip-track.app/ru/features" />');
    expect(head).toContain('<link rel="alternate" hreflang="x-default" href="https://trip-track.app/features" />');
  });

  it('marks the 404 noindex and gives it no canonical', () => {
    const head = buildHead('404', 'en');
    expect(head).toContain('noindex');
    expect(head).not.toContain('rel="canonical"');
    expect(head).not.toContain('hreflang');
  });

  it('escapes what goes into an attribute', () => {
    const head = buildHead('/', 'ru');
    expect(head).not.toMatch(/content="[^"]*"[^"=>]+="/);
  });
});

describe('structured data', () => {
  it('never claims a rating we do not have', () => {
    for (const lang of LANGS) {
      const json = JSON.stringify(structuredData('/', lang));
      expect(json).not.toContain('aggregateRating');
      expect(json).not.toContain('ratingValue');
    }
  });

  it('puts the app and the organisation on the home page', () => {
    const types = structuredData('/', 'en').map((d) => (d as { '@type': string })['@type']);
    expect(types).toContain('SoftwareApplication');
    expect(types).toContain('Organization');
    expect(types).toContain('FAQPage');
  });

  it('asks the FAQ the same questions the page shows', () => {
    const faq = structuredData('/', 'ru').find((d) => (d as { '@type': string })['@type'] === 'FAQPage') as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity).toHaveLength(FAQ_IDS.length);
    faq.mainEntity.forEach((entry, i) => {
      expect(entry.name).toBe(translate('ru', `home.faq.${FAQ_IDS[i]}.q`));
      expect(entry.acceptedAnswer.text).toBe(translate('ru', `home.faq.${FAQ_IDS[i]}.a`));
      // a key that fell out of the dictionary comes back as the key itself
      expect(entry.name).not.toContain('home.faq');
    });
  });

  it('breadcrumbs every inner page back to its own language home', () => {
    const crumbs = structuredData('/fog-of-war-map', 'ru')[0] as {
      itemListElement: { item: string; name: string }[];
    };
    expect(crumbs.itemListElement[0].item).toBe('https://trip-track.app/ru/');
    expect(crumbs.itemListElement[1].item).toBe('https://trip-track.app/ru/fog-of-war-map');
    expect(crumbs.itemListElement[1].name).toBe('Туман войны на карте');
  });

  it('gives the 404 nothing to index', () => {
    expect(structuredData('404', 'en')).toEqual([]);
  });
});

describe('buildSitemap', () => {
  const xml = buildSitemap('2026-09-20');

  it('lists every route in every language', () => {
    for (const route of ROUTES) {
      for (const lang of LANGS) {
        expect(xml).toContain(`<loc>${canonicalUrl(route, lang)}</loc>`);
      }
    }
    expect(xml.match(/<url>/g)).toHaveLength(ROUTES.length * LANGS.length);
  });

  it('carries the hreflang alternates on every entry', () => {
    expect(xml.match(/xhtml:link/g)).toHaveLength(ROUTES.length * LANGS.length * (LANGS.length + 1));
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
  });

  it('keeps the signed-in area out of it', () => {
    expect(xml).not.toContain('/app');
  });
});

describe('buildRobots', () => {
  it('keeps crawlers out of the signed-in area and points at the sitemap', () => {
    const txt = buildRobots();
    expect(txt).toContain('Disallow: /app');
    expect(txt).toContain('Sitemap: https://trip-track.app/sitemap.xml');
  });
});
