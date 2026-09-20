import { describe, it, expect } from 'vitest';
import { decodePreviewPolyline, projectPoints, toPathData, type LatLng } from './polyline';

/** Same encoder the backend spec uses (`polyline.util.spec.ts`), rewritten
 *  without `Buffer` so the fixture is produced by the browser primitives the
 *  decoder actually has to survive. */
function encodeBase64(coords: LatLng[]): string {
  const bytes = new Uint8Array(coords.length * 8);
  const view = new DataView(bytes.buffer);
  coords.forEach(([lat, lng], i) => {
    view.setFloat32(i * 8, lat, true);
    view.setFloat32(i * 8 + 4, lng, true);
  });
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

describe('decodePreviewPolyline', () => {
  it('round-trips lat,lng pairs (little-endian Float32)', () => {
    // Fixture copied from the server spec: Moscow → Sochi.
    const decoded = decodePreviewPolyline(encodeBase64([[55.75, 37.62], [43.6, 39.73]]));
    expect(decoded).not.toBeNull();
    expect(decoded!.length).toBe(2);
    expect(decoded![0][0]).toBeCloseTo(55.75, 3);
    expect(decoded![0][1]).toBeCloseTo(37.62, 3);
    expect(decoded![1][0]).toBeCloseTo(43.6, 3);
    expect(decoded![1][1]).toBeCloseTo(39.73, 3);
  });

  it('returns null for missing, empty or misaligned payloads', () => {
    expect(decodePreviewPolyline(null)).toBeNull();
    expect(decodePreviewPolyline(undefined)).toBeNull();
    expect(decodePreviewPolyline('')).toBeNull();
    expect(decodePreviewPolyline(btoa(''))).toBeNull();
    // 7 bytes: not a whole number of points.
    expect(decodePreviewPolyline(btoa('1234567'))).toBeNull();
  });

  it('returns null rather than throwing on non-base64 input', () => {
    expect(decodePreviewPolyline('*** not base64 ***')).toBeNull();
  });
});

describe('projectPoints', () => {
  const route: LatLng[] = [[55.75, 37.62], [50.0, 38.5], [43.6, 39.73]];

  it('keeps every point inside the padded box', () => {
    const pts = projectPoints(route, 200, 120, 8);
    expect(pts).toHaveLength(3);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(8 - 0.001);
      expect(p.x).toBeLessThanOrEqual(192.001);
      expect(p.y).toBeGreaterThanOrEqual(8 - 0.001);
      expect(p.y).toBeLessThanOrEqual(112.001);
    }
  });

  it('puts north at the top (SVG y is flipped)', () => {
    const pts = projectPoints(route, 200, 120, 8);
    expect(pts[0].y).toBeLessThan(pts[2].y);
  });

  it('pins a zero-span route to the centre instead of dividing by zero', () => {
    const pts = projectPoints([[55.75, 37.62], [55.75, 37.62]], 200, 120, 8);
    for (const p of pts) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(p.x).toBeCloseTo(100, 5);
      expect(p.y).toBeCloseTo(60, 5);
    }
  });

  it('handles an empty route', () => {
    expect(projectPoints([], 200, 120)).toEqual([]);
  });
});

describe('toPathData', () => {
  it('draws nothing for fewer than two points', () => {
    expect(toPathData([])).toBe('');
    expect(toPathData([{ x: 1, y: 2 }])).toBe('');
  });

  it('starts with a move and continues with lines', () => {
    expect(toPathData([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe('M1.0,2.0 L3.0,4.0');
  });
});
