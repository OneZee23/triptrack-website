import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPinned, RotateCw } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from '../i18n/useTranslation';
import { ACCENT } from './ui';

type Coordinate = [number, number]; // The API and its decoded polylines use latitude, longitude.
type Route = { id: string; coords: Coordinate[] };
type Checkpoint = {
  id: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceFromStart: number;
  elapsedFromStart: number;
  timestamp: string;
};

interface Props {
  routes: Route[];
  selectedId: string | null;
  selectedCoords: Coordinate[] | null;
  checkpoints: Checkpoint[];
  focusedCheckpointId: string | null;
  onSelect: (id: string) => void;
  fitRequest: number;
  /** Standalone trip detail has no overlaid card and uses uniform padding. */
  padding?: number;
  cooperativeGestures?: boolean;
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const SOURCE = 'personal-trips';
const HIT_LAYER = 'personal-trip-hit';
const COPY = {
  en: {
    title: 'Your trips on the map', loading: 'Loading map…', error: 'The map is unavailable',
    detail: 'We couldn’t load the map. Your trips are still available in the list.', retry: 'Try again',
    start: 'Start', end: 'Finish', checkpoint: 'Checkpoint',
  },
  ru: {
    title: 'Твои поездки на карте', loading: 'Загружаем карту…', error: 'Карта пока недоступна',
    detail: 'Не удалось загрузить карту. Твои поездки по-прежнему доступны в списке.', retry: 'Попробовать снова',
    start: 'Старт', end: 'Финиш', checkpoint: 'Отметка',
  },
};
type Copy = typeof COPY.en;

function validCoordinate(value: Coordinate): boolean {
  return Number.isFinite(value[0]) && Number.isFinite(value[1])
    && Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180;
}

function line(id: string, coords: Coordinate[], selected: boolean): Feature<LineString> {
  return {
    type: 'Feature', properties: { id, selected },
    geometry: { type: 'LineString', coordinates: coords.map(([lat, lng]) => [lng, lat]) },
  };
}

function sceneFor(routes: Route[], selectedId: string | null, detail: Coordinate[] | null, checkpoints: Checkpoint[], padding?: number) {
  const cleanRoutes = routes.map((route) => ({ ...route, coords: route.coords.filter(validCoordinate) }));
  const selected = selectedId
    ? (detail ?? cleanRoutes.find((route) => route.id === selectedId)?.coords ?? []).filter(validCoordinate) : [];
  const features = cleanRoutes
    .filter((route) => route.id !== selectedId && route.coords.length >= 2)
    .map((route) => line(route.id, route.coords, false));
  if (selectedId && selected.length >= 2) features.push(line(selectedId, selected, true));

  const fitCoordinates = selectedId ? selected : cleanRoutes.flatMap((route) => route.coords);
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
  for (const [lat, lng] of fitCoordinates) {
    west = Math.min(west, lng); east = Math.max(east, lng);
    south = Math.min(south, lat); north = Math.max(north, lat);
  }
  const bounds: [[number, number], [number, number]] | null = fitCoordinates.length
    ? [[west, south], [east, north]] : null;
  // Identity + geometry, rather than array identity: unrelated React renders
  // must not pull the camera away from the part of a trip someone is exploring.
  const fitKey = JSON.stringify([selectedId ?? cleanRoutes.map((route) => route.id), bounds, padding]);
  const visibleCheckpoints = checkpoints.flatMap((checkpoint, index) => {
    const { latitude, longitude } = checkpoint;
    return latitude !== null && longitude !== null && validCoordinate([latitude, longitude])
      ? [{ ...checkpoint, coordinate: [latitude, longitude] as Coordinate, number: index + 1 }] : [];
  });
  return {
    data: { type: 'FeatureCollection', features } as FeatureCollection<LineString>,
    selected, hasSelection: selectedId !== null, padding,
    visibleCheckpoints: selectedId ? visibleCheckpoints : [], bounds, fitKey,
    markerKey: JSON.stringify([selectedId, selected[0], selected.at(-1), visibleCheckpoints]),
  };
}

type Scene = ReturnType<typeof sceneFor>;
interface Runtime {
  map: MapLibreMap;
  ready: boolean;
  markers: Marker[];
  markerKey: string | null;
  fitKey: string | null;
  fitRequest: number | null;
  focusKey: string | null;
  data: Scene['data'] | null;
}

function duration() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420; }

function cameraPadding(map: MapLibreMap, selected: boolean) {
  const element = map.getContainer();
  const height = element.clientHeight || element.getBoundingClientRect().height || 600;
  const width = element.clientWidth || element.getBoundingClientRect().width || 1000;
  const mobile = width < 700;
  // The selected-trip card belongs to TripsPage and occupies up to 48 % of
  // the map, 36 px (64 px on mobile, above attribution) from its bottom. Frame the trip in the remaining
  // space, including when a checkpoint is focused from that card.
  return {
    top: Math.min(80, height * 0.2), left: 45, right: 55,
    bottom: Math.min(selected ? Math.round(height * 0.48) + (mobile ? 68 : 40) : (mobile ? 60 : 100), Math.max(0, height - 160)),
  };
}

function cameraOffset(padding: number | ReturnType<typeof cameraPadding>): [number, number] {
  // easeTo padding persists and is counted again by the next fitBounds.
  // A screen offset centers the point above the card without that side effect.
  return typeof padding === 'number' ? [0, 0] : [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2];
}

function updateMap(runtime: Runtime, scene: Scene, fitRequest: number, focusedId: string | null, copy: Copy) {
  if (!runtime.ready) return;
  const { map } = runtime;
  if (runtime.data !== scene.data) {
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(scene.data);
    runtime.data = scene.data;
  }
  if (runtime.fitKey !== scene.fitKey || runtime.fitRequest !== fitRequest) {
    const initial = runtime.fitKey === null;
    const padding = scene.padding ?? cameraPadding(map, scene.hasSelection);
    if (scene.bounds) {
      map.fitBounds(scene.bounds, { padding, maxZoom: 15, duration: initial ? 0 : duration() });
    } else {
      map.easeTo({ center: [20, 45], zoom: 2, offset: cameraOffset(padding), duration: initial ? 0 : duration() });
    }
    runtime.fitKey = scene.fitKey;
    runtime.fitRequest = fitRequest;
  }

  if (runtime.markerKey !== scene.markerKey) {
    for (const marker of runtime.markers) marker.remove();
    runtime.markers = [];
    const addMarker = (coordinate: Coordinate, label: string, text: string, endpoint: boolean) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'flex h-10 w-10 items-center justify-center rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#EB571E] focus-visible:ring-offset-2';
      element.setAttribute('aria-label', label);
      element.title = label;
      const dot = document.createElement('span');
      dot.className = 'flex items-center justify-center rounded-full border-[3px] border-white font-bold shadow-[0_2px_8px_#241e1926]';
      dot.style.width = endpoint ? '20px' : '30px';
      dot.style.height = endpoint ? '20px' : '30px';
      dot.style.backgroundColor = endpoint && text === 'start' ? '#fff' : ACCENT;
      dot.style.color = '#fff';
      dot.style.fontSize = '12px';
      if (endpoint && text === 'start') dot.style.borderColor = ACCENT;
      if (!endpoint) dot.textContent = text;
      element.appendChild(dot);
      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setText(label);
      const marker = new maplibregl.Marker({ element })
        .setLngLat([coordinate[1], coordinate[0]]).setPopup(popup).addTo(map);
      // MapLibre owns pointer interaction; native buttons also expose the same
      // marker and its plain-text label to keyboard users.
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); marker.togglePopup();
        }
      });
      runtime.markers.push(marker);
    };
    if (scene.selected.length) {
      addMarker(scene.selected[0], copy.start, 'start', true);
      addMarker(scene.selected[scene.selected.length - 1], copy.end, 'end', true);
    }
    for (const point of scene.visibleCheckpoints) {
      addMarker(point.coordinate, `${copy.checkpoint} ${point.number}${point.name ? ` · ${point.name}` : ''}`, String(point.number), false);
    }
    runtime.markerKey = scene.markerKey;
  }

  const focused = scene.visibleCheckpoints.find((point) => point.id === focusedId);
  const focusKey = focused ? JSON.stringify([focused.id, focused.coordinate]) : null;
  if (focused && focusKey !== runtime.focusKey) {
    map.easeTo({ center: [focused.coordinate[1], focused.coordinate[0]], zoom: Math.max(14, map.getZoom()),
      offset: cameraOffset(scene.padding ?? cameraPadding(map, scene.hasSelection)), duration: duration() });
  }
  runtime.focusKey = focusKey;
}

/** Personal GeoJSON stays in this tab and is passed directly to MapLibre's
 * worker. Only the basemap viewport is requested from the existing tile host;
 * no route IDs, coordinates, names or access tokens are added to its URLs. */
export default function TripsMap(props: Props) {
  const { lang } = useTranslation();
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const cooperativeGestures = props.cooperativeGestures ?? false;
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const scene = useMemo(() => sceneFor(props.routes, props.selectedId, props.selectedCoords, props.checkpoints, props.padding),
    [props.routes, props.selectedId, props.selectedCoords, props.checkpoints, props.padding]);
  const latest = useRef({ props, copy, scene });

  useEffect(() => {
    latest.current = { props, copy, scene };
    if (runtime.current) updateMap(runtime.current, scene, props.fitRequest, props.focusedCheckpointId, copy);
  }, [props, copy, scene]);

  useEffect(() => {
    if (!container.current) return;
    let active = true;
    let map: MapLibreMap;
    const fail = () => { if (active) { clearTimeout(timer); setStatus('error'); } };
    const timer = setTimeout(fail, 20_000);
    try {
      map = new maplibregl.Map({
        container: container.current, style: STYLE_URL, center: [20, 45], zoom: 2,
        attributionControl: { compact: true }, maxZoom: 18, cooperativeGestures,
        locale: lang === 'ru' ? {
          'Map.Title': 'Карта поездок', 'NavigationControl.ZoomIn': 'Приблизить',
          'NavigationControl.ZoomOut': 'Отдалить', 'NavigationControl.ResetBearing': 'Повернуть на север',
          'FullscreenControl.Enter': 'На весь экран', 'FullscreenControl.Exit': 'Выйти из полноэкранного режима',
          'AttributionControl.ToggleAttribution': 'Источники карты',
          'ScaleControl.Meters': 'м', 'ScaleControl.Kilometers': 'км',
        } : undefined,
      });
    } catch {
      // Defer the constructor error like MapLibre's other async failures.
      queueMicrotask(fail);
      return () => { active = false; clearTimeout(timer); };
    }
    const instance: Runtime = { map, ready: false, markers: [], markerKey: null, fitKey: null, fitRequest: null, focusKey: null, data: null };
    let contextLost = false;
    let layerFailure = false;
    const markReady = () => {
      if (active && instance.ready && !contextLost && !layerFailure) {
        clearTimeout(timer);
        setStatus('ready');
      }
    };
    runtime.current = instance;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-right');
    for (const group of container.current.querySelectorAll<HTMLElement>('.maplibregl-ctrl-group')) {
      group.style.borderRadius = '12px';
      group.style.overflow = 'hidden';
      for (const button of group.querySelectorAll<HTMLButtonElement>('button')) {
        button.style.width = '40px';
        button.style.height = '40px';
      }
    }
    map.on('error', () => {
      // A failed initial style is fatal. A missing tile or glyph on an
      // already usable map is not: keep the routes visible while MapLibre
      // continues loading the rest of the viewport.
      if (!instance.ready) fail();
    });
    map.on('webglcontextlost', () => { contextLost = true; fail(); });
    map.on('webglcontextrestored', () => { contextLost = false; markReady(); });
    map.on('style.load', () => {
      if (!active) return;
      try {
        map.addSource(SOURCE, { type: 'geojson', data: latest.current.scene.data });
        map.addLayer({
          id: 'personal-trips-overview', type: 'line', source: SOURCE,
          filter: ['==', ['get', 'selected'], false],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#B97750', 'line-width': 3, 'line-opacity': 0.55 },
        });
        map.addLayer({
          id: 'personal-trip-outline', type: 'line', source: SOURCE,
          filter: ['==', ['get', 'selected'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.85 },
        });
        map.addLayer({
          id: 'personal-trip-selected', type: 'line', source: SOURCE,
          filter: ['==', ['get', 'selected'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': ACCENT, 'line-width': 4 },
        });
        map.addLayer({
          id: HIT_LAYER, type: 'line', source: SOURCE,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': ACCENT, 'line-width': 18, 'line-opacity': 0 },
        });
        instance.ready = true;
        const current = latest.current;
        updateMap(instance, current.scene, current.props.fitRequest, current.props.focusedCheckpointId, current.copy);
      } catch { layerFailure = true; fail(); }
    });
    map.on('load', markReady);
    map.on('idle', markReady);
    map.on('click', HIT_LAYER, (event) => {
      const id = event.features?.[0]?.properties?.id;
      if (typeof id === 'string') latest.current.props.onSelect(id);
    });
    map.on('mouseenter', HIT_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', HIT_LAYER, () => { map.getCanvas().style.cursor = ''; });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      active = false;
      clearTimeout(timer);
      observer.disconnect();
      for (const marker of instance.markers) marker.remove();
      if (runtime.current === instance) runtime.current = null;
      map.remove();
    };
  }, [attempt, lang, cooperativeGestures]);

  return (
    <div className="absolute inset-0 bg-[#EDEAE2]" role="region" aria-label={copy.title}>
      {/* MapLibre's unlayered CSS sets position: relative and outranks Tailwind's
          layered utilities. Keep geometry inline so the real canvas fills the
          panel rather than collapsing to a zero-height, clipped map. */}
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F8F6F1]/85" role="status">
          <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#1e1e23]/65 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{copy.loading}
          </span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F8F6F1] p-6" role="alert">
          <div className="max-w-xs text-center">
            <MapPinned className="mx-auto mb-4 h-9 w-9 text-[#B97750]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-lg font-semibold text-[#1e1e23]">{copy.error}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#1e1e23]/60">{copy.detail}</p>
            <button type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }}
              className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#B9461A] shadow-sm transition-transform active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB571E]">
              <RotateCw className="h-4 w-4" aria-hidden="true" />{copy.retry}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
