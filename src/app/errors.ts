// Server `message` strings are English, written for a developer reading a
// log, and occasionally quote the thing that failed. Nothing here shows
// one: an error becomes a translation key or it becomes the generic line.

import { CODE_NETWORK, CODE_SESSION_EXPIRED } from './api';

const BY_CODE: Record<string, string> = {
  [CODE_NETWORK]: 'app.error.network',
  [CODE_SESSION_EXPIRED]: 'app.error.session',
  USER_NOT_AUTH: 'app.error.session',
  INVALID_REFRESH_TOKEN: 'app.error.session',
  USER_BANNED: 'app.error.banned',
  INVALID_APPLE_TOKEN: 'app.error.apple',
  TOO_MANY_REQUESTS: 'app.error.rate_limit',
  TRIP_NOT_FOUND: 'app.error.trip_missing',
  PRO_REQUIRED: 'app.error.pro',
  PLUS_UNAVAILABLE: 'app.error.pro',
  VALIDATION_FAILED: 'app.error.generic',
};

/** Apple's own SDK errors arrive as `{ error: 'popup_closed_by_user' }`. */
export const CODE_APPLE_CANCELLED = 'APPLE_CANCELLED';

export function errorKey(code: string | undefined): string {
  if (!code) return 'app.error.generic';
  return BY_CODE[code] ?? 'app.error.generic';
}

export function codeOf(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}
