import { useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { PAGE_META, type MetaKey } from '../lib/meta';
import { canonicalUrl, DEFAULT_LANG, LANGS } from '../lib/site';

/**
 * Keeps the document head right after a CLIENT-SIDE navigation.
 *
 * The head a crawler reads is written at build time by `scripts/prerender.mjs`
 * from the same `PAGE_META` table — this hook exists for the second page a
 * visitor opens, where there is no new document. Both read one table, so the
 * two can't drift.
 */
export function usePageMeta(key: MetaKey) {
  const { lang } = useTranslation();

  useEffect(() => {
    const { title, description } = PAGE_META[key][lang];
    const url = key === '404' ? undefined : canonicalUrl(key, lang);

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:locale', lang === 'ru' ? 'ru_RU' : 'en_US');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (url) {
      setMeta('property', 'og:url', url);
      setLink('canonical', url);
      for (const alt of LANGS) setLink('alternate', canonicalUrl(key, alt), alt);
      setLink('alternate', canonicalUrl(key, DEFAULT_LANG), 'x-default');
    }
  }, [key, lang]);
}

function setMeta(kind: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${kind}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(kind, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
