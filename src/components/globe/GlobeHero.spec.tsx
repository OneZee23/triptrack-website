// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    render(
      <LanguageProvider>
        <GlobeHero />
      </LanguageProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /app store/i })).toBeTruthy();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  });
});
