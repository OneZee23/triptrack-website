// Keeping trip ids out of analytics.
//
// Umami is loaded globally by a tag in `index.html` and auto-tracks page
// views, so `/app/trips/<uuid>` would ship a personal identifier to the
// analytics server in the page path. Umami's documented per-visitor
// opt-out is the `umami.disabled` flag in localStorage, which the tracker
// re-reads on every send.
//
// The flag is set on entering the section and, once there is a session,
// LEFT set — that is what covers the case the flag cannot otherwise reach:
// a direct landing on a trip URL, where the deferred tracker runs and
// sends its page view before any React code of ours exists. A visitor who
// never signed in gets tracking back when they leave the section, and
// signing out restores it too.
//
// Residual gap, deliberately recorded rather than hidden: the very first
// visit to a trip URL on a browser that has never signed in here cannot be
// suppressed from inside the app. Closing it needs `data-auto-track="false"`
// (or a path exclusion) on the tag in `index.html`, which belongs to whoever
// owns that file. See docs/web-app-security.md.

const UMAMI_DISABLED = 'umami.disabled';

export function suppressAnalytics(): void {
  try {
    window.localStorage.setItem(UMAMI_DISABLED, '1');
  } catch {
    /* storage blocked: nothing to suppress, nothing to report */
  }
}

export function resumeAnalytics(): void {
  try {
    window.localStorage.removeItem(UMAMI_DISABLED);
  } catch {
    /* as above */
  }
}
