import { describe, expect, it, vi, afterEach } from 'vitest';
import { isTrackablePath, trackPageView } from './analytics';

/** Сторож на утечку идентификатора поездки в аналитику. До 20 сентября
 *  2026 просмотры слал сам Umami (автотрек), и `/app/trips/<uuid>` уезжал
 *  на analytics.trip-track.app как путь страницы. */
describe('isTrackablePath', () => {
  it('lets marketing pages through in both languages', () => {
    for (const path of ['/', '/features', '/ru', '/ru/features', '/privacy']) {
      expect(isTrackablePath(path)).toBe(true);
    }
  });

  it('never tracks the signed-in section', () => {
    for (const path of [
      '/app',
      '/app/',
      '/app/login',
      '/app/trips',
      '/app/trips/6f1c0a3e-1111-4222-8333-444455556666',
      '/ru/app/trips/6f1c0a3e-1111-4222-8333-444455556666',
    ]) {
      expect(isTrackablePath(path)).toBe(false);
    }
  });

  it('does not mistake a marketing page that merely starts with the letters', () => {
    expect(isTrackablePath('/apple-watch')).toBe(true);
  });
});

describe('trackPageView', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('calls the tracker once for a marketing path and never for /app', () => {
    const track = vi.fn();
    (globalThis as unknown as { window: { umami: { track: () => void } } }).window = {
      umami: { track },
    };
    trackPageView('/features');
    expect(track).toHaveBeenCalledTimes(1);
    trackPageView('/app/trips/abc');
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('survives a missing tracker', () => {
    (globalThis as unknown as { window: Record<string, unknown> }).window = {};
    expect(() => trackPageView('/features')).not.toThrow();
  });
});
