import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPinned, RotateCw } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { FeatureCollection, LineString } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from '../i18n/useTranslation';
import { ACCENT } from './ui';

export type ManualWaypoint = { id: string; name: string; latitude: number; longitude: number };
type Coordinate = [number, number]; // latitude, longitude, like the editor and API
interface Props {
  waypoints: ManualWaypoint[];
  coordinates: Coordinate[];
  routePending: boolean;
  onAdd: (coordinate: Coordinate) => void;
  onMove: (id: string, coordinate: Coordinate) => void;
  focus: { id: string; request: number } | null;
  fitRequest: number;
  initialCenter?: Coordinate;
  disabled: boolean;
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const SOURCE = 'manual-trip-route';
const COPY = {
  en: {
    title: 'Plan your trip on the map', loading: 'Loading map…', error: 'The map is unavailable',
    detail: 'Try loading it again. The points you added are still in the form.', retry: 'Try again',
    point: 'Point', move: 'Move on the map with the arrow keys',
  },
  ru: {
    title: 'Маршрут поездки на карте', loading: 'Загружаем карту…', error: 'Карта пока недоступна',
    detail: 'Попробуй загрузить её снова. Добавленные точки остались в форме.', retry: 'Попробовать снова',
    point: 'Точка', move: 'Перемещайте на карте клавишами со стрелками',
  },
};
type Copy = typeof COPY.en;

function valid([latitude, longitude]: Coordinate) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

function routeData(props: Pick<Props, 'waypoints' | 'coordinates' | 'routePending'>): FeatureCollection<LineString> {
  const points = (props.routePending ? props.waypoints.map((point) => [point.latitude, point.longitude] as Coordinate)
    : props.coordinates).filter(valid);
  return {
    type: 'FeatureCollection', features: points.length < 2 ? [] : [{
      type: 'Feature', properties: { pending: props.routePending },
      geometry: { type: 'LineString', coordinates: points.map(([latitude, longitude]) => [longitude, latitude]) },
    }],
  };
}

function animationDuration() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
}

function cameraPadding() {
  // The editor's instruction card sits above the basemap attribution. Keep
  // route endpoints and focused points in the unobstructed part of the map.
  return { top: 64, left: 64, right: 64, bottom: window.matchMedia('(max-width: 699px)').matches ? 160 : 140 };
}

type Latest = { props: Props; copy: Copy; data: FeatureCollection<LineString> };
interface Runtime {
  map: MapLibreMap;
  ready: boolean;
  markers: Map<string, { marker: Marker; element: HTMLButtonElement; label: HTMLSpanElement }>;
  data: FeatureCollection<LineString> | null;
  fitRequest: number | null;
  focusKey: string | null;
  ignoreClickUntil: number;
}

function updateMap(runtime: Runtime, current: Latest, latest: { current: Latest }) {
  if (!runtime.ready) return;
  const { map } = runtime;
  const { props, copy, data } = current;
  if (runtime.data !== data) {
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(data);
    runtime.data = data;
  }
  map.getCanvas().style.cursor = props.disabled ? 'grab' : 'crosshair';
  const points = props.waypoints.filter((point) => valid([point.latitude, point.longitude]));
  const ids = new Set(points.map((point) => point.id));
  for (const [id, value] of runtime.markers) {
    if (!ids.has(id)) { value.marker.remove(); runtime.markers.delete(id); }
  }
  for (const [index, point] of points.entries()) {
    let value = runtime.markers.get(point.id);
    if (!value) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'flex h-10 w-10 items-center justify-center rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#EB571E] focus-visible:ring-offset-2';
      const label = document.createElement('span');
      label.className = 'flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-[#EB571E] text-xs font-bold text-white shadow-[0_2px_8px_#241e1933]';
      element.appendChild(label);
      const marker = new maplibregl.Marker({ element, draggable: !props.disabled })
        .setLngLat([point.longitude, point.latitude]).addTo(map);
      // A click ending a drag belongs to this point. It must never append a
      // second waypoint under the one the person has just moved.
      element.addEventListener('click', (event) => event.stopPropagation());
      marker.on('dragstart', () => { runtime.ignoreClickUntil = Infinity; });
      marker.on('dragend', () => {
        runtime.ignoreClickUntil = Date.now() + 250;
        const next = marker.getLngLat();
        const coordinate: Coordinate = [next.lat, next.lng];
        if (!latest.current.props.disabled && valid(coordinate)) {
          latest.current.props.onMove(point.id, coordinate);
        } else {
          const saved = latest.current.props.waypoints.find((candidate) => candidate.id === point.id);
          if (saved) marker.setLngLat([saved.longitude, saved.latitude]);
        }
      });
      element.addEventListener('keydown', (event) => {
        if (latest.current.props.disabled) return;
        const step = event.shiftKey ? 20 : 5;
        const delta: Record<string, Coordinate> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (!delta[event.key]) return;
        event.preventDefault(); event.stopPropagation();
        const screen = map.project(marker.getLngLat());
        const offset = delta[event.key];
        const next = map.unproject([screen.x + offset[0], screen.y + offset[1]]);
        const coordinate: Coordinate = [next.lat, next.lng];
        if (!valid(coordinate)) return;
        marker.setLngLat([next.lng, next.lat]);
        latest.current.props.onMove(point.id, coordinate);
      });
      value = { marker, element, label };
      runtime.markers.set(point.id, value);
    }
    value.marker.setLngLat([point.longitude, point.latitude]).setDraggable(!props.disabled);
    value.element.disabled = props.disabled;
    value.element.style.cursor = props.disabled ? 'default' : 'grab';
    value.element.setAttribute('aria-label', `${copy.point} ${index + 1}${point.name ? ` · ${point.name}` : ''}. ${copy.move}`);
    value.element.title = `${copy.point} ${index + 1}${point.name ? ` · ${point.name}` : ''}`;
    value.label.textContent = String(index + 1);
  }

  // The editor requests fitting after search selection or its fit button.
  // Route calculation and marker dragging do not independently move the map.
  if (runtime.fitRequest !== props.fitRequest) {
    const coordinates = data.features[0]?.geometry.coordinates ?? points.map((point) => [point.longitude, point.latitude]);
    if (coordinates.length) {
      const bounds = new maplibregl.LngLatBounds();
      for (const coordinate of coordinates) bounds.extend([coordinate[0], coordinate[1]]);
      map.fitBounds(bounds, { padding: cameraPadding(), maxZoom: 15, duration: runtime.fitRequest === null ? 0 : animationDuration() });
    }
    runtime.fitRequest = props.fitRequest;
  }
  const focused = props.focus && points.find((point) => point.id === props.focus?.id);
  const focusKey = props.focus ? `${props.focus.id}:${props.focus.request}` : null;
  if (focused && focusKey !== runtime.focusKey) {
    const padding = cameraPadding();
    // easeTo padding persists on the camera; fitBounds would add its padding
    // again and can run out of usable height on phones. Offset is transient.
    map.easeTo({ center: [focused.longitude, focused.latitude], zoom: Math.max(map.getZoom(), 12),
      offset: [(padding.left - padding.right) / 2, (padding.top - padding.bottom) / 2], duration: animationDuration() });
  }
  runtime.focusKey = focused ? focusKey : null;
}

/** The map renders an in-memory draft. It only requests the existing basemap
 * tiles; route lookup and saving remain explicit actions owned by the editor. */
export default function ManualTripMap(props: Props) {
  const { lang } = useTranslation();
  const copy = COPY[lang === 'ru' ? 'ru' : 'en'];
  const container = useRef<HTMLDivElement>(null);
  const runtime = useRef<Runtime | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const data = useMemo(() => routeData({ waypoints: props.waypoints, coordinates: props.coordinates, routePending: props.routePending }),
    [props.waypoints, props.coordinates, props.routePending]);
  const latest = useRef<Latest>({ props, copy, data });
  useEffect(() => {
    latest.current = { props, copy, data };
    if (runtime.current) updateMap(runtime.current, latest.current, latest);
  }, [props, copy, data]);

  useEffect(() => {
    if (!container.current) return;
    let active = true;
    let contextLost = false;
    let layerFailure = false;
    const fail = () => { if (active) { clearTimeout(timer); setStatus('error'); } };
    const timer = setTimeout(fail, 20_000);
    let map: MapLibreMap;
    const initial = latest.current.props.initialCenter;
    try {
      map = new maplibregl.Map({
        container: container.current, style: STYLE_URL,
        center: initial && valid(initial) ? [initial[1], initial[0]] : [20, 45], zoom: initial && valid(initial) ? 9 : 3,
        maxZoom: 18, renderWorldCopies: false, attributionControl: { compact: true },
        locale: lang === 'ru' ? {
          'Map.Title': 'Карта маршрута', 'NavigationControl.ZoomIn': 'Приблизить',
          'NavigationControl.ZoomOut': 'Отдалить', 'NavigationControl.ResetBearing': 'Повернуть на север',
          'AttributionControl.ToggleAttribution': 'Источники карты', 'ScaleControl.Meters': 'м', 'ScaleControl.Kilometers': 'км',
        } : undefined,
      });
    } catch {
      queueMicrotask(fail);
      return () => { active = false; clearTimeout(timer); };
    }
    const instance: Runtime = { map, ready: false, markers: new Map(), data: null, fitRequest: null, focusKey: null, ignoreClickUntil: 0 };
    runtime.current = instance;
    const markReady = () => {
      if (active && instance.ready && !contextLost && !layerFailure) { clearTimeout(timer); setStatus('ready'); }
    };
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-right');
    for (const button of container.current.querySelectorAll<HTMLButtonElement>('.maplibregl-ctrl-group button')) {
      button.style.width = '40px'; button.style.height = '40px';
    }
    map.on('error', () => { if (!instance.ready) fail(); });
    map.on('webglcontextlost', () => { contextLost = true; fail(); });
    map.on('webglcontextrestored', () => { contextLost = false; markReady(); });
    map.on('style.load', () => {
      if (!active) return;
      try {
        map.addSource(SOURCE, { type: 'geojson', data: latest.current.data });
        map.addLayer({ id: 'manual-route-outline', source: SOURCE, type: 'line',
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.85 } });
        map.addLayer({ id: 'manual-route-ready', source: SOURCE, type: 'line', filter: ['==', ['get', 'pending'], false],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ACCENT, 'line-width': 4 } });
        map.addLayer({ id: 'manual-route-pending', source: SOURCE, type: 'line', filter: ['==', ['get', 'pending'], true],
          layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ACCENT, 'line-width': 3, 'line-dasharray': [2, 2], 'line-opacity': 0.7 } });
        instance.ready = true;
        updateMap(instance, latest.current, latest);
      } catch { layerFailure = true; fail(); }
    });
    map.on('load', markReady); map.on('idle', markReady);
    map.on('click', (event) => {
      if (!instance.ready || latest.current.props.disabled || Date.now() < instance.ignoreClickUntil) return;
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest('.maplibregl-marker, .maplibregl-control-container')) return;
      const coordinate: Coordinate = [event.lngLat.lat, event.lngLat.lng];
      if (valid(coordinate)) latest.current.props.onAdd(coordinate);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      active = false; clearTimeout(timer); observer.disconnect();
      for (const value of instance.markers.values()) value.marker.remove();
      if (runtime.current === instance) runtime.current = null;
      map.remove();
    };
  }, [attempt, lang]);

  return (
    <div role="region" aria-label={copy.title} style={{ position: 'absolute', inset: 0, minHeight: 380, background: '#EDEAE2' }}>
      <div ref={container} style={{ position: 'absolute', inset: 0 }} />
      {status === 'loading' && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F8F6F1]/85" role="status">
        <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-[#1e1e23]/65 shadow-sm"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{copy.loading}</span>
      </div>}
      {status === 'error' && <div className="absolute inset-0 flex items-center justify-center bg-[#F8F6F1] p-6" role="alert">
        <div className="max-w-xs text-center">
          <MapPinned className="mx-auto mb-3 h-8 w-8 text-[#B97750]" aria-hidden="true" />
          <h3 className="text-lg font-semibold">{copy.error}</h3><p className="mt-2 text-sm leading-relaxed text-[#1e1e23]/60">{copy.detail}</p>
          <button type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }} className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#B9461A] shadow-sm transition-transform active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB571E]">
            <RotateCw className="h-4 w-4" aria-hidden="true" />{copy.retry}
          </button>
        </div>
      </div>}
    </div>
  );
}
