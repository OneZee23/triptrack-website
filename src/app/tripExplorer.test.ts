import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TripDetail, TripSummary } from './api';
import { detailCoordinates, filterTrips, mergeTrips, previewCoordinates, validCoordinate } from './tripExplorer';

function preview(points: [number, number][]): string {
  const bytes = new Uint8Array(points.length * 8);
  const view = new DataView(bytes.buffer);
  points.forEach(([lat, lng], index) => {
    view.setFloat32(index * 8, lat, true);
    view.setFloat32(index * 8 + 4, lng, true);
  });
  return btoa(String.fromCharCode(...bytes));
}

function trip(id: string, overrides: Partial<TripSummary> = {}): TripSummary {
  return {
    id, title: 'Coastal drive', region: 'South coast', startDate: '2026-10-02T12:00:00.000Z',
    endDate: '2026-10-02T13:00:00.000Z', distance: 40_000, maxSpeed: 25,
    averageSpeed: 18, drivingTime: 3_600, previewPolyline: null, ...overrides,
  };
}

function detail(overrides: Partial<TripDetail> = {}): TripDetail {
  return { ...trip('detail'), description: null, maxAltitude: null, stoppedTime: null, ...overrides };
}

afterEach(() => vi.unstubAllEnvs());

describe('route geometry', () => {
  it('accepts coordinates on the valid boundary but rejects missing, non-finite and out-of-range coordinates', () => {
    expect(validCoordinate(90, -180)).toBe(true);
    expect(validCoordinate(0, 0)).toBe(true);
    for (const [lat, lng] of [[null, 20], [20, null], ['10', 20], [NaN, 20], [20, Infinity], [91, 20], [20, -181]]) {
      expect(validCoordinate(lat, lng)).toBe(false);
    }
  });

  it('rejects the complete invalid preview instead of joining the points around a corrupt coordinate', () => {
    for (const invalid of [NaN, Infinity, 91]) {
      expect(previewCoordinates(trip('bad', {
        previewPolyline: preview([[45, 38], [invalid, 39], [46, 40]]),
      }))).toEqual([]);
    }
    expect(previewCoordinates(trip('one', { previewPolyline: preview([[45, 38]]) }))).toEqual([]);
    expect(previewCoordinates(trip('malformed', { previewPolyline: 'not base64!' }))).toEqual([]);
  });

  it('uses the full ordered track when it is valid', () => {
    expect(detailCoordinates(detail({
      previewPolyline: preview([[10, 20], [11, 21]]),
      trackPoints: [
        { latitude: 45, longitude: 38, timestamp: '2026-10-02T12:00:00Z', speed: 10 },
        { latitude: 46, longitude: 39, timestamp: '2026-10-02T13:00:00Z', speed: 12 },
      ],
    }))).toEqual([[45, 38], [46, 39]]);
  });

  it('falls back to the preview when a full track is corrupt and returns no geometry when both are corrupt', () => {
    const badTrack = [
      { latitude: 45, longitude: 38, timestamp: '2026-10-02T12:00:00Z', speed: 10 },
      { latitude: 46, longitude: Infinity, timestamp: '2026-10-02T13:00:00Z', speed: 12 },
    ];
    expect(detailCoordinates(detail({ trackPoints: badTrack, previewPolyline: preview([[10, 20], [11, 21]]) })))
      .toEqual([[10, 20], [11, 21]]);
    expect(detailCoordinates(detail({ trackPoints: badTrack, previewPolyline: preview([[10, 20], [NaN, 21]]) })))
      .toEqual([]);
  });
});

describe('trip search and dates', () => {
  it('matches every search word across title and region, ignoring whitespace and case', () => {
    const trips = [trip('match'), trip('region-only', { title: null }), trip('wrong-region', { region: 'North' })];
    expect(filterTrips(trips, { query: '  COASTAL   south ', from: '', to: '' }).map((item) => item.id))
      .toEqual(['match']);
    expect(filterTrips(trips, { query: 'south', from: '', to: '' }).map((item) => item.id))
      .toEqual(['match', 'region-only']);
  });

  it('uses local calendar days, including both date boundaries', () => {
    vi.stubEnv('TZ', 'Pacific/Kiritimati');
    // Construct local times, so a browser outside UTC must not filter using
    // the YYYY-MM-DD substring of the server's UTC timestamp.
    const early = new Date(2026, 9, 2, 0, 15).toISOString();
    const late = new Date(2026, 9, 2, 23, 45).toISOString();
    expect(early.slice(0, 10)).toBe('2026-10-01');
    const trips = [
      trip('before', { startDate: new Date(2026, 9, 1, 23, 59).toISOString() }),
      trip('early', { startDate: early }),
      trip('late', { startDate: late }),
      trip('after', { startDate: new Date(2026, 9, 3, 0, 1).toISOString() }),
    ];
    expect(filterTrips(trips, { query: '', from: '2026-10-02', to: '2026-10-02' }).map((item) => item.id))
      .toEqual(['early', 'late']);
  });

  it('combines the search and date range and excludes undated rows only when filtering by date', () => {
    const trips = [trip('match'), trip('undated', { startDate: 'invalid' }), trip('wrong-name', { title: 'Airport', region: null })];
    expect(filterTrips(trips, { query: 'coastal', from: '2026-10-01', to: '2026-10-03' }).map((item) => item.id))
      .toEqual(['match']);
    expect(filterTrips(trips, { query: 'coastal', from: '', to: '' }).map((item) => item.id))
      .toEqual(['match', 'undated']);
    expect(filterTrips(trips, { query: '', from: '2026-10-03', to: '2026-10-01' })).toEqual([]);
  });
});

describe('page merging', () => {
  it('deduplicates overlapping pages, keeps refreshed metadata and sorts newest first', () => {
    const previous = [trip('old', { startDate: '2026-09-01T12:00:00Z' }), trip('same')];
    const incoming = [trip('same', { title: 'Renamed on phone' }), trip('new', { startDate: '2026-10-03T12:00:00Z' })];
    const merged = mergeTrips(previous, incoming);
    expect(merged.map((item) => item.id)).toEqual(['new', 'same', 'old']);
    expect(merged[1].title).toBe('Renamed on phone');
    expect(previous[1].title).toBe('Coastal drive');
  });
});
