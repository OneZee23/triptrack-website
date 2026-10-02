import { LAND_RINGS } from './landData';
import { project, type ProjectedPoint } from './projection';

/** The great-circle edge meets the horizon at the normalized z=0 crossing. */
function horizon(a: ProjectedPoint, b: ProjectedPoint): ProjectedPoint {
  const t = a.z / (a.z - b.z);
  const x = a.x + t * (b.x - a.x);
  const y = a.y + t * (b.y - a.y);
  const length = Math.hypot(x, y);
  return { x: x / length, y: y / length, z: 0, visible: true };
}

/**
 * Clip the small geographic cells against the front hemisphere. Each cell
 * spans at most 30 degrees, so its hidden boundary follows the short arc of
 * the horizon instead of cutting a straight chord across the visible Earth.
 */
export function landPath(lat0: number, lon0: number, radius: number, origin: number): string {
  const paths: string[] = [];
  for (const ring of LAND_RINGS) {
    const points = ring.map(([lng, lat]) => project(lat / 10, lng / 10, lat0, lon0));
    const clipped: ProjectedPoint[] = [];
    let previous = points[points.length - 1];
    for (const point of points) {
      if (point.visible !== previous.visible) clipped.push(horizon(previous, point));
      if (point.visible) clipped.push(point);
      previous = point;
    }
    if (clipped.length < 3) continue;

    const xy = (p: ProjectedPoint) => `${(origin + p.x * radius).toFixed(1)} ${(origin + p.y * radius).toFixed(1)}`;
    let d = `M${xy(clipped[0])}`;
    // Include the closing edge: this may be the segment along the horizon.
    for (let i = 1; i <= clipped.length; i++) {
      const a = clipped[i - 1];
      const b = clipped[i % clipped.length];
      if (a.z === 0 && b.z === 0) {
        const sweep = a.x * b.y - a.y * b.x > 0 ? 1 : 0;
        d += `A${radius} ${radius} 0 0 ${sweep} ${xy(b)}`;
      } else {
        d += `L${xy(b)}`;
      }
    }
    paths.push(`${d}Z`);
  }
  return paths.join('');
}
