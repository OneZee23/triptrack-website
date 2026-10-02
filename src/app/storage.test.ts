// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deviceId, readSession, writeSession, type Session } from './storage';

const session: Session = {
  accessToken: 'access', refreshToken: 'refresh',
  account: { id: 'account', displayName: 'Driver', email: null, avatarEmoji: '🚗' },
};

afterEach(() => {
  vi.restoreAllMocks();
  writeSession(null);
  window.localStorage.clear();
});

describe('blocked browser storage', () => {
  it('keeps a session usable in this tab when all storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('blocked'); });
    writeSession(session);
    expect(readSession()).toEqual(session);
    expect(deviceId()).toBe(deviceId());
    writeSession(null);
    expect(readSession()).toBeNull();
  });

  it('uses the new in-memory session when storage is readable but cannot be written', () => {
    writeSession({ ...session, accessToken: 'old' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota'); });
    writeSession(session);
    expect(readSession()?.accessToken).toBe('access');
  });
});
