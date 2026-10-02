// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TripsMap from './TripsMap';

const mock = vi.hoisted(() => {
  type MapEvent = { features?: { properties?: { id?: unknown } }[] };
  const state = { maps: [] as FakeMap[], markers: [] as FakeMarker[], failConstruction: false };
  class FakeMap {
    events: Record<string, (event?: MapEvent) => void> = {};
    sources: Record<string, { setData: ReturnType<typeof vi.fn> }> = {};
    canvas = { style: { cursor: '' } };
    container = document.createElement('div');
    options: unknown;
    fitBounds = vi.fn();
    easeTo = vi.fn();
    remove = vi.fn();
    resize = vi.fn();
    addControl = vi.fn();
    addLayer = vi.fn();
    getZoom = () => 12;
    getCanvas = () => this.canvas;
    getContainer = () => this.container;
    constructor(options: unknown) {
      if (state.failConstruction) throw new Error('No WebGL');
      this.options = options;
      Object.defineProperty(this.container, 'clientHeight', { value: 600, configurable: true });
      state.maps.push(this);
    }
    on(name: string, layerOrCallback: string | ((event?: MapEvent) => void), callback?: (event?: MapEvent) => void) {
      this.events[typeof layerOrCallback === 'string' ? `${name}:${layerOrCallback}` : name]
        = typeof layerOrCallback === 'function' ? layerOrCallback : callback!;
      return this;
    }
    addSource(id: string) { this.sources[id] = { setData: vi.fn() }; }
    getSource(id: string) { return this.sources[id]; }
    load() { this.events['style.load'](); this.events.load(); }
  }
  class FakeMarker {
    coordinate: unknown;
    remove = vi.fn();
    togglePopup = vi.fn();
    options: { element: HTMLElement };
    constructor(options: { element: HTMLElement }) { this.options = options; state.markers.push(this); }
    setLngLat(coordinate: unknown) { this.coordinate = coordinate; return this; }
    setPopup() { return this; }
    addTo() { return this; }
  }
  class FakePopup { setText() { return this; } }
  class FakeControl {}
  return { state, FakeMap, FakeMarker, FakePopup, FakeControl };
});

vi.mock('maplibre-gl', () => ({ default: {
  Map: mock.FakeMap, Marker: mock.FakeMarker, Popup: mock.FakePopup,
  NavigationControl: mock.FakeControl, FullscreenControl: mock.FakeControl, ScaleControl: mock.FakeControl,
} }));

const routes = [
  { id: 'first', coords: [[55, 37], [56, 38]] as [number, number][] },
  { id: 'second', coords: [[44, 39], [45, 40]] as [number, number][] },
];
const initialProps = {
  routes, selectedId: null, selectedCoords: null, checkpoints: [], focusedCheckpointId: null,
  onSelect: vi.fn(), fitRequest: 0,
};

beforeEach(() => {
  mock.state.maps.length = 0;
  mock.state.markers.length = 0;
  mock.state.failConstruction = false;
  initialProps.onSelect.mockClear();
});
afterEach(cleanup);

describe('the private trips map', () => {
  it('keeps its map and camera through unrelated renders, while updating selection and explicit fit', () => {
    const view = render(<TripsMap {...initialProps} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.fitBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
      padding: { top: 80, left: 45, right: 55, bottom: 100 },
    }));
    const selected = { ...initialProps, selectedId: 'first', selectedCoords: [[55, 37], [57, 39]] as [number, number][] };
    view.rerender(<TripsMap {...selected} />);
    expect(mock.state.maps).toHaveLength(1);
    expect(map.fitBounds).toHaveBeenLastCalledWith([[37, 55], [39, 57]], expect.objectContaining({
      padding: { top: 80, left: 45, right: 55, bottom: 328 },
    }));
    const data = map.sources['personal-trips'].setData.mock.lastCall?.[0];
    expect(data.features.find((feature: { properties: { id: string } }) => feature.properties.id === 'first').geometry.coordinates)
      .toEqual([[37, 55], [39, 57]]);
    const onSelect = vi.fn();
    view.rerender(<TripsMap {...selected} onSelect={onSelect} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
    act(() => map.events['click:personal-trip-hit']({ features: [{ properties: { id: 'second' } }] }));
    expect(onSelect).toHaveBeenCalledWith('second');
    view.rerender(<TripsMap {...selected} fitRequest={1} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(3);
    view.unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('shows only valid checkpoints, preserves their numbers, and focuses a requested checkpoint', () => {
    const checkpoint = { name: 'Coffee stop', distanceFromStart: 100, elapsedFromStart: 30, timestamp: '2026-10-02T12:00:00Z' };
    const selected = { ...initialProps, selectedId: 'first', checkpoints: [
      { ...checkpoint, id: 'invalid', latitude: null, longitude: 37 },
      { ...checkpoint, id: 'coffee', latitude: 55.5, longitude: 37.5 },
    ] };
    const view = render(<TripsMap {...selected} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    expect(mock.state.markers).toHaveLength(3); // Start, finish, valid checkpoint.
    expect(mock.state.markers[2].coordinate).toEqual([37.5, 55.5]);
    expect(mock.state.markers[2].options.element.getAttribute('aria-label')).toContain('2');
    view.rerender(<TripsMap {...selected} focusedCheckpointId="coffee" />);
    expect(map.easeTo).toHaveBeenLastCalledWith(expect.objectContaining({ center: [37.5, 55.5], zoom: 14,
      offset: [-5, -124],
    }));
    expect(map.easeTo.mock.lastCall?.[0]).not.toHaveProperty('padding');
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    view.rerender(<TripsMap {...selected} focusedCheckpointId="coffee" fitRequest={1} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
    expect(map.easeTo).toHaveBeenCalledTimes(1);
  });

  it('reserves room for the mobile card above map attribution', () => {
    const view = render(<TripsMap {...initialProps} />);
    const map = mock.state.maps[0];
    Object.defineProperty(map.container, 'clientWidth', { value: 390 });
    act(() => map.load());
    expect(map.fitBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
      padding: { top: 80, left: 45, right: 55, bottom: 60 },
    }));
    view.rerender(<TripsMap {...initialProps} selectedId="first" />);
    expect(map.fitBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({
      padding: { top: 80, left: 45, right: 55, bottom: 356 },
    }));
  });

  it('offers a retry after an initial style failure and releases the old map', () => {
    render(<TripsMap {...initialProps} />);
    const first = mock.state.maps[0];
    act(() => first.events.error());
    expect(screen.getByRole('alert').textContent).toContain('The map is unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(first.remove).toHaveBeenCalledTimes(1);
    expect(mock.state.maps).toHaveLength(2);
    act(() => mock.state.maps[1].load());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps a working map visible when one tile fails to load', () => {
    render(<TripsMap {...initialProps} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    act(() => map.events.error());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(map.remove).not.toHaveBeenCalled();
    expect(mock.state.maps).toHaveLength(1);
  });

  it('shows WebGL loss and clears the fallback only when the context is restored', () => {
    render(<TripsMap {...initialProps} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    act(() => map.events.webglcontextlost());
    expect(screen.getByRole('alert')).toBeTruthy();
    act(() => map.events.idle());
    expect(screen.getByRole('alert')).toBeTruthy();
    act(() => map.events.webglcontextrestored());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(map.remove).not.toHaveBeenCalled();
  });

  it('handles browsers where WebGL cannot create a map without exposing the underlying error', async () => {
    mock.state.failConstruction = true;
    render(<TripsMap {...initialProps} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('The map is unavailable');
    expect(alert.textContent).not.toContain('No WebGL');
  });
});
