// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider } from '../../i18n/LanguageContext';
import GlobeHero from './GlobeHero';

afterEach(() => vi.restoreAllMocks());

describe('GlobeHero', () => {
  it('renders headline + CTA and the fallback when there are no trips', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }) }));
    render(
      <LanguageProvider>
        <GlobeHero />
      </LanguageProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link')).toBeTruthy();
    await waitFor(() => expect((globalThis.fetch as any)).toHaveBeenCalled());
  });
});
