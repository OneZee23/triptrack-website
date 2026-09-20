// Preview-polyline decoding + projection.
//
// Wire format is the server's `preview_polyline` bytea, base64'd by
// `TripsService.serializeTrip`: flat (lat, lng) pairs, each a 32-bit
// IEEE-754 float, LITTLE-ENDIAN, 8 bytes per point, latitude first, no
// header. Ported one-for-one from the backend's
// `src/modules/public/polyline.util.ts` (which itself mirrors iOS
// `Trip.encodePolyline`) — the three must not drift, so the test fixture
// here is the same round-trip the server spec uses.

export type LatLng = [number, number];

/** Decode base64 preview polyline into [lat, lng] pairs. `null` for
 *  anything that isn't a whole number of points — a truncated buffer is a
 *  bug upstream, and half a route drawn confidently is worse than none. */
export function decodePreviewPolyline(base64: string | null | undefined): LatLng[] | null {
  if (!base64) return null;
  let bytes: Uint8Array;
  try {
    const bin = atob(base64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  } catch {
    return null;
  }
  if (bytes.length < 8 || bytes.length % 8 !== 0) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: LatLng[] = [];
  for (let off = 0; off < bytes.length; off += 8) {
    out.push([view.getFloat32(off, true), view.getFloat32(off + 4, true)]);
  }
  return out;
}

export interface Point {
  x: number;
  y: number;
}

/** Web Mercator, so a card preview has the same shape the map screen will
 *  show. Latitude is clamped: the projection blows up at the poles and a
 *  single corrupt point would otherwise flatten the whole route to a line. */
function mercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

/** Project [lat, lng] pairs into a `width` × `height` box, aspect ratio
 *  preserved and centred, with `padding` points of margin on every side. */
export function projectPoints(
  coords: LatLng[],
  width: number,
  height: number,
  padding = 6,
): Point[] {
  if (coords.length === 0) return [];
  const xs = coords.map(([, lng]) => lng);
  const ys = coords.map(([lat]) => mercatorY(lat));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const boxW = Math.max(1, width - padding * 2);
  const boxH = Math.max(1, height - padding * 2);
  const spanX = maxX - minX;
  const spanY = maxY - Math.min(...ys);
  // A trip that never moved (or a single point) has no span at all: pin it
  // to the middle rather than dividing by zero.
  const scale = spanX === 0 && spanY === 0
    ? 0
    : Math.min(spanX === 0 ? Infinity : boxW / spanX, spanY === 0 ? Infinity : boxH / spanY);
  const drawnW = spanX * scale;
  const drawnH = spanY * scale;
  const offsetX = padding + (boxW - drawnW) / 2;
  const offsetY = padding + (boxH - drawnH) / 2;
  if (scale === 0) {
    return coords.map(() => ({ x: width / 2, y: height / 2 }));
  }
  return coords.map(([lat, lng]) => ({
    x: offsetX + (lng - minX) * scale,
    // SVG y grows downward, Mercator y grows northward.
    y: offsetY + (maxY - mercatorY(lat)) * scale,
  }));
}

/** SVG path data for a projected route. Empty string when there's nothing
 *  to draw, so the caller can render its placeholder instead. */
export function toPathData(points: Point[]): string {
  if (points.length < 2) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}
