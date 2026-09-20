import { createContext } from 'react';
import { href as hrefFor, DEFAULT_LANG, type Lang } from '../lib/site';

export interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  /**
   * Every internal link goes through this: it takes the English spelling of a
   * path and returns it in the language of the page the link is on. A `<Link
   * to="/features">` written by hand would silently drop a Russian reader back
   * into English.
   */
  href: (path: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
  href: (path) => hrefFor(path, DEFAULT_LANG),
});
