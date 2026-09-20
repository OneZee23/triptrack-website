// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { LanguageProvider } from '../../i18n/LanguageContext';
import GlobeHero from './GlobeHero';

// MapGlobe pulls in maplibre-gl (WebGL) which doesn't run in jsdom — stub it.
vi.mock('./MapGlobe', () => ({ default: () => null }));

afterEach(() => vi.restoreAllMocks());

describe('GlobeHero', () => {
  it('renders headline + CTA', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    // LanguageProvider reads the language off the path, so it needs a router.
    render(
      <MemoryRouter initialEntries={['/']}>
        <LanguageProvider>
          <GlobeHero />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /app store/i })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });

  it('speaks Russian on a /ru path, with no ?lang and nothing stored', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: null, trips: [] }) }));
    render(
      <MemoryRouter initialEntries={['/ru/']}>
        <LanguageProvider>
          <GlobeHero />
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Дневник поездок — на карте мира');
  });
});
