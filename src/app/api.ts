// The one door to api.trip-track.app.
//
// Two things here are easy to get wrong by reading the iOS code sideways:
//
//  * The envelope is `{ status: 'ok', payload }` / `{ status: 'error',
//    code, message }` and the HTTP status is 200 even for a refusal —
//    `JsonRpcExceptionFilter` answers 200 by design. So "refresh on 401"
//    really means "refresh on the `USER_NOT_AUTH` code"; the numeric 401
//    is still honoured because a proxy in front of the API can produce one
//    without the envelope.
//  * The access token travels in the `x-access-token` header, NOT
//    `Authorization: Bearer` — see `JwtAuthGuard`.
//
// Server `message` text never reaches the screen: callers map `code` to a
// translated string (see errors.ts).

import { deviceId, onStoredSessionChange, readSession, writeSession, type Account, type Session } from './storage';

const DEFAULT_BASE = 'https://api.trip-track.app';

export const API_BASE: string = String(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE,
).replace(/\/+$/, '');

export class ApiError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Network failure, DNS, CORS rejection, offline. */
export const CODE_NETWORK = 'NETWORK';
/** Refresh failed (or there was nothing to refresh): the session is gone. */
export const CODE_SESSION_EXPIRED = 'SESSION_EXPIRED';
const CODE_NOT_AUTH = 'USER_NOT_AUTH';

type Envelope<T> =
  | { status: 'ok'; payload: T }
  | { status: 'error'; code: string; message: string };

// ---------------------------------------------------------------- session

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();
// A refresh belongs to the login that started it. Late network responses
// must never restore a signed-out account or overwrite a new login.
let sessionEpoch = 0;
// A tab owns the account whose private UI it mounted. Shared storage can
// rotate that account's tokens, but must never retarget an old draft to a
// different account. An external identity change requires a fresh login
// (or page load) in this tab; leave the other tab's stored session alone.
let tabSession = readSession();
let stopStorageListener: (() => void) | null = null;

function invalidateTabSession(): void {
  if (!tabSession) return;
  sessionEpoch += 1;
  tabSession = null;
  for (const fn of listeners) fn(null);
}

export function getSession(): Session | null {
  if (tabSession) {
    const stored = readSession();
    if (stored?.account.id !== tabSession.account.id) invalidateTabSession();
    else tabSession = stored;
  }
  return tabSession;
}

export function setSession(session: Session | null): void {
  sessionEpoch += 1;
  publishSession(session);
}

function publishSession(session: Session | null): void {
  tabSession = session;
  writeSession(session);
  for (const fn of listeners) fn(session);
}

function assertSession(epoch: number, accountId: string): void {
  const current = getSession();
  if (epoch !== sessionEpoch || current?.account.id !== accountId) {
    throw new ApiError(CODE_SESSION_EXPIRED);
  }
}

/** Subscribe to session changes — the provider uses this so a forced
 *  sign-out deep inside a fetch still repaints the screen. */
export function onSessionChange(fn: Listener): () => void {
  listeners.add(fn);
  if (!stopStorageListener) {
    stopStorageListener = onStoredSessionChange((signedOut) => {
      if (signedOut) invalidateTabSession();
      else getSession();
    });
  }
  // Catch a change between the provider's initial read and subscription.
  fn(getSession());
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      stopStorageListener?.();
      stopStorageListener = null;
    }
  };
}

// ---------------------------------------------------------------- transport

async function rawPost<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<{ http: number; envelope: Envelope<T> | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['x-access-token'] = accessToken;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body ?? {}),
      // Personal data must not sit in the HTTP cache of a shared browser,
      // and there are no cookies in this protocol at all.
      cache: 'no-store',
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(CODE_NETWORK);
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }
  return { http: response.status, envelope };
}

function isUnauthorized(http: number, envelope: Envelope<unknown> | null): boolean {
  if (http === 401) return true;
  return !!envelope && envelope.status === 'error' && envelope.code === CODE_NOT_AUTH;
}

function unwrap<T>(http: number, envelope: Envelope<T> | null): T {
  if (envelope && envelope.status === 'ok') return envelope.payload;
  if (envelope && envelope.status === 'error') throw new ApiError(envelope.code);
  // A body we can't parse means something between us and the API answered
  // (gateway, captcha page, relay timeout) — not something the API said.
  throw new ApiError(http === 0 ? CODE_NETWORK : 'UNKNOWN_SERVER_ERROR');
}

// ---------------------------------------------------------------- refresh

// One refresh in flight at a time: a trips list and its detail request can
// both meet an expired token in the same tick, and two refreshes would race
// to rotate the same token — the loser's retry would then fail for real.
let refreshInFlight: { epoch: number; promise: Promise<string> } | null = null;

/** Throws `SESSION_EXPIRED` when the server REFUSED the refresh, and
 *  `NETWORK` when the refresh could not be asked at all.
 *
 *  Различать эти два случая обязательно. «Не дозвонились» — это не ответ
 *  сервера, а отсутствие ответа: refresh-токен в браузере при этом цел и,
 *  благодаря терпимой ротации на бэкенде, останется рабочим. Пока эти
 *  случаи были одним `null`, отвалившийся на секунду Wi-Fi стирал сессию и
 *  требовал входа заново — та же поломка, из-за которой на iOS записано
 *  правило «из аккаунта человека выводит только человек» (0.7.0). Пятисотые
 *  здесь тоже транзиент: сервер жив ровно настолько, чтобы сказать «мне
 *  плохо», а не «этого токена нет». */
async function refreshTokens(): Promise<string> {
  const epoch = sessionEpoch;
  const current = getSession();
  if (!current) throw new ApiError(CODE_SESSION_EXPIRED);
  // rawPost сам бросает `NETWORK`, если запрос не ушёл.
  const { http, envelope } = await rawPost<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh',
    { refreshToken: current.refreshToken },
  );
  assertSession(epoch, current.account.id);
  if (http === 401) throw new ApiError(CODE_SESSION_EXPIRED);
  if (!envelope || http >= 500) throw new ApiError(CODE_NETWORK);
  if (envelope.status !== 'ok') {
    if (['INVALID_REFRESH_TOKEN', CODE_NOT_AUTH, 'USER_BANNED'].includes(envelope.code)) {
      throw new ApiError(CODE_SESSION_EXPIRED);
    }
    throw new ApiError(envelope.code);
  }
  const next: Session = {
    accessToken: envelope.payload.accessToken,
    refreshToken: envelope.payload.refreshToken,
    account: current.account,
  };
  publishSession(next);
  return next.accessToken;
}

function refreshOnce(): Promise<string> {
  if (!refreshInFlight || refreshInFlight.epoch !== sessionEpoch) {
    // `finally`, а не `catch`: отказ обязан достаться КАЖДОМУ, кто ждал
    // это обновление, — иначе один запрос увидел бы «сеть», а
    // параллельный ему «сессии нет».
    const flight = {
      epoch: sessionEpoch,
      promise: refreshTokens().finally(() => {
        if (refreshInFlight === flight) refreshInFlight = null;
      }),
    };
    refreshInFlight = flight;
  }
  return refreshInFlight.promise;
}

// ---------------------------------------------------------------- calls

/** Unauthenticated POST. */
async function post<T>(path: string, body: unknown): Promise<T> {
  const { http, envelope } = await rawPost<T>(path, body);
  return unwrap(http, envelope);
}

/** Authenticated POST with exactly one refresh-and-retry. A second refusal
 *  is taken at face value: the session is dead, so it is cleared here
 *  rather than left to rot and refuse every later call. */
export async function authedPost<T>(path: string, body: unknown): Promise<T> {
  const epoch = sessionEpoch;
  const session = getSession();
  if (!session) throw new ApiError(CODE_SESSION_EXPIRED);

  const first = await rawPost<T>(path, body, session.accessToken);
  assertSession(epoch, session.account.id);
  if (!isUnauthorized(first.http, first.envelope)) return unwrap(first.http, first.envelope);

  let token: string;
  try {
    token = await refreshOnce();
  } catch (error: unknown) {
    // Сеть — не решение сервера: сессию оставляем, человек повторит.
    if (!(error instanceof ApiError) || error.code !== CODE_SESSION_EXPIRED) throw error;
    if (epoch === sessionEpoch) setSession(null);
    throw new ApiError(CODE_SESSION_EXPIRED);
  }

  assertSession(epoch, session.account.id);
  const second = await rawPost<T>(path, body, token);
  assertSession(epoch, session.account.id);
  if (isUnauthorized(second.http, second.envelope)) {
    setSession(null);
    throw new ApiError(CODE_SESSION_EXPIRED);
  }
  return unwrap(second.http, second.envelope);
}

// ---------------------------------------------------------------- shapes

export interface TripSummary {
  id: string;
  /** Optional for older API responses. Manual routes are not GPS recordings. */
  source?: 'manual' | 'recorded';
  title: string | null;
  startDate: string;
  endDate: string | null;
  /** Metres. */
  distance: number;
  /** Metres per second. */
  maxSpeed: number;
  /** Metres per second. */
  averageSpeed: number;
  /** Seconds in motion; null on rows written before 0.5.6. */
  drivingTime: number | null;
  region: string | null;
  /** Base64 of the binary preview route; null when the trip has none. */
  previewPolyline: string | null;
}

export interface TripCheckpoint {
  id: string;
  name: string | null;
  timestamp: string;
  /** Hidden by the account's privacy zones when null. */
  latitude: number | null;
  longitude: number | null;
  /** Metres from the start of the trip. */
  distanceFromStart: number;
  /** Seconds from the start of the trip. */
  elapsedFromStart: number;
}

export interface TripTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
}

export interface TripDetail extends TripSummary {
  description: string | null;
  maxAltitude: number | null;
  stoppedTime: number | null;
  trackPoints?: TripTrackPoint[];
  checkpoints?: TripCheckpoint[];
}

// ---------------------------------------------------------------- endpoints

interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  account: Account;
  isNewAccount: boolean;
}

/** Exchanges an Apple identity token for a session and stores it.
 *  `nonce` is the RAW value: the page sends SHA-256 of it to Apple (see
 *  `appleSdk.sha256Hex`) and `AppleAuthService` hashes this one to compare. */
export async function login(identityToken: string, nonce: string): Promise<Session> {
  const payload = await post<LoginPayload>('/auth/login', {
    identityToken,
    localUserId: deviceId(),
    deviceName: 'web',
    nonce,
  });
  const session: Session = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    account: payload.account,
  };
  setSession(session);
  return session;
}

/** Best-effort server-side logout. The local session is dropped either
 *  way — a network failure must never leave someone signed in on a
 *  computer they are walking away from. */
export async function logout(): Promise<void> {
  const current = getSession();
  if (!current) return;
  setSession(null);
  try {
    await rawPost<void>('/auth/logout', {}, current.accessToken);
  } catch {
    /* ignored on purpose */
  }
}

export function listTrips(limit: number, offset: number): Promise<{ trips: TripSummary[]; total: number }> {
  return authedPost('/trips/list', { limit, offset });
}

export function tripDetail(id: string): Promise<TripDetail> {
  return authedPost('/trips/detail', { id, includeTrackPoints: true });
}
