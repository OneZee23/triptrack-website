// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, listTrips, tripDetail, type TripSummary } from './api';
import { useTripLibrary } from './useTripLibrary';

vi.mock('./api', async (importOriginal) => ({
  ...await importOriginal<typeof import('./api')>(),
  listTrips: vi.fn(),
  tripDetail: vi.fn(),
}));

const list = vi.mocked(listTrips);

function trip(id: string, title = id): TripSummary {
  return { id, title, region: null, startDate: '2026-10-02T12:00:00Z', endDate: null,
    distance: 1_000, maxSpeed: 10, averageSpeed: 5, drivingTime: 200, previewPolyline: null };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => cleanup());

describe('useTripLibrary', () => {
  it('shows loaded summaries while fetching the next page and deduplicates overlaps without fetching full tracks', async () => {
    const next = deferred<{ trips: TripSummary[]; total: number }>();
    list.mockResolvedValueOnce({ trips: [trip('a'), trip('b')], total: 4 })
      .mockReturnValueOnce(next.promise);
    const { result } = renderHook(() => useTripLibrary());
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(result.current.trips.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.current.loading).toBe(true);
    expect(result.current.total).toBe(4);
    expect(list.mock.calls).toEqual([[100, 0], [100, 2]]);

    await act(async () => next.resolve({ trips: [trip('b', 'Changed'), trip('c')], total: 4 }));
    expect(result.current.loading).toBe(false);
    expect(result.current.trips.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.trips.find((item) => item.id === 'b')?.title).toBe('Changed');
    expect(tripDetail).not.toHaveBeenCalled();
  });

  it('preserves the first page when the second fails and retries that offset, not the whole library', async () => {
    list.mockResolvedValueOnce({ trips: [trip('a'), trip('b')], total: 3 })
      .mockRejectedValueOnce(new ApiError('NETWORK'))
      .mockResolvedValueOnce({ trips: [trip('c')], total: 3 });
    const { result } = renderHook(() => useTripLibrary());
    await waitFor(() => expect(result.current.error).toBe('NETWORK'));
    expect(result.current.trips).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    await act(async () => result.current.retry());
    expect(list.mock.calls).toEqual([[100, 0], [100, 2], [100, 2]]);
    expect(result.current.error).toBeNull();
    expect(result.current.trips.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('discards an older in-flight page after the user refreshes the library', async () => {
    const older = deferred<{ trips: TripSummary[]; total: number }>();
    list.mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce({ trips: [trip('fresh')], total: 1 });
    const { result } = renderHook(() => useTripLibrary());
    await act(async () => result.current.refresh());
    expect(result.current.trips.map((item) => item.id)).toEqual(['fresh']);
    await act(async () => older.resolve({ trips: [trip('stale')], total: 100 }));
    expect(result.current.trips.map((item) => item.id)).toEqual(['fresh']);
    expect(result.current.total).toBe(1);
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('stops pagination when a concurrently shortened history returns an empty page', async () => {
    list.mockResolvedValueOnce({ trips: [trip('a')], total: 4 })
      .mockResolvedValueOnce({ trips: [], total: 4 });
    const { result } = renderHook(() => useTripLibrary());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(list.mock.calls).toEqual([[100, 0], [100, 1]]);
    expect(result.current.trips).toHaveLength(1);
  });

  it('does not continue fetching an old account after the owning tree is unmounted', async () => {
    const pending = deferred<{ trips: TripSummary[]; total: number }>();
    list.mockReturnValueOnce(pending.promise);
    const { unmount } = renderHook(() => useTripLibrary());
    unmount();
    await act(async () => pending.resolve({ trips: [trip('old-account')], total: 100 }));
    expect(list).toHaveBeenCalledTimes(1);
  });
});
