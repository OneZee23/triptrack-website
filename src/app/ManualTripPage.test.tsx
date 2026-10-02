// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import ManualTripPage from './ManualTripPage';
import { manualCopy } from './manualCopy';
import { buildRoadRoute, createManualTrip, listVehicles, proStatus, routingCapabilities, searchPlaces, type Coordinate, type ManualTripInput, type RouteResult, type RoutingCapabilities } from './manualApi';

vi.mock('../i18n/useTranslation', () => ({ useTranslation: () => ({ lang: 'en', t: (key: string) => key, href: (path: string) => path }) }));
vi.mock('./manualApi', () => ({
  proStatus: vi.fn(), listVehicles: vi.fn(), routingCapabilities: vi.fn(),
  buildRoadRoute: vi.fn(), searchPlaces: vi.fn(), createManualTrip: vi.fn(),
}));
vi.mock('./ManualTripMap', () => ({
  default: ({ coordinates, waypoints, onAdd, disabled }: {
    coordinates: Coordinate[]; waypoints: { latitude: number; longitude: number }[];
    onAdd: (coordinate: Coordinate) => void; disabled: boolean;
  }) => <div data-testid="manual-map" data-coordinates={JSON.stringify(coordinates)} data-waypoints={JSON.stringify(waypoints)}>
    <button disabled={disabled} onClick={() => onAdd([45, 39])}>Add test start</button>
    <button disabled={disabled} onClick={() => onAdd([45, 39.01])}>Add test finish</button>
    <button disabled={disabled} onClick={() => onAdd([45.01, 39.01])}>Add test stop</button>
  </div>,
}));

const c = manualCopy.en;
const active = { active: true, until: null, isTrial: false, productId: 'pro.monthly' };
const inactive = { ...active, active: false };
const response = { id: 'trip-result', conflictVersion: 1, serverCreatedAt: '2026-10-02T12:00:00Z' };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function mount() {
  const router = createMemoryRouter([{ path: '/app/trips/new', element: <ManualTripPage /> },
    { path: '/app/trips', element: <div>Trip library</div> }], { initialEntries: ['/app/trips/new'] });
  return { ...render(<RouterProvider router={router} />), router };
}
async function addRoute() {
  fireEvent.click(await screen.findByRole('button', { name: 'Add test start' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add test finish' }));
}
async function details() {
  await waitFor(() => expect(screen.getByRole('button', { name: c.next }).hasAttribute('disabled')).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: c.next }));
  fireEvent.change(screen.getByLabelText(c.tripTitle), { target: { value: 'Weekend drive' } });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(proStatus).mockResolvedValue(active);
  vi.mocked(routingCapabilities).mockResolvedValue({ manualTrips: true, routing: false, search: false });
  vi.mocked(listVehicles).mockResolvedValue({ vehicles: [] });
  vi.mocked(createManualTrip).mockResolvedValue(response);
});
afterEach(cleanup);

describe('manual trip editor', () => {
  it.each([
    { manualTrips: false, routing: false, search: false },
    { routing: true, search: true }, // A pre-rollout API has no manualTrips flag.
    null,
  ])('keeps a direct editor link closed when capabilities are not explicitly enabled: %j', async (capabilities) => {
    vi.mocked(routingCapabilities).mockResolvedValue(capabilities as RoutingCapabilities);
    mount();
    await screen.findByRole('heading', { name: c.availableSoon });
    expect(screen.getByRole('link', { name: c.back }).getAttribute('href')).toBe('/app/trips');
    expect(screen.queryByTestId('manual-map')).toBeNull();
    for (const call of [proStatus, listVehicles, searchPlaces, buildRoadRoute, createManualTrip]) expect(call).not.toHaveBeenCalled();
  });

  it('fails closed when the capability request fails', async () => {
    vi.mocked(routingCapabilities).mockRejectedValue(new ApiError('NETWORK'));
    mount();
    await screen.findByRole('heading', { name: c.availableSoon });
    for (const call of [proStatus, listVehicles, searchPlaces, buildRoadRoute, createManualTrip]) expect(call).not.toHaveBeenCalled();
  });

  it('keeps creation behind confirmed PRO', async () => {
    vi.mocked(proStatus).mockResolvedValue(inactive);
    mount();
    await screen.findByRole('heading', { name: c.pro });
    expect(screen.queryByTestId('manual-map')).toBeNull();
    expect(createManualTrip).not.toHaveBeenCalled();
  });

  it('saves latitude-first points with a stable UUID and no client-controlled statistics', async () => {
    mount(); await addRoute(); await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByRole('heading', { name: c.saved });
    expect(createManualTrip).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(createManualTrip).mock.calls[0][0];
    expect(payload.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(payload.coordinates).toEqual([[45, 39], [45, 39.01]]);
    expect(payload.durationSeconds).toBe(3600);
    expect(payload.title).toBe('Weekend drive');
    expect(new Date(payload.startDate).getTime()).toBeLessThan(Date.now());
    expect(Object.keys(payload).sort()).toEqual(['coordinates', 'durationSeconds', 'id', 'startDate', 'title']);
  });

  it('locks an uncertain save and retries the exact same id and payload, including double clicks', async () => {
    const pending = deferred<typeof response>();
    vi.mocked(createManualTrip).mockRejectedValueOnce(new ApiError('NETWORK')).mockImplementationOnce(() => pending.promise);
    mount(); await addRoute(); await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByText(c.uncertain);
    expect((screen.getByLabelText(c.tripTitle) as HTMLInputElement).disabled).toBe(true);
    const original = structuredClone(vi.mocked(createManualTrip).mock.calls[0][0]);
    const retry = screen.getByRole('button', { name: c.retrySave });
    fireEvent.click(retry); fireEvent.click(retry);
    expect(createManualTrip).toHaveBeenCalledTimes(2);
    expect(vi.mocked(createManualTrip).mock.calls[1][0]).toEqual(original);
    await act(async () => pending.resolve(response));
    await screen.findByRole('heading', { name: c.saved });
  });

  it('preserves the draft when PRO expires at save time and allows checking again', async () => {
    vi.mocked(proStatus).mockResolvedValueOnce(active).mockResolvedValueOnce(inactive).mockResolvedValue(active);
    vi.mocked(createManualTrip).mockRejectedValueOnce(new ApiError('PRO_REQUIRED')).mockResolvedValue(response);
    mount(); await addRoute(); await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByText(c.proLost);
    expect((screen.getByLabelText(c.tripTitle) as HTMLInputElement).value).toBe('Weekend drive');
    expect(JSON.parse(screen.getByTestId('manual-map').getAttribute('data-coordinates')!)).toHaveLength(2);
    expect(screen.getByRole('button', { name: c.save }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: c.check }));
    await waitFor(() => expect(screen.getByRole('button', { name: c.save }).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByRole('heading', { name: c.saved });
  });

  it('ignores route A arriving after the user has already built route B', async () => {
    vi.mocked(routingCapabilities).mockResolvedValue({ manualTrips: true, routing: true, search: false });
    const a = deferred<RouteResult>(), b = deferred<RouteResult>();
    vi.mocked(buildRoadRoute).mockImplementationOnce(() => a.promise).mockImplementationOnce(() => b.promise);
    mount(); await addRoute();
    await waitFor(() => expect(buildRoadRoute).toHaveBeenCalledTimes(1), { timeout: 1500 });
    fireEvent.click(screen.getByRole('button', { name: 'Add test stop' }));
    await waitFor(() => expect(buildRoadRoute).toHaveBeenCalledTimes(2), { timeout: 1500 });
    const latest: Coordinate[] = [[45, 39], [45, 39.005], [45.01, 39.01]];
    await act(async () => b.resolve({ coordinates: latest, distance: 1500, durationSeconds: 600 }));
    await act(async () => a.resolve({ coordinates: [[45, 39], [45, 39.01]], distance: 780, durationSeconds: 300 }));
    expect(JSON.parse(screen.getByTestId('manual-map').getAttribute('data-coordinates')!)).toEqual(latest);
    await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByRole('heading', { name: c.saved });
    expect(vi.mocked(createManualTrip).mock.calls[0][0].coordinates).toEqual(latest);
  });

  it('waits for rollout confirmation before mounting the editor or checking PRO', async () => {
    const capabilities = deferred<RoutingCapabilities>();
    vi.mocked(routingCapabilities).mockImplementation(() => capabilities.promise);
    mount();
    expect(screen.queryByTestId('manual-map')).toBeNull();
    expect(proStatus).not.toHaveBeenCalled();
    expect(listVehicles).not.toHaveBeenCalled();
    await act(async () => capabilities.resolve({ manualTrips: true, routing: true, search: true }));
    await screen.findByTestId('manual-map');
    expect(screen.getByRole('button', { name: c.roads }).getAttribute('aria-pressed')).toBe('true');
    expect(buildRoadRoute).not.toHaveBeenCalled();
  });

  it('treats rollout being disabled at save time as a definite refusal and preserves the editable draft', async () => {
    vi.mocked(createManualTrip).mockRejectedValueOnce(new ApiError('MANUAL_TRIPS_DISABLED'));
    mount(); await addRoute(); await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByText(c.temporarilyUnavailable);
    expect(screen.queryByText(c.uncertain)).toBeNull();
    expect((screen.getByLabelText(c.tripTitle) as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText(c.tripTitle) as HTMLInputElement).value).toBe('Weekend drive');
  });

  it('treats a definitive UUID conflict as a refusal rather than an uncertain save', async () => {
    vi.mocked(createManualTrip).mockRejectedValueOnce(new ApiError('MANUAL_TRIP_ID_CONFLICT')).mockResolvedValue(response);
    mount(); await addRoute(); await details();
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByText(c.id_conflict);
    expect(screen.queryByText(c.uncertain)).toBeNull();
    expect((screen.getByLabelText(c.tripTitle) as HTMLInputElement).disabled).toBe(false);
    const first: ManualTripInput = vi.mocked(createManualTrip).mock.calls[0][0];
    fireEvent.click(screen.getByRole('button', { name: c.save }));
    await screen.findByRole('heading', { name: c.saved });
    expect(vi.mocked(createManualTrip).mock.calls[1][0].id).not.toBe(first.id);
  });

  it('supports coordinate entry without exposing a request to a search provider', async () => {
    mount(); await screen.findByTestId('manual-map');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '45.04, 138.97' } });
    fireEvent.click(screen.getByRole('button', { name: c.searchAction }));
    expect(searchPlaces).not.toHaveBeenCalled();
    const points = JSON.parse(screen.getByTestId('manual-map').getAttribute('data-waypoints')!);
    expect(points[0]).toMatchObject({ latitude: 45.04, longitude: 138.97 });
  });
});
