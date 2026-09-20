// Numbers on the web are ALWAYS metric: the browser has no way to read the
// unit the person picked in the iOS app (it lives in their account settings
// behind `settings/get`, and asking for it would be a second round-trip to
// render a list). The footer of the section says so out loud rather than
// letting someone read "12.4" as miles.
//
// Decimal separator is a dot in both languages — the owner's decision of
// 11 Sep 2026, the same one `UnitNumber.decimalSeparator` enforces in the
// app. Do not "fix" it back to a comma for Russian.

export type Lang = 'en' | 'ru';

const UNITS = {
  en: { km: 'km', kmh: 'km/h', h: 'h', min: 'min' },
  ru: { km: 'км', kmh: 'км/ч', h: 'ч', min: 'мин' },
} as const;

/** Metres → "12.4 km". One decimal everywhere: the list is scanned, not
 *  audited, and a second digit only makes the column ragged. */
export function formatDistance(metres: number | null | undefined, lang: Lang): string {
  if (metres == null || !Number.isFinite(metres)) return '—';
  return `${(metres / 1000).toFixed(1)} ${UNITS[lang].km}`;
}

/** Seconds → "2 h 14 min" / "47 min". Rounds down to whole minutes: a trip
 *  is not timed to the second and pretending otherwise invites comparison. */
export function formatDuration(seconds: number | null | undefined, lang: Lang): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return '—';
  const total = Math.floor(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} ${UNITS[lang].min}`;
  return `${h} ${UNITS[lang].h} ${m} ${UNITS[lang].min}`;
}

/** Metres per second (what the server stores) → "84 km/h". */
export function formatSpeed(metresPerSecond: number | null | undefined, lang: Lang): string {
  if (metresPerSecond == null || !Number.isFinite(metresPerSecond)) return '—';
  return `${Math.round(metresPerSecond * 3.6)} ${UNITS[lang].kmh}`;
}

/** ISO timestamp → a short local date. Locale comes from the chosen
 *  language, never from a literal — same rule as the app. */
export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Trip duration in seconds. `drivingTime` is what the app calls "time in
 *  motion" and is absent on rows written by clients older than 0.5.6; the
 *  wall clock between the two ends is the honest fallback. */
export function tripDurationSeconds(trip: {
  startDate: string;
  endDate: string | null;
  drivingTime: number | null;
}): number | null {
  if (trip.drivingTime != null && trip.drivingTime > 0) return trip.drivingTime;
  if (!trip.endDate) return null;
  const from = new Date(trip.startDate).getTime();
  const to = new Date(trip.endDate).getTime();
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null;
  return Math.round((to - from) / 1000);
}
