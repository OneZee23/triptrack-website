// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { LanguageProvider } from '../i18n/LanguageContext';
import AppShell from './AppShell';
import LoginPage from './LoginPage';
import TripsPage from './TripsPage';
import { setSession } from './api';

// Same shape as the object added to routes.tsx, without the lazy imports —
// the guard is the thing under test, not code-splitting.
function mount(initial: string) {
  const router = createMemoryRouter(
    [{
      path: '/app',
      Component: AppShell,
      children: [
        { path: 'login', Component: LoginPage },
        { path: 'trips', Component: TripsPage },
      ],
    }],
    { initialEntries: [initial] },
  );
  return render(<LanguageProvider><RouterProvider router={router} /></LanguageProvider>);
}

function signIn() {
  setSession({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    account: { id: 'acc', displayName: 'Nikita', email: null, avatarEmoji: '🚗' },
  });
}

function respondWith(payload: unknown) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
    status: 200,
    json: () => Promise.resolve({ status: 'ok', payload }),
  } as unknown as Response)));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('lang', 'en');
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('the /app guard', () => {
  it('sends a visitor without a session to the sign-in page', async () => {
    mount('/app/trips');
    await waitFor(() => expect(screen.getByRole('button', { name: /sign in with apple/i })).toBeTruthy());
  });

  it('sends a signed-in person from /app straight to their trips', async () => {
    signIn();
    respondWith({ trips: [], total: 0 });
    mount('/app');
    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeTruthy());
  });

  it('keeps a signed-in person off the sign-in page', async () => {
    signIn();
    respondWith({ trips: [], total: 0 });
    mount('/app/login');
    await waitFor(() => expect(screen.queryByRole('button', { name: /sign in with apple/i })).toBeNull());
  });
});

describe('the /app section', () => {
  it('declares itself noindex while it is on screen', async () => {
    const view = mount('/app/login');
    await waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]');
      expect(robots?.getAttribute('content')).toBe('noindex, nofollow');
    });
    view.unmount();
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('turns analytics off on the way in, and back on for a visitor who never signed in', async () => {
    const view = mount('/app/login');
    await waitFor(() => expect(window.localStorage.getItem('umami.disabled')).toBe('1'));
    view.unmount();
    expect(window.localStorage.getItem('umami.disabled')).toBeNull();
  });

  it('leaves analytics off while a session exists, so a trip URL is never tracked', async () => {
    signIn();
    respondWith({ trips: [], total: 0 });
    const view = mount('/app/trips');
    await waitFor(() => expect(window.localStorage.getItem('umami.disabled')).toBe('1'));
    view.unmount();
    expect(window.localStorage.getItem('umami.disabled')).toBe('1');
  });

  it('shows the trips it is given, with kilometres', async () => {
    signIn();
    respondWith({
      trips: [{
        id: '0d2f5c1e-0000-4000-8000-000000000001',
        title: 'Krasnodar → Sochi',
        startDate: '2026-09-18T06:00:00.000Z',
        endDate: '2026-09-18T10:00:00.000Z',
        distance: 284_300,
        maxSpeed: 33.3,
        averageSpeed: 19.7,
        drivingTime: 14_400,
        region: 'Krasnodar Krai',
        previewPolyline: null,
      }],
      total: 1,
    });
    mount('/app/trips');
    await waitFor(() => expect(screen.getByText('Krasnodar → Sochi')).toBeTruthy());
    expect(screen.getByText('284.3 km')).toBeTruthy();
    expect(screen.getByText('4 h 0 min')).toBeTruthy();
  });
});
