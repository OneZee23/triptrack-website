import { describe, expect, it } from 'vitest';
import { canonicalUrl, href, langFromPath, routeFromPath, ROUTES, switchLangPath } from './site';

describe('href', () => {
  it('leaves English alone', () => {
    expect(href('/', 'en')).toBe('/');
    expect(href('/features', 'en')).toBe('/features');
  });

  it('prefixes Russian, and keeps the root slash', () => {
    expect(href('/', 'ru')).toBe('/ru/');
    expect(href('/features', 'ru')).toBe('/ru/features');
    expect(href('/google-timeline-alternative', 'ru')).toBe('/ru/google-timeline-alternative');
  });

  it('is idempotent about trailing slashes', () => {
    expect(href('/features/', 'en')).toBe('/features');
    expect(href('/features/', 'ru')).toBe('/ru/features');
  });

  it('accepts a path written without the leading slash', () => {
    expect(href('features', 'ru')).toBe('/ru/features');
  });
});

describe('langFromPath', () => {
  it('reads the prefix as a whole segment', () => {
    expect(langFromPath('/')).toBe('en');
    expect(langFromPath('/features')).toBe('en');
    expect(langFromPath('/ru')).toBe('ru');
    expect(langFromPath('/ru/')).toBe('ru');
    expect(langFromPath('/ru/features')).toBe('ru');
  });

  it('does not mistake a word that starts with ru', () => {
    expect(langFromPath('/ruby')).toBe('en');
    expect(langFromPath('/rules')).toBe('en');
  });
});

describe('routeFromPath', () => {
  it('gives back the English spelling', () => {
    expect(routeFromPath('/ru/features')).toBe('/features');
    expect(routeFromPath('/ru')).toBe('/');
    expect(routeFromPath('/ru/')).toBe('/');
    expect(routeFromPath('/features')).toBe('/features');
    expect(routeFromPath('/')).toBe('/');
  });

  it('passes unknown paths through, so the 404 can still see them', () => {
    expect(routeFromPath('/s/abc')).toBe('/s/abc');
    expect(routeFromPath('/ru/s/abc')).toBe('/s/abc');
  });
});

describe('switchLangPath', () => {
  it('keeps the page and swaps the language', () => {
    expect(switchLangPath('/features', 'ru')).toBe('/ru/features');
    expect(switchLangPath('/ru/features', 'en')).toBe('/features');
    expect(switchLangPath('/', 'ru')).toBe('/ru/');
    expect(switchLangPath('/ru/', 'en')).toBe('/');
  });

  it('round-trips every route', () => {
    for (const route of ROUTES) {
      expect(switchLangPath(switchLangPath(href(route, 'en'), 'ru'), 'en')).toBe(href(route, 'en'));
    }
  });
});

describe('canonicalUrl', () => {
  it('is absolute and matches href', () => {
    expect(canonicalUrl('/', 'en')).toBe('https://trip-track.app/');
    expect(canonicalUrl('/', 'ru')).toBe('https://trip-track.app/ru/');
    expect(canonicalUrl('/fog-of-war-map', 'ru')).toBe('https://trip-track.app/ru/fog-of-war-map');
  });
});
