// MapGlobe.tsx
// Interactive 3D globe (MapLibre GL JS v5 globe projection) rendering a real
// tiled vector street map (OpenFreeMap, keyless) with glowing road-trip routes.
// Tofu-Maps style cartography, on a spinning globe, zoomable down to streets.
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, GeoJSONSource, MapMouseEvent, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GlobeTrip } from './types';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

// Keyless OpenFreeMap "Liberty" vector street style (closest no-key match to Mapbox streets-v12).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const BRAND_ORANGE = '#FF6B00';

const ROUTES_SOURCE = 'trip-routes';
const POINTS_SOURCE = 'trip-endpoints';
const ROUTE_GLOW_LAYER = 'trip-route-glow';
const ROUTE_LINE_LAYER = 'trip-route-line';
const ROUTE_FLOW_LAYER = 'trip-route-flow';
const ENDPOINT_PULSE_LAYER = 'trip-endpoints-pulse';
const ENDPOINT_LAYER = 'trip-endpoints-circle';

const SECONDS_PER_REVOLUTION = 160;
const MAX_SPIN_ZOOM = 2.6; // spin only at the far-out globe view; once zoomed in, stop

// Verified ant-path dash sequence (animated flowing dashes along the routes).
const DASH_SEQUENCE: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];

type LineFeature = Feature<LineString, { id: string }>;
type PointFeature = Feature<Point, { id: string; kind: 'start' | 'end' }>;

// our coords are [lat, lng]; GeoJSON needs [lng, lat]
function buildRoutes(trips: GlobeTrip[]): FeatureCollection<LineString, { id: string }> {
  const features: LineFeature[] = trips
    .filter((t) => t.coords.length >= 2)
    .map((t) => ({
      type: 'Feature',
      properties: { id: t.id },
      geometry: { type: 'LineString', coordinates: t.coords.map(([lat, lng]) => [lng, lat]) },
    }));
  return { type: 'FeatureCollection', features };
}

function buildEndpoints(trips: GlobeTrip[]): FeatureCollection<Point, { id: string; kind: 'start' | 'end' }> {
  const features: PointFeature[] = [];
  for (const t of trips) {
    if (t.coords.length < 1) continue;
    const start = t.coords[0];
    const end = t.coords[t.coords.length - 1];
    features.push({ type: 'Feature', properties: { id: t.id, kind: 'start' }, geometry: { type: 'Point', coordinates: [start[1], start[0]] } });
    features.push({ type: 'Feature', properties: { id: t.id, kind: 'end' }, geometry: { type: 'Point', coordinates: [end[1], end[0]] } });
  }
  return { type: 'FeatureCollection', features };
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function MapGlobe({
  trips,
  onSelect,
  onInteracting,
  paused = false,
}: {
  trips: GlobeTrip[];
  onSelect: (t: GlobeTrip) => void;
  onInteracting?: (active: boolean) => void;
  paused?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const layersAddedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const onInteractingRef = useRef(onInteracting);
  const tripsRef = useRef(trips);
  const userInteractingRef = useRef(false);
  const programmaticRef = useRef(false); // true while WE move the camera (fitBounds) — ignore those events
  const didFitRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const dashStepRef = useRef(0);
  const interactionTimerRef = useRef<number | undefined>(undefined);
  const pausedRef = useRef(paused);
  const onscreenRef = useRef(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    onInteractingRef.current = onInteracting;
  }, [onInteracting]);
  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  // frame the camera on the trips so they're actually visible (runs once).
  function fitToTrips(map: MapLibreMap, list: GlobeTrip[]) {
    if (didFitRef.current) return;
    const coords = list.flatMap((t) => t.coords);
    if (!coords.length) return;
    const b = new maplibregl.LngLatBounds();
    for (const [lat, lng] of coords) b.extend([lng, lat]);
    didFitRef.current = true;
    programmaticRef.current = true;
    // frame the trip in the CLEAR right-hand area, not under the left hero text
    const wide = typeof window !== 'undefined' && window.innerWidth >= 768;
    map.fitBounds(b, {
      padding: { top: 90, bottom: 90, right: 60, left: wide ? Math.round(window.innerWidth * 0.5) : 30 },
      maxZoom: 6,
      duration: 0,
    });
    // fit is instant (duration 0); clear the guard on the next frame after the
    // synchronous camera events fire — not a long window that would swallow a
    // real user grab right after load.
    requestAnimationFrame(() => {
      programmaticRef.current = false;
    });
  }

  useEffect(() => {
    if (mapRef.current) return; // StrictMode double-mount guard
    const container = containerRef.current;
    if (!container) return;
    if (!isWebGLAvailable()) {
      setFailed(true);
      return;
    }

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: [10, 25],
        zoom: 1.6,
        minZoom: 0.8,
        maxZoom: 16,
        attributionControl: false,
        cooperativeGestures: true, // avoids hijacking page scroll on the full-screen hero
        dragRotate: true,
        pitchWithRotate: false,
      });
    } catch (err) {
      console.error('[MapGlobe] init failed', err);
      setFailed(true);
      return;
    }
    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('error', (e) => {
      if (import.meta.env.DEV) console.warn('[MapGlobe] maplibre error', (e as { error?: unknown })?.error ?? e);
    });

    // Pause auto-spin + smart-hide the hero text while the user interacts. We only
    // listen to USER-input events (mouse/touch/drag/zoom), NOT our own programmatic
    // camera moves (guarded by programmaticRef) and NOT move events (our setCenter
    // spin fires those and would falsely pause itself).
    const onInteractStart = () => {
      if (programmaticRef.current) return;
      userInteractingRef.current = true;
      onInteractingRef.current?.(true);
      if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
    };
    const onInteractEnd = () => {
      if (programmaticRef.current) return;
      if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = window.setTimeout(() => {
        userInteractingRef.current = false;
        onInteractingRef.current?.(false);
      }, 1500);
    };
    map.on('mousedown', onInteractStart);
    map.on('touchstart', onInteractStart);
    map.on('dragstart', onInteractStart);
    map.on('zoomstart', onInteractStart);
    map.on('wheel', () => {
      onInteractStart();
      onInteractEnd();
    });
    map.on('mouseup', onInteractEnd);
    map.on('touchend', onInteractEnd);
    map.on('dragend', onInteractEnd);
    map.on('zoomend', onInteractEnd);

    // Single rAF loop: spin (setCenter — a jump, not easeTo, so no run() re-entry),
    // animated route dashes, and pulsing endpoint beacons.
    const spin = !prefersReducedMotion();
    const startAnim = () => {
      if (rafRef.current != null) return;
      let last = 0;
      const frame = (ts: number) => {
        const m = mapRef.current;
        // stop the loop entirely when unmounted or scrolled offscreen (battery)
        if (!m || !onscreenRef.current) {
          rafRef.current = null;
          return;
        }
        if (last === 0) last = ts;
        const dt = ts - last;
        last = ts;

        const active = !pausedRef.current; // paused while a trip card is open
        if (active && !userInteractingRef.current && m.getZoom() < MAX_SPIN_ZOOM) {
          const c = m.getCenter();
          c.lng -= (360 / SECONDS_PER_REVOLUTION) * (dt / 1000);
          m.setCenter(c);
        }
        // dash flow + pulse animate ALWAYS (even while a card is open / spin paused) —
        // `paused` only freezes the camera spin, not the route's visual life.
        if (m.getLayer(ROUTE_FLOW_LAYER)) {
          const step = Math.floor((ts / 60) % DASH_SEQUENCE.length);
          if (step !== dashStepRef.current) {
            m.setPaintProperty(ROUTE_FLOW_LAYER, 'line-dasharray', DASH_SEQUENCE[step]);
            dashStepRef.current = step;
          }
        }
        if (m.getLayer(ENDPOINT_PULSE_LAYER)) {
          const p = (Math.sin(ts / 700) + 1) / 2; // 0..1
          m.setPaintProperty(ENDPOINT_PULSE_LAYER, 'circle-radius', 7 + p * 16);
          m.setPaintProperty(ENDPOINT_PULSE_LAYER, 'circle-opacity', 0.4 * (1 - p));
        }

        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    };

    map.on('style.load', () => {
      if (mapRef.current !== map) return; // map was removed (StrictMode) before style finished loading
      map.setProjection({ type: 'globe' });
      try {
        map.setSky({
          'sky-color': '#0a0f1e',
          'sky-horizon-blend': 0.6,
          'horizon-color': '#1b2a4a',
          'horizon-fog-blend': 0.6,
          'fog-color': '#0a0f1e',
          'fog-ground-blend': 0.2,
          'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 0.6, 8, 0],
        });
      } catch (e) {
        console.warn('[MapGlobe] setSky failed', e);
      }
      // Hide country borders + country labels (keep cities). Avoids disputed-border
      // geopolitics for CIS users.
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
      addTripLayers(map);
      setData(map, tripsRef.current);
      fitToTrips(map, tripsRef.current);
      if (spin) startAnim();
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    // pause the whole rAF loop when the hero scrolls out of view
    const io = new IntersectionObserver(
      ([e]) => {
        onscreenRef.current = e.isIntersecting;
        if (e.isIntersecting && spin) startAnim();
      },
      { threshold: 0.01 },
    );
    io.observe(container);

    return () => {
      ro.disconnect();
      io.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
      layersAddedRef.current = false;
      didFitRef.current = false;
      try {
        map.remove();
      } catch {
        /* already removed */
      }
      mapRef.current = null;
    };
  }, []);

  function addTripLayers(map: MapLibreMap) {
    if (map.getSource(ROUTES_SOURCE)) return;
    map.addSource(ROUTES_SOURCE, { type: 'geojson', data: buildRoutes(tripsRef.current) });
    map.addSource(POINTS_SOURCE, { type: 'geojson', data: buildEndpoints(tripsRef.current) });

    map.addLayer({
      id: ROUTE_GLOW_LAYER,
      type: 'line',
      source: ROUTES_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': BRAND_ORANGE,
        'line-opacity': 0.55,
        'line-blur': 6,
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 9, 6, 20, 12, 34],
      },
    });
    map.addLayer({
      id: ROUTE_LINE_LAYER,
      type: 'line',
      source: ROUTES_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': BRAND_ORANGE,
        'line-opacity': 1,
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 3.5, 6, 6, 12, 9],
      },
    });
    map.addLayer({
      id: ROUTE_FLOW_LAYER,
      type: 'line',
      source: ROUTES_SOURCE,
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#FFF2DD',
        'line-opacity': 0.95,
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2, 6, 4, 12, 6],
        'line-dasharray': DASH_SEQUENCE[0],
      },
    });
    // pulsing beacon under each endpoint (animated radius/opacity in the rAF loop)
    map.addLayer({
      id: ENDPOINT_PULSE_LAYER,
      type: 'circle',
      source: POINTS_SOURCE,
      paint: {
        'circle-radius': 10,
        'circle-color': BRAND_ORANGE,
        'circle-opacity': 0.3,
        'circle-blur': 0.5,
      },
    });
    map.addLayer({
      id: ENDPOINT_LAYER,
      type: 'circle',
      source: POINTS_SOURCE,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5, 6, 7.5, 12, 10],
        'circle-color': ['match', ['get', 'kind'], 'start', '#FFFFFF', 'end', BRAND_ORANGE, '#FFFFFF'],
        'circle-stroke-color': BRAND_ORANGE,
        'circle-stroke-width': 2,
        'circle-opacity': 1,
      },
    });

    layersAddedRef.current = true;

    const handleClick = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (!id) return;
      const trip = tripsRef.current.find((t) => t.id === id);
      if (trip) onSelectRef.current(trip);
    };
    for (const layer of [ROUTE_LINE_LAYER, ROUTE_GLOW_LAYER, ENDPOINT_LAYER]) {
      map.on('click', layer, handleClick);
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }

  function setData(map: MapLibreMap, list: GlobeTrip[]) {
    (map.getSource(ROUTES_SOURCE) as GeoJSONSource | undefined)?.setData(buildRoutes(list));
    (map.getSource(POINTS_SOURCE) as GeoJSONSource | undefined)?.setData(buildEndpoints(list));
  }

  useEffect(() => {
    const map = mapRef.current;
    // Act once the source/layers exist (layersAddedRef). If they don't yet, the
    // style.load handler applies the latest tripsRef when it adds them. Do NOT
    // gate on isStyleLoaded() — it returns false transiently after layers are
    // added (during tile loads), which on a cached reload skipped setData+fit
    // forever, leaving the route source empty.
    if (!map || !layersAddedRef.current) return;
    setData(map, trips);
    fitToTrips(map, trips);
  }, [trips]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label="Interactive map unavailable"
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 40%, #1b2a4a 0%, #0a0f1e 70%)',
          color: '#cbd5e1',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
          <div>Map couldn’t load in this browser.</div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 320, background: '#0a0f1e' }} />;
}
