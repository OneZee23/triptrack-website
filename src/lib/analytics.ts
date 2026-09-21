// Thin wrapper around the Umami tracker (loaded via the script tag in index.html).
// `window.umami` is undefined until that script loads, so every call is guarded —
// analytics must never throw into the app. Link/button clicks are tracked
// declaratively with `data-umami-event` attributes; this is for programmatic
// events (e.g. opening a trip card, which happens on a map-canvas click).
//
// ПРОСМОТРЫ СТРАНИЦ ШЛЁТ ТОЛЬКО ЭТОТ ФАЙЛ. Автотрек у тега выключен
// (`data-auto-track="false"` в `index.html`), потому что он отправлял ПУТЬ,
// а в разделе «Мои поездки» путь — это `/app/trips/<uuid>`, идентификатор
// личной поездки. `isTrackablePath` — чистая функция и единственное место,
// где решается «этот адрес аналитике показывать можно»; её держит
// `analytics.spec.ts`.

type UmamiData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: { track: (event?: string, data?: UmamiData) => void };
  }
}

/** Раздел для вошедших. Ни один адрес отсюда не уезжает в аналитику —
 *  ни сам `/app`, ни `/ru/app`, ни что угодно под ними. */
export function isTrackablePath(pathname: string): boolean {
  const withoutLang = pathname.replace(/^\/ru(?=\/|$)/, '');
  const path = withoutLang === '' ? '/' : withoutLang;
  return path !== '/app' && !path.startsWith('/app/');
}

export function trackEvent(event: string, data?: UmamiData): void {
  try {
    window.umami?.track(event, data);
  } catch {
    /* never let analytics break the UI */
  }
}

/** Один просмотр страницы. Молчит на `/app/**` и молчит, если тега нет
 *  вовсе (блокировщик, офлайн) — отсутствие аналитики не повод для ошибки
 *  на экране.
 *
 *  Одна попытка дождаться тега: скрипт Umami отложенный, а React монтируется
 *  после динамического импорта чанка страницы, так что на холодной загрузке
 *  `window.umami` может ещё не существовать. Ждём `load` ровно один раз и
 *  больше не возвращаемся — потерянный просмотр дешевле висящего слушателя. */
export function trackPageView(pathname: string): void {
  if (!isTrackablePath(pathname)) return;
  try {
    if (window.umami) {
      window.umami.track();
      return;
    }
    window.addEventListener('load', () => {
      try {
        window.umami?.track();
      } catch {
        /* as above */
      }
    }, { once: true });
  } catch {
    /* as above */
  }
}
