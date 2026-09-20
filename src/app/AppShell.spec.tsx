// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { clientRoutes } from '../routes';
import { setSession } from './api';

// The REAL route tree, so the test sees what the browser sees: `/app` mounted
// under both language roots, `LanguageProvider` inside `AppLayout` reading the
// language off the pathname, and the section's pages arriving lazily.
function mount(initial: string) {
  const router = createMemoryRouter(clientRoutes(), { initialEntries: [initial] });
  return render(<RouterProvider router={router} />);
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

const signInButton = () => screen.queryByRole('button', { name: /sign in with apple/i });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('the /app guard', () => {
  it('sends a visitor without a session to the sign-in page', async () => {
    mount('/app/trips');
    await waitFor(() => expect(signInButton()).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(/no trips yet/i)).toBeTruthy());
    expect(signInButton()).toBeNull();
  });
});

describe('the language prefix', () => {
  it('serves the section under /ru too, in Russian', async () => {
    signIn();
    respondWith({ trips: [], total: 0 });
    const { container } = mount('/ru/app/trips');
    await waitFor(() => expect(screen.getByText(/пока нет поездок/i)).toBeTruthy());
    // And its own links stay Russian — the header's «Мои поездки» included.
    // Internal links only: the App Store URL has "/app/" in it as well.
    const appLinks = [...container.querySelectorAll('a[href^="/"]')]
      .map((a) => a.getAttribute('href') ?? '')
      .filter((to) => to.includes('/app'));
    expect(appLinks.length).toBeGreaterThan(0);
    for (const to of appLinks) expect(to).toMatch(/^\/ru\/app/);
  });

  it('redirects a signed-out Russian visitor to the Russian sign-in page', async () => {
    const router = createMemoryRouter(clientRoutes(), { initialEntries: ['/ru/app/trips'] });
    render(<RouterProvider router={router} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /войти через apple/i })).toBeTruthy());
    expect(router.state.location.pathname).toBe('/ru/app/login');
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

  it('does not keep the canonical of the page it was opened from', async () => {
    // As if the visitor had been on the home page and clicked «My trips».
    const stale = document.createElement('link');
    stale.setAttribute('rel', 'canonical');
    stale.setAttribute('href', 'https://trip-track.app/');
    document.head.appendChild(stale);

    mount('/app/login');
    await waitFor(() => expect(document.head.querySelector('link[rel="canonical"]')).toBeNull());
    expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
  });

  it('takes its title from the one meta table, not from a second copy', async () => {
    mount('/app/login');
    await waitFor(() => expect(document.title).toBe('My trips — TripTrack'));
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
    expect(screen.getByRole('link', { name: /Krasnodar → Sochi/ }).getAttribute('href'))
      .toBe('/app/trips/0d2f5c1e-0000-4000-8000-000000000001');
  });
});
