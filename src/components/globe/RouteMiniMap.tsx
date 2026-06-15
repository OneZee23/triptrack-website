// RouteMiniMap.tsx — a small, static MapLibre map showing a single trip's route
// (real street map background instead of an empty panel), used in the trip card.
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { GlobeTrip } from './types';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const BRAND_ORANGE = '#FF6B00';
const FIT = { padding: 26, maxZoom: 11 } as const;

export function RouteMiniMap({ trip }: { trip: GlobeTrip }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (mapRef.current) return; // re-created on trip change via cleanup
    const el = ref.current;
    const coords = trip.coords;
    if (!el || coords.length < 2) return;

    const bounds = new maplibregl.LngLatBounds();
    for (const [la, ln] of coords) bounds.extend([ln, la]);

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: el,
        style: STYLE_URL,
        interactive: false,
        attributionControl: false,
        bounds, // initialise already framed on the route
        fitBoundsOptions: FIT,
      });
    } catch {
      return;
    }
    mapRef.current = map;

    const refit = () => map.fitBounds(bounds, { ...FIT, duration: 0 });

    map.on('style.load', () => {
      for (const layer of map.getStyle().layers ?? []) {
        const id = layer.id.toLowerCase();
        if (id.includes('boundary') || id.includes('admin') || id.includes('country')) {
          try {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
          } catch {
            /* ignore */
          }
        }
      }

      const line: Feature<LineString> = {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords.map(([la, ln]) => [ln, la]) },
      };
      const ends: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { k: 'start' }, geometry: { type: 'Point', coordinates: [coords[0][1], coords[0][0]] } },
          { type: 'Feature', properties: { k: 'end' }, geometry: { type: 'Point', coordinates: [coords[coords.length - 1][1], coords[coords.length - 1][0]] } },
        ],
      };

      map.addSource('mini-route', { type: 'geojson', data: line });
      map.addSource('mini-ends', { type: 'geojson', data: ends });
      map.addLayer({
        id: 'mini-glow',
        type: 'line',
        source: 'mini-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': BRAND_ORANGE, 'line-opacity': 0.35, 'line-blur': 4, 'line-width': 8 },
      });
      map.addLayer({
        id: 'mini-line',
        type: 'line',
        source: 'mini-route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': BRAND_ORANGE, 'line-width': 3 },
      });
      map.addLayer({
        id: 'mini-ends-c',
        type: 'circle',
        source: 'mini-ends',
        paint: {
          'circle-radius': 5,
          'circle-color': ['match', ['get', 'k'], 'start', '#FFFFFF', 'end', BRAND_ORANGE, '#FFFFFF'],
          'circle-stroke-color': BRAND_ORANGE,
          'circle-stroke-width': 2,
        },
      });
      refit();
    });

    // The card animates in (translateY); the container's real size may not be ready
    // at creation, so resize + refit whenever it changes. This is what makes tiles
    // actually render (a 0-size canvas paints nothing).
    const ro = new ResizeObserver(() => {
      map.resize();
      if (map.isStyleLoaded()) refit();
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      try {
        map.remove();
      } catch {
        /* already removed */
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  // explicit pixel height (inline style, not Tailwind/aspect-ratio) so the map
  // container can never collapse to 0 height inside the animated card.
  return <div ref={ref} style={{ width: '100%', height: 150 }} />;
}
