import { describe, expect, it } from 'vitest';
import { DESC_MAX, DESC_MIN, PAGE_META, TITLE_MAX, type MetaKey } from './meta';
import { LANGS, ROUTES } from './site';

const KEYS: MetaKey[] = [...ROUTES, '404'];

describe('PAGE_META', () => {
  it('covers every route in every language', () => {
    for (const key of KEYS) {
      for (const lang of LANGS) {
        expect(PAGE_META[key]?.[lang], `${key} / ${lang}`).toBeTruthy();
      }
    }
  });

  it('has no page the table does not know about', () => {
    expect(Object.keys(PAGE_META).sort()).toEqual([...KEYS].sort());
  });

  it.each(KEYS.flatMap((key) => LANGS.map((lang) => [key, lang] as const)))(
    'keeps %s / %s inside the lengths a search result renders',
    (key, lang) => {
      const { title, description } = PAGE_META[key][lang];
      expect(title.length, `title "${title}" is ${title.length}`).toBeLessThanOrEqual(TITLE_MAX);
      expect(title.trim()).toBe(title);
      expect(description.length, `description of ${key}/${lang} is ${description.length}`).toBeGreaterThanOrEqual(DESC_MIN);
      expect(description.length, `description of ${key}/${lang} is ${description.length}`).toBeLessThanOrEqual(DESC_MAX);
    },
  );

  it('never repeats a title between pages of the same language', () => {
    for (const lang of LANGS) {
      const titles = KEYS.map((key) => PAGE_META[key][lang].title);
      expect(new Set(titles).size, `${lang} titles`).toBe(titles.length);
    }
  });

  it('carries the queries the pages are meant to answer', () => {
    const has = (key: MetaKey, lang: 'en' | 'ru', needle: string) =>
      `${PAGE_META[key][lang].title} ${PAGE_META[key][lang].description}`.toLowerCase().includes(needle.toLowerCase());

    expect(has('/', 'en', 'trip tracker for iPhone')).toBe(true);
    expect(has('/', 'en', 'drive diary')).toBe(true);
    expect(has('/', 'ru', 'трекер поездок')).toBe(true);
    expect(has('/', 'ru', 'дневник поездок')).toBe(true);
    expect(has('/google-timeline-alternative', 'en', 'Google Timeline alternative')).toBe(true);
    expect(has('/google-timeline-alternative', 'ru', 'альтернатива Google Timeline')).toBe(true);
    expect(has('/fog-of-war-map', 'en', 'fog of war map')).toBe(true);
    expect(has('/fog-of-war-map', 'ru', 'туман войны на карте')).toBe(true);
  });
});
