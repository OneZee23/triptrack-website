// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGlobeData } from './useGlobeData';

const sample = {
  stats: { trips: 1, cities: 1 },
  trips: [{ id: 'a', region: 'X', coords: [[1, 2], [3, 4]] }],
};

afterEach(() => vi.restoreAllMocks());

describe('useGlobeData', () => {
  it('returns success with data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(sample) }));
    const { result } = renderHook(() => useGlobeData());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('returns empty when no trips', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stats: { trips: 0, cities: 0 }, trips: [] }) }));
    const { result } = renderHook(() => useGlobeData());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const { result } = renderHook(() => useGlobeData());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
