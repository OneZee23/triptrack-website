// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ManualTripMap from './ManualTripMap';

const mock = vi.hoisted(() => {
  type MapEvent = { lngLat?: { lat: number; lng: number }; originalEvent?: { target: EventTarget } };
  const state = { maps: [] as FakeMap[], markers: [] as FakeMarker[] };
  class FakeMap {
    events: Record<string, (event?: MapEvent) => void> = {};
    sources: Record<string, { setData: ReturnType<typeof vi.fn> }> = {};
    canvas = { style: { cursor: '' } };
    fitBounds = vi.fn(); easeTo = vi.fn(); remove = vi.fn(); resize = vi.fn(); addControl = vi.fn(); addLayer = vi.fn();
    getZoom = () => 8;
    getCanvas = () => this.canvas;
    project = () => ({ x: 100, y: 100 });
    unproject = () => ({ lat: 45.1, lng: 39.1 });
    constructor() { state.maps.push(this); }
    on(name: string, callback: (event?: MapEvent) => void) { this.events[name] = callback; return this; }
    addSource(id: string) { this.sources[id] = { setData: vi.fn() }; }
    getSource(id: string) { return this.sources[id]; }
    load() { this.events['style.load'](); this.events.load(); }
  }
  class FakeMarker {
    coordinate: [number, number] = [0, 0];
    events: Record<string, () => void> = {};
    remove = vi.fn();
    draggable = false;
    options: { element: HTMLButtonElement };
    constructor(options: { element: HTMLButtonElement }) { this.options = options; state.markers.push(this); }
    setLngLat(coordinate: [number, number]) { this.coordinate = coordinate; return this; }
    getLngLat() { return { lat: this.coordinate[1], lng: this.coordinate[0] }; }
    setDraggable(value: boolean) { this.draggable = value; return this; }
    addTo() { return this; }
    on(name: string, callback: () => void) { this.events[name] = callback; return this; }
  }
  class FakeBounds { extend() { return this; } }
  class FakeControl {}
  return { state, FakeMap, FakeMarker, FakeBounds, FakeControl };
});

vi.mock('maplibre-gl', () => ({ default: {
  Map: mock.FakeMap, Marker: mock.FakeMarker, LngLatBounds: mock.FakeBounds,
  NavigationControl: mock.FakeControl, ScaleControl: mock.FakeControl,
} }));

const initialProps = {
  waypoints: [{ id: 'first', name: 'First stop', latitude: 45, longitude: 39 }],
  coordinates: [] as [number, number][], routePending: false,
  onAdd: vi.fn(), onMove: vi.fn(), focus: null, fitRequest: 0, disabled: false,
};

beforeEach(() => {
  mock.state.maps.length = 0; mock.state.markers.length = 0;
  initialProps.onAdd.mockClear(); initialProps.onMove.mockClear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function click(map: InstanceType<typeof mock.FakeMap>, latitude: number, longitude: number, target: Element = document.createElement('canvas')) {
  act(() => map.events.click({ lngLat: { lat: latitude, lng: longitude }, originalEvent: { target } }));
}

describe('the manual route map', () => {
  it('keeps the map and camera while using the latest click and move callbacks', () => {
    const view = render(<ManualTripMap {...initialProps} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    const onAdd = vi.fn(), onMove = vi.fn();
    view.rerender(<ManualTripMap {...initialProps} onAdd={onAdd} onMove={onMove} />);
    click(map, 46, 40);
    expect(onAdd).toHaveBeenCalledWith([46, 40]);
    expect(initialProps.onAdd).not.toHaveBeenCalled();
    const marker = mock.state.markers[0];
    act(() => { marker.events.dragstart(); marker.setLngLat([40, 46]); marker.events.dragend(); });
    expect(onMove).toHaveBeenCalledWith('first', [46, 40]);
    click(map, 46, 40);
    expect(onAdd).toHaveBeenCalledTimes(1); // Release after dragging does not append.
    view.rerender(<ManualTripMap {...initialProps} waypoints={[...initialProps.waypoints, { id: 'second', name: '', latitude: 46, longitude: 40 }]} />);
    expect(mock.state.maps).toHaveLength(1);
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('ignores map and marker edits while saving, and ignores marker clicks as new points', () => {
    const view = render(<ManualTripMap {...initialProps} />);
    const map = mock.state.maps[0]; act(() => map.load());
    const target = document.createElement('button'); target.className = 'maplibregl-marker';
    click(map, 46, 40, target);
    expect(initialProps.onAdd).not.toHaveBeenCalled();
    view.rerender(<ManualTripMap {...initialProps} disabled />);
    const marker = mock.state.markers[0];
    expect(marker.draggable).toBe(false);
    expect(marker.options.element.disabled).toBe(true);
    click(map, 46, 40);
    act(() => { marker.setLngLat([40, 46]); marker.events.dragend(); });
    expect(initialProps.onAdd).not.toHaveBeenCalled();
    expect(initialProps.onMove).not.toHaveBeenCalled();
    expect(marker.coordinate).toEqual([39, 45]);
  });

  it('rejects out-of-bounds map coordinates and keeps waypoint labels as plain text', () => {
    const view = render(<ManualTripMap {...initialProps} waypoints={[
      { ...initialProps.waypoints[0], name: '<img src=x onerror=alert(1)>' },
      { id: 'invalid', name: '', latitude: 95, longitude: 40 },
    ]} />);
    const map = mock.state.maps[0]; act(() => map.load());
    click(map, 91, 39); click(map, 45, 181); click(map, NaN, 39);
    expect(initialProps.onAdd).not.toHaveBeenCalled();
    expect(mock.state.markers).toHaveLength(1);
    expect(mock.state.markers[0].options.element.querySelector('img')).toBeNull();
    expect(mock.state.markers[0].options.element.title).toContain('<img');
    view.unmount();
  });

  it('previews pending waypoints, fits only on request, and lets a keyboard move a point', () => {
    const points = [...initialProps.waypoints, { id: 'second', name: 'Second stop', latitude: 46, longitude: 40 }];
    const props = { ...initialProps, waypoints: points, routePending: true };
    const view = render(<ManualTripMap {...props} />);
    const map = mock.state.maps[0]; act(() => map.load());
    expect(map.fitBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ padding: { top: 64, left: 64, right: 64, bottom: 140 } }));
    const data = map.sources['manual-trip-route'].setData.mock.lastCall?.[0];
    expect(data.features[0].properties.pending).toBe(true);
    expect(data.features[0].geometry.coordinates).toEqual([[39, 45], [40, 46]]);
    view.rerender(<ManualTripMap {...props} focus={{ id: 'second', request: 1 }} />);
    expect(map.easeTo).toHaveBeenLastCalledWith(expect.objectContaining({ center: [40, 46], zoom: 12, offset: [0, -38] }));
    expect(map.easeTo.mock.lastCall?.[0]).not.toHaveProperty('padding');
    view.rerender(<ManualTripMap {...props} fitRequest={1} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(mock.state.markers[0].options.element, { key: 'ArrowRight' });
    expect(initialProps.onMove).toHaveBeenCalledWith('first', [45.1, 39.1]);
    expect(initialProps.onAdd).not.toHaveBeenCalled();
  });

  it('keeps mobile route endpoints above the taller instruction card when the parent requests fitting a second search result', () => {
    const originalMatchMedia = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...originalMatchMedia(query), matches: query === '(max-width: 699px)' }));
    const view = render(<ManualTripMap {...initialProps} focus={{ id: 'first', request: 1 }} />);
    const map = mock.state.maps[0]; act(() => map.load());
    expect(map.easeTo).toHaveBeenLastCalledWith(expect.objectContaining({ offset: [0, -48] }));
    expect(map.easeTo.mock.lastCall?.[0]).not.toHaveProperty('padding');
    const points = [...initialProps.waypoints, { id: 'second', name: 'Second stop', latitude: 46, longitude: 40 }];
    view.rerender(<ManualTripMap {...initialProps} waypoints={points} routePending focus={null} fitRequest={1} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
    expect(map.fitBounds).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ padding: { top: 64, left: 64, right: 64, bottom: 160 } }));
    expect(map.easeTo).toHaveBeenCalledTimes(1);
    // Finishing the async road lookup updates the route without jumping again.
    view.rerender(<ManualTripMap {...initialProps} waypoints={points} coordinates={[[45, 39], [45.5, 39.5], [46, 40]]} focus={null} fitRequest={1} />);
    expect(map.fitBounds).toHaveBeenCalledTimes(2);
  });

  it('offers retry for the initial map failure while keeping the draft controlled by the form', () => {
    render(<ManualTripMap {...initialProps} />);
    act(() => mock.state.maps[0].events.error());
    expect(screen.getByRole('alert').textContent).toContain('points you added are still in the form');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mock.state.maps).toHaveLength(2);
    act(() => mock.state.maps[1].load());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(initialProps.onAdd).not.toHaveBeenCalled();
    expect(initialProps.onMove).not.toHaveBeenCalled();
  });
});
