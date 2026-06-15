// Thin wrapper around the Umami tracker (loaded via the script tag in index.html).
// `window.umami` is undefined until that script loads, so every call is guarded —
// analytics must never throw into the app. Link/button clicks are tracked
// declaratively with `data-umami-event` attributes; this is for programmatic
// events (e.g. opening a trip card, which happens on a map-canvas click).

type UmamiData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: UmamiData) => void };
  }
}

export function trackEvent(event: string, data?: UmamiData): void {
  try {
    window.umami?.track(event, data);
  } catch {
    /* never let analytics break the UI */
  }
}
