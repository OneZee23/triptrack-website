import type { TripDetail, TripSummary } from './api';
import { decodePreviewPolyline, type LatLng } from './polyline';

export interface TripFilters { query: string; from: string; to: string }

export function validCoordinate(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number'
    && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Reject a corrupt geometry as a whole: dropping a point could invent a road
// between the two sides of the gap. The trip remains accessible in the list.
export function previewRoutes(trip: TripSummary): LatLng[][] {
  const coords = decodePreviewPolyline(trip.previewPolyline);
  if (!coords || coords.length < 2 || !coords.every(([lat, lng]) => validCoordinate(lat, lng))) return [];
  const boundaries = [...new Set(trip.previewBreaks ?? [])]
    .filter((index) => Number.isInteger(index) && index > 0 && index < coords.length)
    .sort((a, b) => a - b);
  const routes: LatLng[][] = [];
  let start = 0;
  for (const end of [...boundaries, coords.length]) {
    const route = coords.slice(start, end);
    if (route.length >= 2) routes.push(route);
    start = end;
  }
  return routes;
}

export function detailRoutes(trip: TripDetail): LatLng[][] {
  const points = trip.trackPoints;
  if (points && points.length > 1 && points.every((p) => validCoordinate(p.latitude, p.longitude))) {
    const ranges = (trip.hiddenRanges ?? []).flatMap(({ from, to }) => {
      const start = Date.parse(from);
      const end = Date.parse(to);
      return Number.isFinite(start) && Number.isFinite(end) ? [[start, end] as const] : [];
    });
    const routes: LatLng[][] = [];
    let start = 0;
    for (let index = 1; index < points.length; index++) {
      const previousTime = Date.parse(points[index - 1].timestamp);
      const nextTime = Date.parse(points[index].timestamp);
      if (Number.isFinite(previousTime) && Number.isFinite(nextTime)
        && ranges.some(([from, to]) => from <= nextTime && to >= previousTime)) {
        const route = points.slice(start, index).map((point) => [point.latitude, point.longitude] as LatLng);
        if (route.length >= 2) routes.push(route);
        start = index;
      }
    }
    const route = points.slice(start).map((point) => [point.latitude, point.longitude] as LatLng);
    if (route.length >= 2) routes.push(route);
    if (routes.length) return routes;
  }
  return previewRoutes(trip);
}

function localDay(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function filterTrips(trips: TripSummary[], { query, from, to }: TripFilters): TripSummary[] {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return trips.filter((trip) => {
    const text = `${trip.title ?? ''} ${trip.region ?? ''}`.toLocaleLowerCase();
    const day = localDay(trip.startDate);
    return words.every((word) => text.includes(word))
      && (!from || (!!day && day >= from))
      && (!to || (!!day && day <= to));
  });
}

export function mergeTrips(current: TripSummary[], incoming: TripSummary[]): TripSummary[] {
  const byId = new Map(current.map((trip) => [trip.id, trip]));
  for (const trip of incoming) byId.set(trip.id, trip);
  return [...byId.values()].sort((a, b) => b.startDate.localeCompare(a.startDate) || a.id.localeCompare(b.id));
}
