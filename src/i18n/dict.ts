import en from './en.json';
import ru from './ru.json';
import type { Lang } from '../lib/site';

/**
 * The dictionaries, reachable without React.
 *
 * The prerender script builds `<head>` (including the FAQ JSON-LD, whose
 * questions must be word-for-word the ones on the page) outside any component
 * tree, so lookup can't live inside the context provider.
 */
const dicts: Record<Lang, unknown> = { en, ru };

/** Dotted-path lookup. A missing key comes back as the key — loud, not blank. */
export function translate(lang: Lang, key: string): string {
  let current: unknown = dicts[lang];
  for (const part of key.split('.')) {
    if (current == null || typeof current !== 'object') return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}

export { dicts };
