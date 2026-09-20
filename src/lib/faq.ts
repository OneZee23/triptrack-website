/**
 * The questions on the home page's FAQ block, in the order they are shown.
 *
 * The list is here rather than inside the page because the `FAQPage` JSON-LD
 * has to carry EXACTLY the questions and answers a visitor sees — Google
 * treats a mismatch as a structured-data violation, and the only way to make
 * that impossible is to have one list feeding both.
 *
 * The copy itself lives in `en.json` / `ru.json` under `home.faq.<id>.q` and
 * `.a`, like every other string on the site.
 */
export const FAQ_IDS = ['free', 'auto', 'battery', 'account', 'timeline', 'atlas', 'android'] as const;
export type FaqId = (typeof FAQ_IDS)[number];
