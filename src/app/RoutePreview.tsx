import { useMemo } from 'react';
import { decodePreviewPolyline, projectPoints, toPathData } from './polyline';
import { ACCENT } from './ui';

const WIDTH = 320;
const HEIGHT = 120;

/** The route on a trip card, drawn as a plain `<svg>` from the preview
 *  polyline. Deliberately NOT a map: a list of twenty cards would mean
 *  twenty MapLibre canvases, twenty WebGL contexts (browsers cap them
 *  around sixteen) and a tile request storm for thumbnails nobody reads
 *  street names on. The full map lives on the trip screen, one at a time. */
export function RoutePreview({ polyline }: { polyline: string | null }) {
  const shape = useMemo(() => {
    const coords = decodePreviewPolyline(polyline);
    if (!coords || coords.length < 2) return null;
    const points = projectPoints(coords, WIDTH, HEIGHT, 10);
    return { d: toPathData(points), start: points[0], end: points[points.length - 1] };
  }, [polyline]);

  if (!shape) {
    return (
      <div
        className="w-full h-[120px] rounded-2xl bg-[#f4f2ee] border border-black/5"
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-[120px] rounded-2xl bg-[#f4f2ee] border border-black/5"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path d={shape.d} fill="none" stroke={ACCENT} strokeOpacity="0.25" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d={shape.d} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shape.start.x} cy={shape.start.y} r="4" fill="#ffffff" stroke={ACCENT} strokeWidth="2" />
      <circle cx={shape.end.x} cy={shape.end.y} r="4" fill={ACCENT} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}
