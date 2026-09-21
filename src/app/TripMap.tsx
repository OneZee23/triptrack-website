import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ACCENT } from './ui';

// Same tile source the globe on the home page uses, so the site has one
// map look and one vendor.
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const FIT = { padding: 48, maxZoom: 15 } as const;

/**
 * 55 % of the viewport, floored so it stays a map on a short phone and capped
 * so it does not become the whole screen on a desktop. A fixed 420 px was a
 * third of a laptop and half of an iPhone SE, which is the wrong way round.
 */
const HEIGHT = 'clamp(260px, 55svh, 480px)';

/** The full recorded track. Loaded lazily by the trip screen so MapLibre
 *  (~1 MB) never reaches the list or the sign-in page. */
export default function TripMap({ coords }: { coords: [number, number][] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || coords.length < 2) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const [lat, lng] of coords) bounds.extend([lng, lat]);

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: el,
        style: STYLE_URL,
        bounds,
        fitBoundsOptions: FIT,
        // Attribution stays on: the tiles are OpenFreeMap/OpenStreetMap.
        attributionControl: { compact: true },
        // On a phone this map is a picture inside a scrolling page, not the
        // page itself: one finger has to scroll past it. (The globe on the
        // home page is the opposite case and turns this off deliberately.)
        cooperativeGestures: true,
      });
    } catch {
      return;
    }
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const line: Feature<LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords.map(([lat, lng]) => [lng, lat]) },
    };
    const ends: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { k: 'start' }, geometry: { type: 'Point', coordinates: [coords[0][1], coords[0][0]] } },
        { type: 'Feature', properties: { k: 'end' }, geometry: { type: 'Point', coordinates: [coords[coords.length - 1][1], coords[coords.length - 1][0]] } },
      ],
    };

    map.on('style.load', () => {
      map.addSource('route', { type: 'geojson', data: line });
      map.addSource('route-ends', { type: 'geojson', data: ends });
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ACCENT, 'line-opacity': 0.3, 'line-blur': 5, 'line-width': 10 },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ACCENT, 'line-width': 4 },
      });
      map.addLayer({
        id: 'route-ends-circle',
        type: 'circle',
        source: 'route-ends',
        paint: {
          'circle-radius': 7,
          'circle-color': ['match', ['get', 'k'], 'start', '#FFFFFF', ACCENT],
          'circle-stroke-color': ['match', ['get', 'k'], 'start', ACCENT, '#FFFFFF'],
          'circle-stroke-width': 3,
        },
      });
      map.fitBounds(bounds, { ...FIT, duration: 0 });
    });

    // The card animates in, so the container's real size may arrive after
    // the map does — a zero-size canvas paints nothing.
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(el);

    return () => {
      observer.disconnect();
      try {
        map.remove();
      } catch {
        /* already gone */
      }
    };
  }, [coords]);

  return <div ref={ref} className="w-full rounded-3xl overflow-hidden border border-black/5" style={{ height: HEIGHT }} />;
}
