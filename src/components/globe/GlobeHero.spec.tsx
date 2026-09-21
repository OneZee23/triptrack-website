// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ComponentType, ReactNode } from 'react';

// MapGlobe pulls in maplibre-gl (WebGL) which doesn't run in jsdom — stub it.
vi.mock('./MapGlobe', () => ({ default: () => null }));

/**
 * `useGlobePlan` settles once per page load and caches the answer, so each case
 * that needs a different browser re-imports the module graph rather than
 * fighting the cache. The alternative — a reset hatch exported from production
 * code — would exist only for the tests.
 */
async function mount(path = '/') {
  vi.resetModules();
  // Both halves come from the SAME fresh graph: a LanguageProvider imported at
  // the top of the file would hand out a context object the re-imported hero
  // does not read, and every string would come back as its own key.
  const { default: GlobeHero } = (await import('./GlobeHero')) as { default: ComponentType };
  const { LanguageProvider } = (await import('../../i18n/LanguageContext')) as {
    LanguageProvider: ComponentType<{ children: ReactNode }>;
  };
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <GlobeHero />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

/** jsdom has no WebGL at all, so "can draw a globe" has to be faked on. */
function withWebGL() {
  vi.stubGlobal('WebGLRenderingContext', class {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as unknown as RenderingContext);
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }) }),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('GlobeHero', () => {
  it('renders headline + CTA', async () => {
    await mount();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /app store/i })).toBeTruthy();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it('speaks Russian on a /ru path, with no ?lang and nothing stored', async () => {
    await mount('/ru/');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Дневник поездок — на карте мира');
  });

  it('offers the map rather than downloading it, and says nothing about dragging', async () => {
    withWebGL();
    await mount();
    expect(screen.getByRole('button', { name: /spin the globe/i })).toBeTruthy();
    // The drag/zoom line describes a map that is not on screen yet.
    expect(screen.queryByText(/drag · zoom/i)).toBeNull();
    // What IS on screen is the poster, drawn from the trips themselves.
    expect(screen.getByRole('img', { name: /globe with recorded road trips/i })).toBeTruthy();
  });

  it('without WebGL: explains itself in the copy, offers no button, still shows the globe', async () => {
    // No withWebGL() — jsdom's canvas has no context, which is the real case.
    await mount();
    expect(screen.getByText(/can’t show the interactive map/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /spin the globe/i })).toBeNull();
    expect(screen.queryByText(/drag · zoom/i)).toBeNull();
    expect(screen.getByRole('img', { name: /globe with recorded road trips/i })).toBeTruthy();
  });
});
