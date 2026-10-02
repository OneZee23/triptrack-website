// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../i18n/LanguageContext';
import { ApiError, listTrips, tripDetail, type TripDetail, type TripSummary } from './api';
import TripsPage from './TripsPage';
import { routingCapabilities, type RoutingCapabilities } from './manualApi';

vi.mock('./api', async (importOriginal) => ({
  ...await importOriginal<typeof import('./api')>(),
  listTrips: vi.fn(),
  tripDetail: vi.fn(),
}));
vi.mock('./manualApi', () => ({ routingCapabilities: vi.fn() }));

vi.mock('./TripsMap', () => ({
  default: ({ routes, selectedId, selectedCoords, onSelect }: {
    routes: { id: string }[]; selectedId: string | null;
    selectedCoords: [number, number][] | null; onSelect: (id: string) => void;
  }) => (
    <div data-testid="map" data-selected={selectedId ?? ''} data-coordinates={JSON.stringify(selectedCoords)}>
      {routes.map((route) => <button key={route.id} onClick={() => onSelect(route.id)}>Map route {route.id}</button>)}
    </div>
  ),
}));

const list = vi.mocked(listTrips);
const fetchDetail = vi.mocked(tripDetail);

function trip(id: string, title: string, overrides: Partial<TripSummary> = {}): TripSummary {
  return { id, title, region: 'South coast', startDate: '2026-10-02T12:00:00Z', endDate: '2026-10-02T13:00:00Z',
    distance: 40_000, maxSpeed: 25, averageSpeed: 18, drivingTime: 3_600, previewPolyline: null, ...overrides };
}

function detail(summary: TripSummary, latitude: number): TripDetail {
  return { ...summary, description: null, maxAltitude: null, stoppedTime: null,
    trackPoints: [
      { latitude, longitude: 38, timestamp: summary.startDate, speed: 10 },
      { latitude: latitude + 1, longitude: 39, timestamp: summary.endDate!, speed: 12 },
    ], checkpoints: [] };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function mount() {
  return render(<MemoryRouter initialEntries={['/app/trips']}><LanguageProvider><TripsPage /></LanguageProvider></MemoryRouter>);
}

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();
  vi.mocked(routingCapabilities).mockResolvedValue({ manualTrips: true, search: false, routing: false });
});
afterEach(() => cleanup());

describe('desktop trip explorer', () => {
  it.each([false, true])('exposes creation only when manualTrips is explicitly enabled, including an empty library (enabled=%s)', async (enabled) => {
    vi.mocked(routingCapabilities).mockResolvedValue({ manualTrips: enabled, search: false, routing: false });
    list.mockResolvedValue({ trips: [], total: 0 });
    mount();
    await screen.findByRole('heading', { name: 'No trips yet' });
    expect(!!screen.queryByRole('link', { name: /Add a trip/ })).toBe(enabled);
  });

  it.each(['disabled', 'older-api', 'network-error'])('keeps synced trips readable and hides creation when rollout is unavailable: %s', async (condition) => {
    if (condition === 'network-error') vi.mocked(routingCapabilities).mockRejectedValue(new ApiError('NETWORK'));
    else vi.mocked(routingCapabilities).mockResolvedValue((condition === 'disabled' ? { manualTrips: false, search: false, routing: false } : { search: true, routing: true }) as RoutingCapabilities);
    list.mockResolvedValue({ trips: [trip('a', 'Airport drive')], total: 1 });
    mount();
    await screen.findByRole('button', { name: /Airport drive/ });
    expect(screen.queryByRole('link', { name: /Add a trip/ })).toBeNull();
    expect(await screen.findByTestId('map')).toBeTruthy();
  });

  it('keeps trip B selected when the previous request for trip A finishes later', async () => {
    const a = trip('a', 'Airport drive');
    const b = trip('b', 'Coastal drive');
    const pendingA = deferred<TripDetail>();
    const pendingB = deferred<TripDetail>();
    list.mockResolvedValueOnce({ trips: [a, b], total: 2 });
    fetchDetail.mockImplementation((id) => id === 'a' ? pendingA.promise : pendingB.promise);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Airport drive/ }));
    expect(fetchDetail).toHaveBeenCalledWith('a');
    fireEvent.click(screen.getByRole('button', { name: /Coastal drive/ }));
    await act(async () => pendingB.resolve(detail(b, 50)));
    await waitFor(() => expect(screen.getByTestId('map').getAttribute('data-coordinates')).toBe('[[50,38],[51,39]]'));
    await act(async () => pendingA.resolve(detail(a, 40)));
    expect(screen.getByTestId('map').getAttribute('data-selected')).toBe('b');
    expect(screen.getByTestId('map').getAttribute('data-coordinates')).toBe('[[50,38],[51,39]]');
    expect(screen.getByRole('link', { name: 'Trip details' }).getAttribute('href')).toBe('/app/trips/b');
  });

  it('filters list and map together, closes filtered-away details, and distinguishes no matches from an empty account', async () => {
    const a = trip('a', 'Airport drive');
    const b = trip('b', 'Coastal drive');
    const pending = deferred<TripDetail>();
    list.mockResolvedValueOnce({ trips: [a, b], total: 2 });
    fetchDetail.mockReturnValue(pending.promise);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Airport drive/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Trip name or region' }), { target: { value: 'coastal SOUTH' } });
    expect(screen.queryByRole('button', { name: /Airport drive/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Coastal drive/ })).toBeTruthy();
    await act(async () => pending.resolve(detail(a, 40)));
    expect(screen.getByTestId('map').getAttribute('data-selected')).toBe('');
    expect(screen.queryByRole('link', { name: 'Trip details' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Map route a' })).toBeNull();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unmatched' } });
    expect(screen.getByRole('heading', { name: 'No matching trips' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'No trips yet' })).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(screen.getByRole('button', { name: /Airport drive/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Coastal drive/ })).toBeTruthy();
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('keeps loaded trips and a partial-history status visible when a later page fails, then retries', async () => {
    list.mockResolvedValueOnce({ trips: [trip('a', 'Airport drive')], total: 2 })
      .mockRejectedValueOnce(new ApiError('NETWORK'))
      .mockResolvedValueOnce({ trips: [trip('b', 'Coastal drive')], total: 2 });
    mount();
    expect(await screen.findByRole('button', { name: /Airport drive/ })).toBeTruthy();
    expect(await screen.findByText('Loaded 1 of 2')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: /Coastal drive/ })).toBeTruthy();
    expect(screen.getByText('History loaded')).toBeTruthy();
    expect(list.mock.calls).toEqual([[100, 0], [100, 1], [100, 1]]);
  });

  it('shows privacy-trimmed checkpoints but disables map focus when their coordinates are absent', async () => {
    const a = trip('a', 'Airport drive');
    list.mockResolvedValueOnce({ trips: [a], total: 1 });
    fetchDetail.mockResolvedValueOnce({ ...detail(a, 45), checkpoints: [{
      id: 'private-checkpoint', name: 'At home', timestamp: a.startDate,
      latitude: null, longitude: null, distanceFromStart: 0, elapsedFromStart: 0,
    }] });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /Airport drive/ }));
    const checkpoint = await screen.findByRole('button', { name: 'At home' });
    expect((checkpoint as HTMLButtonElement).disabled).toBe(true);
    expect(checkpoint.getAttribute('title')).toBe('Coordinates are unavailable for this checkpoint');
  });
});
