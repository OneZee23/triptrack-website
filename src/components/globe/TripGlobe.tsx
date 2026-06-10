import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import type { GlobeTrip } from './types';

const TEX_2K = '/textures/earth-night-2k.jpg';
const TEX_4K = '/textures/earth-night-4k.jpg';

function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}
function reduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface EndPoint {
  lat: number;
  lng: number;
  trip: GlobeTrip;
}

export default function TripGlobe({
  trips,
  onSelect,
}: {
  trips: GlobeTrip[];
  onSelect: (t: GlobeTrip) => void;
}) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<number | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tex, setTex] = useState(TEX_2K);
  const [supported] = useState(() => typeof window !== 'undefined' && webglOK());

  const points = useMemo<EndPoint[]>(
    () =>
      trips.flatMap((t) => {
        if (t.coords.length < 2) return [];
        const a = t.coords[0];
        const b = t.coords[t.coords.length - 1];
        return [
          { lat: a[0], lng: a[1], trip: t },
          { lat: b[0], lng: b[1], trip: t },
        ];
      }),
    [trips],
  );

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setTex(TEX_4K), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const onReady = useCallback(() => {
    const g = globeEl.current;
    if (!g) return;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = (g as any).globeMaterial() as THREE.MeshPhongMaterial;
    if (mat.map) {
      mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.map.anisotropy = 8;
      mat.needsUpdate = true;
    }
    const c = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
      addEventListener: (e: string, cb: () => void) => void;
    };
    c.enableZoom = false;
    c.enablePan = false;
    c.autoRotate = !reduceMotion();
    c.autoRotateSpeed = 0.35;
    g.pointOfView({ lat: 30, lng: 50, altitude: 2.3 });
    const pause = () => {
      c.autoRotate = false;
      window.clearTimeout(idleTimer.current);
    };
    const resume = () => {
      if (reduceMotion()) return;
      idleTimer.current = window.setTimeout(() => {
        c.autoRotate = true;
      }, 2500);
    };
    c.addEventListener('start', pause);
    c.addEventListener('end', resume);
  }, []);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const g = globeEl.current;
        if (!g) return;
        if (e.isIntersecting) g.resumeAnimation();
        else g.pauseAnimation();
      },
      { threshold: 0.05 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      window.clearTimeout(idleTimer.current);
    };
  }, []);

  if (!supported) {
    return (
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, #16263a 0%, #0a1018 55%, #06060a 100%)',
        }}
      />
    );
  }

  return (
    <div ref={wrapRef} aria-hidden style={{ position: 'absolute', inset: 0 }}>
      <Globe
        ref={globeEl}
        width={size.w || undefined}
        height={size.h || undefined}
        onGlobeReady={onReady}
        rendererConfig={{ antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance', alpha: true }}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={tex}
        atmosphereColor="#ff7a18"
        atmosphereAltitude={0.18}
        pathsData={trips}
        pathPoints={(t: any) => t.coords}
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathPointAlt={0.005}
        pathColor={() => ['rgba(255,176,0,0)', 'rgba(255,122,24,0.9)', 'rgba(255,176,0,0)']}
        pathStroke={null as unknown as number}
        pathResolution={2}
        pathDashLength={0.4}
        pathDashGap={0.6}
        pathDashAnimateTime={reduceMotion() ? 0 : 4000}
        pathTransitionDuration={1000}
        onPathClick={(t: any) => onSelect(t as GlobeTrip)}
        pointsData={points}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointAltitude={0.01}
        pointRadius={0.16}
        pointColor={() => '#ffb000'}
        onPointClick={(d: any) => onSelect((d as EndPoint).trip)}
      />
    </div>
  );
}
