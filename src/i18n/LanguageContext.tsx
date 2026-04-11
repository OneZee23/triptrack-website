import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import en from './en.json';
import ru from './ru.json';

type Lang = 'en' | 'ru';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

const dicts = { en, ru } as const;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    // URL param takes priority: ?lang=ru
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'ru' || urlLang === 'en') return urlLang;
    const stored = localStorage.getItem('lang');
    return stored === 'ru' ? 'ru' : 'en';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: string) => {
    return getNestedValue(dicts[lang] as unknown as Record<string, unknown>, key);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
