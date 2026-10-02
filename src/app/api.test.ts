// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authedPost, listTrips, getSession, setSession, logout, onSessionChange, ApiError, CODE_NETWORK, CODE_SESSION_EXPIRED } from './api';
import { readSession, writeSession, type Session } from './storage';

type Reply = { status?: number; body?: unknown; throws?: boolean };

function reply({ status = 200, body = {}, throws = false }: Reply) {
  if (throws) return Promise.reject(new TypeError('Failed to fetch'));
  return Promise.resolve({
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

function queue(...replies: Reply[]) {
  const fetchMock = vi.fn((...args: unknown[]) => {
    void args;
    return reply(replies.shift() ?? { status: 500, body: {} });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const NOT_AUTH = { status: 'error', code: 'USER_NOT_AUTH', message: 'User must be authenticated' };
const TRIPS = { status: 'ok', payload: { trips: [], total: 0 } };
const REFRESHED = { status: 'ok', payload: { accessToken: 'access-2', refreshToken: 'refresh-2' } };

function signIn() {
  setSession({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    account: { id: 'acc', displayName: 'Nikita', email: null, avatarEmoji: '🚗' },
  });
}

function urlOf(call: unknown[]): string {
  return String(call[0]);
}

function tokenOf(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit | undefined;
  return (init?.headers as Record<string, string> | undefined)?.['x-access-token'];
}

beforeEach(() => {
  window.localStorage.clear();
  signIn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('authenticated calls', () => {
  it('sends the access token in x-access-token, not Authorization', async () => {
    const fetchMock = queue({ body: TRIPS });
    await listTrips(20, 0);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-access-token']).toBe('access-1');
    expect(headers.Authorization).toBeUndefined();
    expect(init.cache).toBe('no-store');
    expect(init.credentials).toBe('omit');
  });

  it('refreshes once on USER_NOT_AUTH and retries the call with the new token', async () => {
    const fetchMock = queue({ body: NOT_AUTH }, { body: REFRESHED }, { body: TRIPS });
    const result = await listTrips(20, 0);

    expect(result.total).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(urlOf(fetchMock.mock.calls[0])).toContain('/trips/list');
    expect(urlOf(fetchMock.mock.calls[1])).toContain('/auth/refresh');
    expect(urlOf(fetchMock.mock.calls[2])).toContain('/trips/list');
    expect(tokenOf(fetchMock.mock.calls[2])).toBe('access-2');
    expect(getSession()?.refreshToken).toBe('refresh-2');
  });

  it('treats a bare HTTP 401 from a proxy the same way', async () => {
    const fetchMock = queue({ status: 401, body: {} }, { body: REFRESHED }, { body: TRIPS });
    await listTrips(20, 0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('signs out when the refresh is refused', async () => {
    const fetchMock = queue(
      { body: NOT_AUTH },
      { body: { status: 'error', code: 'INVALID_REFRESH_TOKEN', message: 'nope' } },
    );

    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getSession()).toBeNull();
  });

  it('retries exactly once — a second refusal ends the session', async () => {
    const fetchMock = queue({ body: NOT_AUTH }, { body: REFRESHED }, { body: NOT_AUTH });

    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getSession()).toBeNull();
  });

  it('refreshes once for two calls that meet the expired token together', async () => {
    const fetchMock = queue(
      { body: NOT_AUTH },
      { body: NOT_AUTH },
      { body: REFRESHED },
      { body: TRIPS },
      { body: TRIPS },
    );

    await Promise.all([listTrips(20, 0), listTrips(20, 20)]);

    const refreshes = fetchMock.mock.calls.filter((c) => urlOf(c).includes('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
  });

  it('keeps the session when the refresh could not be ASKED', async () => {
    // Отвалившийся на секунду Wi-Fi — не решение сервера. Токен в браузере
    // цел, терпимая ротация на бэкенде его не убила, и повторная попытка
    // через минуту пройдёт. Пока «не дозвонились» и «отказано» были одним
    // ответом, сеть стирала сессию и требовала входа заново.
    const fetchMock = queue({ body: NOT_AUTH }, { throws: true });

    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_NETWORK });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getSession()).not.toBeNull();
  });

  it('keeps the session when the refresh answers 5xx', async () => {
    // «Мне плохо» — это не «такого токена нет».
    const fetchMock = queue({ body: NOT_AUTH }, { status: 503, body: {} });

    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_NETWORK });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getSession()).not.toBeNull();
  });

  it('gives BOTH waiting calls the same verdict when a shared refresh fails', async () => {
    // Одно обновление на двоих: если отказ достаётся только первому, второй
    // «успешно» ушёл бы с мёртвым токеном.
    queue({ body: NOT_AUTH }, { body: NOT_AUTH }, { throws: true });

    const results = await Promise.allSettled([listTrips(20, 0), listTrips(20, 20)]);
    for (const result of results) {
      expect(result.status).toBe('rejected');
      expect((result as PromiseRejectedResult).reason).toMatchObject({ code: CODE_NETWORK });
    }
    expect(getSession()).not.toBeNull();
  });

  it('refuses to call at all without a session', async () => {
    setSession(null);
    const fetchMock = queue({ body: TRIPS });
    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('failures', () => {
  it('keeps a valid session when refresh is rate-limited', async () => {
    queue({ body: NOT_AUTH }, { body: { status: 'error', code: 'TOO_MANY_REQUESTS' } });
    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(getSession()?.accessToken).toBe('access-1');
  });

  it('reports a dead network as NETWORK, not as a server answer', async () => {
    queue({ throws: true });
    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_NETWORK });
  });

  it('surfaces the server code and keeps the session', async () => {
    queue({ body: { status: 'error', code: 'TOO_MANY_REQUESTS', message: 'Too many requests' } });
    const error = await listTrips(20, 0).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('TOO_MANY_REQUESTS');
    expect((error as ApiError).message).not.toContain('Too many requests');
    expect(getSession()).not.toBeNull();
  });

  it('calls an unreadable body a server error, not a refusal', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      status: 502,
      json: () => Promise.reject(new SyntaxError('not json')),
    } as unknown as Response)));
    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: 'UNKNOWN_SERVER_ERROR' });
  });
});

describe('session changes while requests are running', () => {
  it('drops personal data immediately on logout, before the server responds', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const pending = logout();
    expect(getSession()).toBeNull();
    finish(await reply({ body: { status: 'ok' } }));
    await pending;
  });

  it('does not restore a signed-out session when a refresh arrives late', async () => {
    let finishRefresh!: (value: Response) => void;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => reply({ body: NOT_AUTH }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finishRefresh = resolve; }))
      .mockImplementationOnce(() => reply({ body: { status: 'ok' } }));
    vi.stubGlobal('fetch', fetchMock);
    const result = listTrips(20, 0).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await logout();
    finishRefresh(await reply({ body: REFRESHED }));
    expect(await result).toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(getSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not replace a new account with the old account refresh', async () => {
    let finishRefresh!: (value: Response) => void;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => reply({ body: NOT_AUTH }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finishRefresh = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const result = listTrips(20, 0).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    setSession({
      accessToken: 'other-access', refreshToken: 'other-refresh',
      account: { id: 'other-account', displayName: null, email: null, avatarEmoji: '🚗' },
    });
    finishRefresh(await reply({ body: REFRESHED }));
    expect(await result).toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(getSession()?.account.id).toBe('other-account');
    expect(getSession()?.accessToken).toBe('other-access');
  });

  it('rejects the old account trip response after changing accounts', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const result = listTrips(20, 0).catch((error: unknown) => error);
    setSession(null);
    finish(await reply({ body: TRIPS }));
    expect(await result).toMatchObject({ code: CODE_SESSION_EXPIRED });
  });
});

describe('sessions shared between browser tabs', () => {
  const other: Session = {
    accessToken: 'other-access', refreshToken: 'other-refresh',
    account: { id: 'other-account', displayName: 'Other', email: null, avatarEmoji: '🚗' },
  };
  const storageEvent = (value: Session | null) => window.dispatchEvent(new StorageEvent('storage', {
    key: 'tt.app.session', newValue: value ? JSON.stringify(value) : null, storageArea: window.localStorage,
  }));

  it('refuses to send an old draft as another account even before the storage event arrives', async () => {
    const fetchMock = queue({ body: { status: 'ok', payload: { id: 'trip' } } });
    writeSession(other);
    await expect(authedPost('/trips/manual/create', { title: 'Private draft' }))
      .rejects.toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
    expect(readSession()).toEqual(other);
    await expect(listTrips(20, 0)).rejects.toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('notifies the private UI when the other tab changes accounts without erasing its login', () => {
    const listener = vi.fn();
    const unsubscribe = onSessionChange(listener);
    try {
      writeSession(other);
      storageEvent(other);
      expect(listener).toHaveBeenLastCalledWith(null);
      expect(getSession()).toBeNull();
      expect(readSession()).toEqual(other);
    } finally {
      unsubscribe();
    }
  });

  it('invalidates a queued logout even if the other tab has already signed in as the same person', () => {
    const listener = vi.fn();
    const unsubscribe = onSessionChange(listener);
    try {
      const replacement = { ...readSession()!, accessToken: 'new-login', refreshToken: 'new-refresh' };
      writeSession(replacement);
      storageEvent(null);
      storageEvent(replacement);
      expect(listener).toHaveBeenLastCalledWith(null);
      expect(getSession()).toBeNull();
      expect(readSession()).toEqual(replacement);
    } finally {
      unsubscribe();
    }
  });

  it('accepts token rotation of the same account from another tab', async () => {
    const fetchMock = queue({ body: TRIPS });
    const replacement = { ...readSession()!, accessToken: 'rotated-access', refreshToken: 'rotated-refresh' };
    writeSession(replacement);
    await listTrips(20, 0);
    expect(tokenOf(fetchMock.mock.calls[0])).toBe('rotated-access');
    expect(getSession()?.account.id).toBe('acc');
  });

  it('does not log out the other account from a stale tab', async () => {
    const fetchMock = queue({ body: { status: 'ok' } });
    writeSession(other);
    await logout();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readSession()).toEqual(other);
    expect(getSession()).toBeNull();
  });

  it('rejects an old refresh without restoring its account or clearing the new one', async () => {
    let finishRefresh!: (value: Response) => void;
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => reply({ body: NOT_AUTH }))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => { finishRefresh = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const pending = listTrips(20, 0).catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    writeSession(other);
    finishRefresh(await reply({ body: REFRESHED }));
    expect(await pending).toMatchObject({ code: CODE_SESSION_EXPIRED });
    expect(getSession()).toBeNull();
    expect(readSession()).toEqual(other);
  });
});
