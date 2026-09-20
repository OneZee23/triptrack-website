import { useCallback, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { translate } from './dict';
import { LanguageContext } from './LanguageContextValue';
import { href as hrefFor, langFromPath, switchLangPath, type Lang } from '../lib/site';

/**
 * Language comes from the PATH and nowhere else.
 *
 * There is no state here on purpose: `/ru/features` is Russian because of how
 * it is spelled, so a prerendered page, a hydrating browser and a soft
 * navigation cannot disagree. `?lang=` and the stored choice survive only as a
 * one-time redirect onto the prefixed URL — links handed out before this wave
 * still land on the right language, and then the address bar tells the truth.
 */

/** The legacy redirect fires once per page load, not once per navigation. */
let legacyRedirectDone = false;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const lang = langFromPath(location.pathname);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (legacyRedirectDone) return;
    legacyRedirectDone = true;

    const params = new URLSearchParams(window.location.search);
    const asked = params.get('lang');
    const stored = safeRead('lang');

    // 1. ?lang=ru wins, and is swept out of the address bar on the way.
    if (asked === 'ru' || asked === 'en') {
      params.delete('lang');
      const query = params.toString();
      const target = switchLangPath(window.location.pathname, asked) + (query ? `?${query}` : '') + window.location.hash;
      navigate(target, { replace: true });
      return;
    }
    // 2. A choice made before the prefix existed, or on a previous visit.
    // 3. No choice at all: send a Russian browser to the Russian page once.
    const wanted: Lang | null =
      stored === 'ru' || stored === 'en'
        ? stored
        : navigator.language?.toLowerCase().startsWith('ru')
          ? 'ru'
          : null;
    if (wanted && wanted !== lang) {
      navigate(switchLangPath(window.location.pathname, wanted) + window.location.search + window.location.hash, {
        replace: true,
      });
    }
    // Mount only: this is about the URL the visitor arrived on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Switching language keeps the page, the query and the anchor. */
  const setLang = useCallback(
    (next: Lang) => {
      safeWrite('lang', next);
      navigate(switchLangPath(location.pathname, next) + location.search + location.hash);
    },
    [location.pathname, location.search, location.hash, navigate],
  );

  const t = useCallback((key: string) => translate(lang, key), [lang]);
  const href = useCallback((path: string) => hrefFor(path, lang), [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, t, href }}>{children}</LanguageContext.Provider>;
}

/** Private browsing and blocked site data both make localStorage throw. */
function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* a language preference is not worth an exception */
  }
}
