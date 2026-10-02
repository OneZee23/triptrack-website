// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import RootBoundary from './RootBoundary';
import AppLayout from './AppLayout';
import NotFound from '../pages/NotFound';

function mount(child: RouteObject, path = '/') {
  const router = createMemoryRouter([
    { path: '/', Component: AppLayout, ErrorBoundary: RootBoundary, children: [child] },
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  localStorage.clear();
  // React reports intentionally thrown route errors to the console as well.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('route error recovery', () => {
  it('does not call a rendering failure a missing page', async () => {
    mount({ index: true, Component: () => { throw new Error('Unexpected profile state'); } });
    expect(await screen.findByRole('heading', { name: 'Could not open this page' })).toBeTruthy();
    expect(screen.queryByText('404')).toBeNull();
    expect(screen.queryByText('Unexpected profile state')).toBeNull();
    expect(document.title).toBe('Could not open this page — TripTrack');
  });

  it('offers an explicit reload after a rejected page import without clearing the session', async () => {
    localStorage.setItem('session-fixture', 'preserve-me');
    const reload = vi.fn();
    const browserWindow = window;
    vi.stubGlobal('window', new Proxy(browserWindow, {
      get(target, key) {
        if (key === 'location') return { ...target.location, reload };
        return Reflect.get(target, key);
      },
    }));
    mount({ index: true, lazy: async () => { throw new TypeError('Failed to fetch dynamically imported module'); } });
    const button = await screen.findByRole('button', { name: 'Reload page' });
    expect(screen.queryByText('404')).toBeNull();
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(reload).toHaveBeenCalledOnce();
    expect(localStorage.getItem('session-fixture')).toBe('preserve-me');
  });

  it('localizes recovery and uses a normal document link to leave a failed router', async () => {
    mount({ path: 'ru/features', loader: () => { throw new Error('Broken response'); } }, '/ru/features');
    expect(await screen.findByRole('heading', { name: 'Не удалось открыть страницу' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Обновить страницу' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'На главную' });
    expect(link.getAttribute('href')).toBe('/ru/');
    // React Router's Link intercepts navigation and marks itself as discovered.
    expect(link.hasAttribute('data-discover')).toBe(false);
  });

  it('keeps an actual route 404 distinct from runtime failures', async () => {
    mount({ index: true, loader: () => { throw new Response('Missing', { status: 404 }); } });
    expect(await screen.findByRole('heading', { name: 'No such page' })).toBeTruthy();
    expect(screen.getByText('404')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();
  });

  it('keeps the normal unknown-address page inside the site layout', async () => {
    mount({ path: '*', Component: NotFound }, '/unknown');
    expect(await screen.findByRole('heading', { name: 'No such page' })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();
  });
});
