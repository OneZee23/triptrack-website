import type { Coordinate } from './manualApi';
import { validCoordinate } from './tripExplorer';

export function routeDistance(points: Coordinate[]): number {
  let distance = 0;
  const rad = Math.PI / 180;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = points[i - 1], [c, d] = points[i];
    if (!validCoordinate(a, b) || !validCoordinate(c, d)) return 0;
    const v = Math.sin((c - a) * rad / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2;
    distance += 6_371_000 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)));
  }
  return distance;
}

export function localDateTime(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Matches server/iOS bounds. The server repeats these checks at save time. */
export function manualValidation(input: { title: string; start: string; minutes: number; coordinates: Coordinate[] }, now = Date.now()): string | null {
  if (!input.title.trim() || input.title.trim().length > 200) return 'title_error';
  if (input.coordinates.length < 2 || input.coordinates.length > 10_000 || input.coordinates.some(([lat, lng]) => !validCoordinate(lat, lng)) || routeDistance(input.coordinates) < 10) return 'route_error';
  const start = new Date(input.start).getTime();
  if (!Number.isFinite(start) || start < now - 20 * 365 * 86_400_000 || start > now) return 'date_error';
  const seconds = input.minutes * 60;
  if (!Number.isInteger(seconds) || seconds < 60 || seconds > 7 * 86_400) return 'duration_error';
  if (start + seconds * 1000 > now) return 'end_error';
  if (routeDistance(input.coordinates) / seconds > 50) return 'speed_error';
  return null;
}

/** Explicit coordinate entry also works without a search provider. */
export function parseCoordinate(text: string): Coordinate | null {
  const match = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]), lng = Number(match[2]);
  return validCoordinate(lat, lng) ? [lat, lng] : null;
}
