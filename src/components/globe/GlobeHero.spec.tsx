// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ComponentType, ReactNode } from 'react';

// MapGlobe pulls in maplibre-gl (WebGL) which doesn't run in jsdom — stub it.
vi.mock('./MapGlobe', () => ({ default: () => <div data-testid="interactive-globe" /> }));

/** Give each case a fresh lazy import and matching translation context. */
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

  it('does not probe WebGL or load an interactive map just by opening the page', async () => {
    const probe = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const idle = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    await mount();
    expect(probe).not.toHaveBeenCalled();
    expect(idle).not.toHaveBeenCalled();
    expect(screen.queryByTestId('interactive-globe')).toBeNull();
    expect(screen.getByRole('button', { name: /spin the globe/i })).toBeTruthy();
  });

  it('loads the interactive globe when requested and releases the probe context', async () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn().mockReturnValue({ loseContext });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ getExtension } as unknown as RenderingContext);
    await mount();
    fireEvent.click(screen.getByRole('button', { name: /spin the globe/i }));
    await waitFor(() => expect(screen.getByTestId('interactive-globe')).toBeTruthy());
    expect(getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('keeps the poster and explains when the requested map cannot use WebGL', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await mount();
    fireEvent.click(screen.getByRole('button', { name: /spin the globe/i }));
    expect(screen.getByText(/interactive map could not load/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /spin the globe/i })).toBeNull();
    expect(screen.queryByText(/drag · zoom/i)).toBeNull();
    expect(screen.getByRole('img', { name: /globe with recorded road trips/i })).toBeTruthy();
  });
});
