// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AuthProvider } from './auth';
import { useAuth } from './useAuth';
import { setSession } from './api';
import { writeSession } from './storage';

vi.mock('./analytics', () => ({ resumeAnalytics: vi.fn() }));

function PrivateUI() {
  const { session } = useAuth();
  return session ? <p>Private trips of {session.account.id}</p> : <p>Please sign in</p>;
}

beforeEach(() => {
  localStorage.clear();
  setSession({ accessToken: 'a', refreshToken: 'r', account: { id: 'alice', displayName: null, email: null, avatarEmoji: '🚗' } });
});
afterEach(() => { cleanup(); setSession(null); });

describe('cross-tab private UI', () => {
  it('removes private account content immediately on external identity change', () => {
    render(<AuthProvider><PrivateUI /></AuthProvider>);
    expect(screen.getByText('Private trips of alice')).toBeTruthy();
    const other = { accessToken: 'b', refreshToken: 's', account: { id: 'bob', displayName: null, email: null, avatarEmoji: '🚗' } };
    act(() => {
      writeSession(other);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'tt.app.session', newValue: JSON.stringify(other), storageArea: window.localStorage,
      }));
    });
    expect(screen.queryByText('Private trips of alice')).toBeNull();
    expect(screen.queryByText('Private trips of bob')).toBeNull();
    expect(screen.getByText('Please sign in')).toBeTruthy();
  });
});
