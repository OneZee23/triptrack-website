// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TripMap from './TripMap';

const mock = vi.hoisted(() => {
  const state = { maps: [] as FakeMap[], fail: false };
  class FakeMap {
    options: { cooperativeGestures?: boolean };
    events: Record<string, () => void> = {};
    source = { setData: vi.fn() };
    fitBounds = vi.fn(); easeTo = vi.fn(); addControl = vi.fn(); addLayer = vi.fn(); addSource = vi.fn();
    resize = vi.fn(); remove = vi.fn();
    getSource = () => this.source;
    getCanvas = () => ({ style: { cursor: '' } });
    constructor(options: { cooperativeGestures?: boolean }) {
      if (state.fail) throw new Error('WebGL failure with internal details');
      this.options = options; state.maps.push(this);
    }
    on(name: string, callback: () => void) { this.events[name] = callback; return this; }
    load() { this.events['style.load'](); this.events.load(); }
  }
  class FakeMarker { setLngLat() { return this; } setPopup() { return this; } addTo() { return this; } remove() {} }
  class FakePopup { setText() { return this; } }
  class FakeControl {}
  return { state, FakeMap, FakeMarker, FakePopup, FakeControl };
});
vi.mock('maplibre-gl', () => ({ default: {
  Map: mock.FakeMap, Marker: mock.FakeMarker, Popup: mock.FakePopup,
  NavigationControl: mock.FakeControl, FullscreenControl: mock.FakeControl, ScaleControl: mock.FakeControl,
} }));

const coords: [number, number][] = [[45, 39], [46, 40]];
beforeEach(() => { mock.state.maps.length = 0; mock.state.fail = false; });
afterEach(cleanup);

describe('the standalone trip map', () => {
  it('frames the whole route with equal padding and permits page scrolling', () => {
    const view = render(<TripMap coords={coords} />);
    const map = mock.state.maps[0];
    act(() => map.load());
    expect(map.fitBounds).toHaveBeenLastCalledWith([[39, 45], [40, 46]], expect.objectContaining({ padding: 48 }));
    expect(map.options.cooperativeGestures).toBe(true);
    view.rerender(<TripMap coords={[...coords]} />);
    expect(mock.state.maps).toHaveLength(1);
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
  });

  it('shows loading and a retry for a failed style instead of leaving a blank panel', () => {
    render(<TripMap coords={coords} />);
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => mock.state.maps[0].events.error());
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mock.state.maps[0].remove).toHaveBeenCalledTimes(1);
    act(() => mock.state.maps[1].load());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('explains an unavailable WebGL map using localized application text', async () => {
    mock.state.fail = true;
    render(<TripMap coords={coords} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('The map is unavailable');
    expect(alert.textContent).not.toContain('internal details');
  });
});
