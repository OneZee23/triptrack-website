// Everything this section keeps on the device, and nothing else.
//
// Two keys, both in `localStorage`:
//   `tt.app.session` — access + refresh token and the account's display
//      fields. Cleared on sign-out.
//   `tt.app.device`  — a random UUID standing in for iOS's
//      `SettingsManager.localUserId`. It is a device id, not a secret, so
//      sign-out deliberately LEAVES it: the same browser signing back in
//      should look like the same device to the backend.
//
// Trips are never written here. They live in React state for as long as the
// page does and die with it — a personal route log has no business
// surviving in a shared browser's storage. See docs/web-app-security.md.

export interface Account {
  id: string;
  displayName: string | null;
  email: string | null;
  avatarEmoji: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  account: Account;
}

const SESSION_KEY = 'tt.app.session';
const DEVICE_KEY = 'tt.app.device';

/** Storage throws in Safari private mode and when site data is blocked;
 *  every access here is wrapped so a hardened browser degrades to "you have
 *  to sign in again each visit" instead of a white screen. */
function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — the session simply won't outlive the tab */
  }
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Session>;
  return typeof v.accessToken === 'string'
    && typeof v.refreshToken === 'string'
    && !!v.account
    && typeof v.account.id === 'string';
}

export function readSession(): Session | null {
  const raw = readRaw(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null): void {
  writeRaw(SESSION_KEY, session ? JSON.stringify(session) : null);
}

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // `crypto.randomUUID` needs a secure context; plain http on a LAN box
  // (how the site is opened while developing) isn't one. The server
  // validates this with `@IsUUID()`, so the fallback must be a real v4.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Stable per-browser id sent as `localUserId`. Created once, kept across
 *  sign-outs on purpose (see the header comment). */
export function deviceId(): string {
  const existing = readRaw(DEVICE_KEY);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const fresh = randomUuid();
  writeRaw(DEVICE_KEY, fresh);
  return fresh;
}
