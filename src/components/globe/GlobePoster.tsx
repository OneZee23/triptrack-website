import { useMemo } from 'react';
import type { GlobeTrip } from './types';

/**
 * The globe, drawn as SVG from the trip data the page already has.
 *
 * MapLibre is 1 MB of JavaScript and roughly 4 MB of tiles, and on a phone it
 * is the whole cost of the page: the measured mobile load was 4.7 MB and
 * ~2.1 s of blocked main thread, essentially all of it here. So the phone gets
 * this instead, and the map arrives only if it is asked for.
 *
 * What it draws is not a placeholder pattern — it is the same routes, in an
 * orthographic projection, over a shaded sphere. No request is made for it:
 * `/api/globe` was already fetched for the map, the geometry is the trips'
 * own coordinates, and there is no basemap (hence no tiles, and no map
 * attribution to carry). Empty data still gives a globe, just an empty one.
 */

type Vec = { x: number; y: number; visible: boolean };

const RAD = Math.PI / 180;

/** Orthographic projection onto a unit circle centred at (0, 0), y down. */
function project(lat: number, lng: number, lat0: number, lon0: number): Vec {
  const phi = lat * RAD;
  const lam = (lng - lon0) * RAD;
  const p0 = lat0 * RAD;
  const cosc = Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(lam);
  return {
    x: Math.cos(phi) * Math.sin(lam),
    y: -(Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(lam)),
    visible: cosc >= 0,
  };
}

/** Where to point the camera: the middle of the trips, or Europe if there are none. */
function centreOf(trips: GlobeTrip[]): { lat0: number; lon0: number } {
  let x = 0;
  let y = 0;
  let z = 0;
  let n = 0;
  for (const trip of trips) {
    for (const [lat, lng] of trip.coords) {
      const phi = lat * RAD;
      const lam = lng * RAD;
      x += Math.cos(phi) * Math.cos(lam);
      y += Math.cos(phi) * Math.sin(lam);
      z += Math.sin(phi);
      n++;
    }
  }
  if (!n) return { lat0: 30, lon0: 20 };
  const hyp = Math.hypot(x / n, y / n);
  return { lat0: Math.atan2(z / n, hyp) / RAD, lon0: Math.atan2(y / n, x / n) / RAD };
}

/** Projection → SVG user units. `radius` already carries the zoom. */
type Frame = { lat0: number; lon0: number; radius: number };

/**
 * One polyline → SVG path data, cut wherever it crosses behind the limb.
 * A line that wrapped around the back of the sphere would otherwise be drawn
 * straight across the face of it.
 */
function pathFrom(points: [number, number][], f: Frame): string {
  const out: string[] = [];
  let open = false;
  let last: Vec | null = null;
  for (const [lat, lng] of points) {
    const p = project(lat, lng, f.lat0, f.lon0);
    if (!p.visible) {
      open = false;
      last = null;
      continue;
    }
    // Skip a point that lands on top of the previous one — a trip is thousands
    // of fixes and at this size most of them are the same pixel.
    if (last && Math.abs(p.x - last.x) * f.radius < 0.6 && Math.abs(p.y - last.y) * f.radius < 0.6) continue;
    out.push(`${open ? 'L' : 'M'}${(R + p.x * f.radius).toFixed(1)} ${(R + p.y * f.radius).toFixed(1)}`);
    open = true;
    last = p;
  }
  return out.join('');
}

/** Meridians and parallels — what makes the disc read as a globe rather than a disc. */
function graticule(f: Frame, step: number): string[] {
  const lines: string[] = [];
  const fine = Math.min(step, 4);
  for (let lng = -180; lng < 180; lng += step) {
    const pts: [number, number][] = [];
    for (let lat = -84; lat <= 84; lat += fine) pts.push([lat, lng]);
    const d = pathFrom(pts, f);
    if (d) lines.push(d);
  }
  for (let lat = -60 - (60 % step); lat <= 60; lat += step) {
    if (Math.abs(lat) > 75) continue;
    const pts: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += fine) pts.push([lat, lng]);
    const d = pathFrom(pts, f);
    if (d) lines.push(d);
  }
  return lines;
}

const SIZE = 600;
const R = SIZE / 2;
/** The whole planet sits slightly inside its box so the atmosphere has room. */
const SCALE = 0.86;

export function GlobePoster({ trips, className = '' }: { trips: GlobeTrip[]; className?: string }) {
  const { grid, routes, dots, radius } = useMemo(() => {
    const { lat0, lon0 } = centreOf(trips);
    // A cap, not a budget: the globe endpoint returns a few dozen trips, and
    // 80 paths of a hundred points each is still a frame's worth of work.
    const shown = trips.filter((trip) => trip.coords.length >= 2).slice(0, 80);
    // The whole planet, always. Zooming to frame the routes was tried and
    // thrown away: it crops the limb, and the silhouette of a planet is the
    // one thing this drawing has going for it. `centreOf` already turns the
    // globe so the routes are in the middle, which is where the eye lands.
    const f: Frame = { lat0, lon0, radius: R * SCALE };
    const drawn = shown.map((trip) => pathFrom(trip.coords, f)).filter(Boolean);
    const ends: { x: number; y: number; end: boolean }[] = [];
    for (const trip of shown) {
      const pair: [[number, number], boolean][] = [
        [trip.coords[0], false],
        [trip.coords[trip.coords.length - 1], true],
      ];
      for (const [point, end] of pair) {
        const p = project(point[0], point[1], lat0, lon0);
        if (!p.visible) continue;
        ends.push({ x: R + p.x * f.radius, y: R + p.y * f.radius, end });
      }
    }
    return { grid: graticule(f, 30), routes: drawn, dots: ends, radius: f.radius };
  }, [trips]);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      role="img"
      aria-label="Globe with recorded road trips"
      focusable="false"
    >
      <defs>
        {/* Lit from the upper left, falling into night at the lower right —
            the shading is what stops a circle from reading as a disc. */}
        <radialGradient id="gp-sphere" cx="34%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#38618f" />
          <stop offset="34%" stopColor="#1d3a63" />
          <stop offset="68%" stopColor="#0f2143" />
          <stop offset="100%" stopColor="#050a18" />
        </radialGradient>
        <radialGradient id="gp-sheen" cx="32%" cy="24%" r="46%">
          <stop offset="0%" stopColor="rgba(190,220,255,0.20)" />
          <stop offset="100%" stopColor="rgba(190,220,255,0)" />
        </radialGradient>
        <radialGradient id="gp-air" cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="rgba(96,160,245,0)" />
          <stop offset="89%" stopColor="rgba(96,160,245,0.26)" />
          <stop offset="100%" stopColor="rgba(96,160,245,0)" />
        </radialGradient>
        <clipPath id="gp-clip">
          <circle cx={R} cy={R} r={radius} />
        </clipPath>
      </defs>

      {/* The atmosphere only exists where the limb is: zoomed in, the sphere
          fills the frame and there is no edge for it to sit on. */}
      {radius <= R && <circle cx={R} cy={R} r={radius / SCALE} fill="url(#gp-air)" />}
      <circle cx={R} cy={R} r={radius} fill="url(#gp-sphere)" />
      <circle cx={R} cy={R} r={radius} fill="url(#gp-sheen)" />

      <g clipPath="url(#gp-clip)">
        <g fill="none" stroke="#9fc0ee" strokeOpacity="0.15" strokeWidth="1">
          {grid.map((d, i) => (
            <path key={`g${i}`} d={d} />
          ))}
        </g>
        {/* Three passes, widest first: a soft bloom, the route, a hot core.
            A single stroke at this size is a hairline nobody finds. */}
        <g fill="none" stroke="#FF6B00" strokeLinecap="round" strokeLinejoin="round">
          <g strokeWidth="22" strokeOpacity="0.16">
            {routes.map((d, i) => (
              <path key={`h${i}`} d={d} />
            ))}
          </g>
          <g strokeWidth="9" strokeOpacity="0.34">
            {routes.map((d, i) => (
              <path key={`b${i}`} d={d} />
            ))}
          </g>
          <g strokeWidth="3.4">
            {routes.map((d, i) => (
              <path key={`r${i}`} d={d} />
            ))}
          </g>
          <g strokeWidth="1.2" stroke="#FFE7CC" strokeOpacity="0.9">
            {routes.map((d, i) => (
              <path key={`c${i}`} d={d} />
            ))}
          </g>
        </g>
        {dots.map((dot, i) => (
          <g key={`d${i}`}>
            <circle cx={dot.x} cy={dot.y} r="11" fill="#FF6B00" opacity="0.16" />
            <circle
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill={dot.end ? '#FF6B00' : '#ffffff'}
              stroke="#FF6B00"
              strokeWidth="1.6"
            />
          </g>
        ))}
      </g>

      <circle cx={R} cy={R} r={radius} fill="none" stroke="rgba(150,190,255,0.3)" strokeWidth="1.2" />
    </svg>
  );
}
