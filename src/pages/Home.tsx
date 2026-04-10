import { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent } from 'motion/react';
import { Car, Map, Crosshair, Camera, Activity, Target, MessageCircle, Star, ArrowRight, X } from 'lucide-react';
import { CursorContext } from '../components/AppLayout';
import { Link } from 'react-router';
import { useTranslation } from '../i18n/useTranslation';

import screenFeed from '../assets/screen-feed.png';
import screenRecording from '../assets/screen-recording.png';
import screenDetail from '../assets/screen-detail.png';
import screenLockscreen from '../assets/screen-lockscreen.png';
import screenProfile from '../assets/screen-profile.png';

// --- Map tile config ---
const ZOOM = 7;
const START_TILE_X = 72;
const START_TILE_Y = 38;
const TILES_X = 14;
const TILES_Y = 12;
const CANVAS_W = TILES_X * 256;
const CANVAS_H = TILES_Y * 256;

function geoToPixel(lat: number, lon: number) {
  const n = Math.pow(2, ZOOM);
  const x = ((lon + 180) / 360 * n - START_TILE_X) * 256;
  const latRad = lat * Math.PI / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n - START_TILE_Y) * 256;
  return { x: Math.round(x), y: Math.round(y) };
}

// --- 6 well-spaced trips along Moscow → Sochi (M4) ---
// Route shapes traced from real roads, fitted to 300x85 viewbox (like MKMapSnapshotter)
const TRIP_DATA = [
  {
    id: 1, title: 'Morning Commute', location: 'Moscow',
    date: '1 May, 09:00', distance: '12.4', unit: 'km', duration: '0:45', avgSpeed: '24', maxSpeed: '62',
    vehicle: '🚗', vehicleName: 'Daily Driver',
    lat: 55.75, lon: 37.62,
    // City grid: 90° turns through Moscow streets (Sadovoe → Kutuzovsky → 3rd Ring)
    routePath: 'M 15 68 L 15 52 L 38 52 L 38 40 L 65 40 L 65 55 L 90 55 L 90 38 L 120 38 L 120 52 L 148 52 L 148 32 L 175 32 L 175 48 L 200 48 L 200 28 L 230 28 L 258 28 L 258 42 L 285 42',
    routeColors: ['#2EAE50', '#2EAE50', '#F5BE1E', '#2EAE50', '#2EAE50', '#F5BE1E', '#2EAE50', '#2EAE50'],
  },
  {
    id: 2, title: 'Highway Run', location: 'Tula Oblast',
    date: '1 May, 12:30', distance: '180', unit: 'km', duration: '2:15', avgSpeed: '85', maxSpeed: '128',
    vehicle: '🚗', vehicleName: 'Daily Driver',
    lat: 54.19, lon: 37.62,
    // M2 highway south: straight with gentle bends, exit at Tula
    routePath: 'M 15 22 L 28 24 L 50 28 L 78 30 L 105 29 L 130 32 L 158 34 L 182 33 L 205 36 L 228 40 L 245 42 L 258 48 L 270 55 L 278 62 L 285 65',
    routeColors: ['#F5BE1E', '#EB571E', '#DC3C32', '#DC3C32', '#EB571E', '#F5BE1E'],
  },
  {
    id: 3, title: 'Voronezh Bypass', location: 'Voronezh',
    date: '1 May, 16:45', distance: '320', unit: 'km', duration: '3:40', avgSpeed: '90', maxSpeed: '135',
    vehicle: '🚗', vehicleName: 'Daily Driver',
    lat: 51.67, lon: 39.21,
    // M4 Don: straight south then bypass arc east of Voronezh
    routePath: 'M 15 18 L 35 22 L 60 28 L 85 32 L 108 30 L 128 28 L 148 32 L 162 38 L 172 46 L 180 55 L 190 62 L 205 66 L 222 64 L 240 58 L 255 52 L 268 50 L 285 52',
    routeColors: ['#DC3C32', '#DC3C32', '#EB571E', '#F5BE1E', '#2EAE50', '#F5BE1E', '#EB571E'],
  },
  {
    id: 4, title: 'Night Stop', location: 'Rostov-on-Don',
    date: '1 May, 22:15', distance: '560', unit: 'km', duration: '6:30', avgSpeed: '86', maxSpeed: '142',
    vehicle: '🚗', vehicleName: 'Daily Driver',
    lat: 47.24, lon: 39.71,
    // M4 long haul: very straight highway heading south through steppe
    routePath: 'M 15 18 L 32 20 L 55 22 L 80 24 L 108 25 L 135 26 L 160 28 L 185 30 L 208 32 L 228 35 L 245 38 L 260 44 L 272 52 L 280 60 L 285 68',
    routeColors: ['#EB571E', '#DC3C32', '#DC3C32', '#DC3C32', '#EB571E', '#F5BE1E'],
  },
  {
    id: 5, title: 'To the Coast', location: 'Krasnodar',
    date: '2 May, 10:00', distance: '280', unit: 'km', duration: '3:20', avgSpeed: '84', maxSpeed: '130',
    vehicle: '🚗', vehicleName: 'Daily Driver',
    lat: 45.03, lon: 38.97,
    // Rostov→Krasnodar: M4 southwest then south through Krasnodar Krai
    routePath: 'M 15 15 L 30 18 L 52 24 L 75 32 L 95 38 L 112 42 L 128 44 L 145 42 L 165 44 L 182 48 L 198 52 L 218 56 L 235 58 L 252 62 L 268 66 L 285 72',
    routeColors: ['#EB571E', '#DC3C32', '#EB571E', '#EB571E', '#F5BE1E', '#2EAE50'],
  },
];

// Route waypoints along M4
const ROUTE_WAYPOINTS = [
  { lat: 55.75, lon: 37.62 },
  { lat: 55.35, lon: 37.52 },
  { lat: 54.90, lon: 37.41 },
  { lat: 54.19, lon: 37.62 },
  { lat: 53.45, lon: 38.10 },
  { lat: 52.60, lon: 38.50 },
  { lat: 51.67, lon: 39.21 },
  { lat: 50.58, lon: 39.60 },
  { lat: 49.65, lon: 39.85 },
  { lat: 48.72, lon: 40.10 },
  { lat: 47.65, lon: 40.05 },
  { lat: 47.24, lon: 39.71 },
  { lat: 46.58, lon: 39.50 },
  { lat: 46.10, lon: 39.20 },
  { lat: 45.03, lon: 38.97 },
  { lat: 45.03, lon: 38.97 },
];

// Speed-colored route component — renders path with color segments
function SpeedRoute({ path, colors }: { path: string; colors: string[] }) {
  // Extract all coordinate pairs from the path
  const allCoords: [number, number][] = [];
  const numRegex = /(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = numRegex.exec(path)) !== null) {
    allCoords.push([parseFloat(m[1]), parseFloat(m[2])]);
  }

  if (allCoords.length < 2) return null;

  const segCount = colors.length;
  const pointsPerSeg = Math.max(2, Math.ceil(allCoords.length / segCount));

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 85" preserveAspectRatio="xMidYMid meet">
      {/* Render colored segments */}
      {colors.map((color, i) => {
        const startIdx = i * pointsPerSeg;
        const endIdx = Math.min((i + 1) * pointsPerSeg + 1, allCoords.length);
        if (startIdx >= allCoords.length) return null;
        const pts = allCoords.slice(startIdx, endIdx);
        if (pts.length < 2) return null;
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let j = 1; j < pts.length; j++) {
          d += ` L ${pts[j][0]} ${pts[j][1]}`;
        }
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />;
      })}
      {/* Start & end markers */}
      <circle cx={allCoords[0][0]} cy={allCoords[0][1]} r="4" fill="#2EAE50" />
      <circle cx={allCoords[allCoords.length-1][0]} cy={allCoords[allCoords.length-1][1]} r="4" fill="#EF4444" />
    </svg>
  );
}

// App-style trip card
function TripCard({ trip, onClick, onHoverStart, onHoverEnd }: {
  trip: typeof TRIP_DATA[0] & { x: number; y: number };
  onClick: () => void;
  onHoverStart: (e: React.MouseEvent) => void;
  onHoverEnd: () => void;
}) {
  return (
    <motion.div
      className="absolute bg-white rounded-2xl text-[#1e1e23] border border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden"
      style={{ left: trip.x, top: trip.y, width: 300, zIndex: 10 }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -6, boxShadow: '0 16px 48px -8px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <div className="w-8 h-8 bg-[#f4f2ee] rounded-full flex items-center justify-center text-sm">{trip.vehicle}</div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-[#1e1e23]/45 block">{trip.vehicleName}</span>
        </div>
        <span className="text-[11px] text-[#1e1e23]/35 font-medium">{trip.date}</span>
      </div>

      {/* Title */}
      <div className="px-4 pb-2">
        <h3 className="text-[16px] font-extrabold text-[#1e1e23] leading-tight">{trip.title}</h3>
        <p className="text-[11px] text-[#1e1e23]/35 mt-0.5">{trip.location}</p>
      </div>

      {/* Route Preview — map tiles + speed-colored route */}
      <div className="mx-4 h-[80px] bg-[#f4f2ee] rounded-xl relative overflow-hidden border border-black/5">
        {(() => {
          const z = 8;
          const n = Math.pow(2, z);
          const cx = Math.floor(((trip.lon + 180) / 360) * n);
          const latRad = trip.lat * Math.PI / 180;
          const cy = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
          return [-1, 0, 1].map(dx => (
            <img key={dx} src={`https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${cx + dx}/${cy}.png`}
              alt="" draggable={false} className="absolute top-0 pointer-events-none select-none"
              style={{ left: dx * 256 + 150 - 128, width: 256, height: 256, top: -88 }} />
          ));
        })()}
        <div className="absolute inset-0">
          <SpeedRoute path={trip.routePath} colors={trip.routeColors} />
        </div>
      </div>

      {/* Stats Row — colored like the app */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[18px] font-bold font-mono text-[#2EAE50] leading-none">{trip.distance}</span>
          <span className="text-[9px] font-semibold text-[#1e1e23]/25 uppercase tracking-wider mt-1">km</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[18px] font-bold font-mono text-[#EB571E] leading-none">{trip.duration}</span>
          <span className="text-[9px] font-semibold text-[#1e1e23]/25 uppercase tracking-wider mt-1">time</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[18px] font-bold font-mono text-[#3884E0] leading-none">{trip.avgSpeed}</span>
          <span className="text-[9px] font-semibold text-[#1e1e23]/25 uppercase tracking-wider mt-1">km/h</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { setHoverState } = useContext(CursorContext);
  const { t } = useTranslation();
  const [selectedCard, setSelectedCard] = useState<typeof TRIPS[0] | null>(null);

  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const TRIPS = useMemo(() => TRIP_DATA.map(trip => {
    const px = geoToPixel(trip.lat, trip.lon);
    return { ...trip, x: px.x - 150, y: px.y - 20 };
  }), []);

  const routePath = useMemo(() => {
    const points = ROUTE_WAYPOINTS.map(wp => geoToPixel(wp.lat, wp.lon));
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      const cpy = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x + (curr.x - prev.x) * 0.3} ${prev.y + (curr.y - prev.y) * 0.7}, ${cpx} ${cpy}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }, []);

  useMotionValueEvent(dragX, "change", (latest) => {
    setCoords(c => ({ ...c, x: Math.round(CANVAS_W / 2 - latest) }));
  });
  useMotionValueEvent(dragY, "change", (latest) => {
    setCoords(c => ({ ...c, y: Math.round(CANVAS_H / 2 - latest) }));
  });

  useEffect(() => {
    const voronezh = geoToPixel(51.67, 39.21);
    const viewW = typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1000;
    dragX.set(-(voronezh.x - viewW / 2));
    dragY.set(-(voronezh.y - 350));
  }, []);

  const tiles = useMemo(() => {
    const result = [];
    for (let row = 0; row < TILES_Y; row++) {
      for (let col = 0; col < TILES_X; col++) {
        result.push({ key: `${row}-${col}`, x: col * 256, y: row * 256, tileX: START_TILE_X + col, tileY: START_TILE_Y + row });
      }
    }
    return result;
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Noise texture removed for light theme */}

      {/* HERO */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-40 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-[#EB571E]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-[40px] md:text-[72px] font-bold tracking-tight mb-6 leading-[1.1] text-[#1e1e23]">{t('home.hero_title')}</h1>
          <p className="text-lg md:text-xl text-[#1e1e23]/50 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">{t('home.hero_subtitle')}</p>
          <div className="flex flex-col items-center lg:items-start gap-4">
            <Link to="/download" className="bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-8 py-4 text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_2px_20px_rgba(235,87,30,0.3)]">{t('home.download_free')}</Link>
            <p className="text-[12px] font-medium text-[#1e1e23]/35">{t('home.hero_note')}</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex-1 w-full max-w-[340px] relative">
          <div className="absolute inset-0 bg-[#EB571E]/10 blur-[80px] rounded-full" />
          <div className="relative w-full aspect-[9/16] rounded-[32px] overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.1)] border border-black/5">
            <img src={screenFeed} alt="TripTrack Feed" className="w-full h-[140%] object-cover object-bottom" />
          </div>
        </motion.div>
      </section>

      {/* CANVAS — dark map island on light page */}
      <section className="w-full max-w-7xl mx-auto px-6 mb-20 relative">
        <div className="absolute top-4 right-10 items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-black/5 backdrop-blur-md z-20 shadow-sm hidden md:flex">
          <Crosshair className="w-4 h-4 text-[#EB571E]" />
          <span className="text-xs font-mono tracking-wider text-[#1e1e23]/40">X:{coords.x.toString().padStart(4,'0')} Y:{coords.y.toString().padStart(4,'0')}</span>
        </div>

        <div className="relative rounded-[32px] border border-black/8 shadow-[0_4px_30px_rgba(0,0,0,0.08)] overflow-hidden bg-[#eae8e3] w-full h-[700px] group">
          <motion.div
            className="absolute top-0 left-0 will-change-transform"
            style={{ width: CANVAS_W, height: CANVAS_H, x: dragX, y: dragY }}
            drag dragConstraints={{ left: -2200, right: -300, top: -1700, bottom: -100 }} dragElastic={0.08} dragMomentum={false}
            whileTap={{ cursor: 'grabbing' }}
            onHoverStart={() => setHoverState({ text: t('home.drag_map'), active: true })}
            onHoverEnd={() => setHoverState(null)}
          >
            {/* CARTO Dark Map Tiles */}
            {tiles.map(tile => (
              <img
                key={tile.key}
                src={`https://basemaps.cartocdn.com/rastertiles/voyager/${ZOOM}/${tile.tileX}/${tile.tileY}.png`}
                alt=""
                draggable={false}
                loading="lazy"
                className="absolute pointer-events-none select-none"
                style={{ left: tile.x, top: tile.y, width: 256, height: 256 }}
              />
            ))}

            {/* Subtle vignette — lighter than before */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(234,232,227,0.6) 100%)' }} />

            {/* Route Line */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: CANVAS_W, height: CANVAS_H }}>
              <defs>
                <filter id="routeGlow"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <path d={routePath} fill="none" stroke="#EB571E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" filter="url(#routeGlow)" />
              <path d={routePath} fill="none" stroke="#EB571E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="route-line" opacity="0.7" />
              {(() => {
                const start = geoToPixel(ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lon);
                const end = geoToPixel(ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lat, ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lon);
                return (<>
                  <circle cx={start.x} cy={start.y} r="7" fill="#2EAE50" opacity="0.9" />
                  <circle cx={start.x} cy={start.y} r="3" fill="white" opacity="0.8" />
                  <circle cx={end.x} cy={end.y} r="7" fill="#EF4444" opacity="0.9" />
                  <circle cx={end.x} cy={end.y} r="3" fill="white" opacity="0.8" />
                </>);
              })()}
            </svg>

            {/* Trip Cards */}
            {TRIPS.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => setSelectedCard(trip)}
                onHoverStart={(e) => { e.stopPropagation(); setHoverState({ text: t('home.view_trip'), active: true }); }}
                onHoverEnd={() => setHoverState({ text: t('home.drag_map'), active: true })}
              />
            ))}
          </motion.div>

          {/* Edge gradients */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#eae8e3] to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#eae8e3] to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-[#eae8e3] to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#eae8e3] to-transparent pointer-events-none z-10" />
        </div>
      </section>

      {/* PROBLEM STATEMENT */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-black/5 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Map className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_timeline_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_timeline_desc')}</p>
          </div>
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Camera className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_photos_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_photos_desc')}</p>
          </div>
          <div className="bg-white border border-black/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform shadow-sm">
            <Target className="w-8 h-8 text-[#EB571E] mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.problem_noapp_title')}</h3>
            <p className="text-[#1e1e23]/50 text-sm leading-relaxed">{t('home.problem_noapp_desc')}</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full max-w-6xl mx-auto px-6 py-32 text-center relative border-t border-black/5">
        <h2 className="text-[40px] font-bold mb-24 text-[#1e1e23]">{t('home.how_title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="absolute top-[20%] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-emerald-500/20 via-[#EB571E]/50 to-red-500/20 hidden md:block" />
          {/* Step 1: Start */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">01</span>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(16,185,129,0.3)]"><div className="w-3 h-3 rounded-full bg-emerald-500" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenLockscreen} alt="Live Activity on Lock Screen" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step1_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step1_desc')}</p>
          </div>
          {/* Step 2: Drive */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">02</span>
            <div className="w-12 h-12 rounded-full bg-[#EB571E]/20 border-2 border-[#EB571E] flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(235,87,30,0.3)]"><div className="w-3 h-3 rounded-full bg-[#EB571E]" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenRecording} alt="Recording a trip" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step2_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step2_desc')}</p>
          </div>
          {/* Step 3: Remember */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="absolute -top-12 text-[120px] font-bold text-black/[0.03] leading-none select-none">03</span>
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(239,68,68,0.3)]"><div className="w-3 h-3 rounded-full bg-red-500" /></div>
            <div className="w-[240px] h-[380px] rounded-[28px] mb-6 shadow-lg overflow-hidden border border-black/5 bg-[#f8f6f2]">
              <img src={screenDetail} alt="Trip detail view" className="w-full h-[150%] object-cover object-bottom" />
            </div>
            <h4 className="text-xl font-semibold mb-3 text-[#1e1e23]">{t('home.step3_title')}</h4>
            <p className="text-[#1e1e23]/50 text-sm px-4">{t('home.step3_desc')}</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="w-full py-32 bg-[#f4f2ee] border-y border-black/5 text-center relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4">
          {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 fill-[#EB571E] text-[#EB571E]" />)}
        </div>
        <p className="text-[20px] font-bold mb-12 text-[#1e1e23]">{t('home.rating')}</p>
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white border border-black/5 p-10 rounded-3xl text-center shadow-sm">
            <div className="flex justify-center gap-1 mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-[#EB571E] text-[#EB571E]" />)}
            </div>
            <p className="text-[18px] leading-relaxed mb-6 text-[#1e1e23] italic">{t('home.review1')}</p>
            <p className="font-semibold text-[13px] text-[#1e1e23]/40">OKOPOK &middot; <a href="https://apps.apple.com/us/app/triptrack-road-journal/id6760650361" target="_blank" rel="noopener" className="text-[#EB571E] hover:underline">App Store</a></p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full max-w-4xl mx-auto px-6 py-40 text-center relative z-10">
        <h2 className="text-[40px] md:text-[72px] font-bold tracking-tighter mb-8 text-[#1e1e23]">{t('home.cta_title')}</h2>
        <Link to="/download" className="inline-block bg-[#EB571E] hover:bg-[#d14e1a] text-white rounded-full px-12 py-5 text-[20px] font-bold transition-all hover:scale-105 active:scale-95 mb-6 shadow-[0_2px_20px_rgba(235,87,30,0.3)]">{t('home.cta_button')}</Link>
        <p className="text-[12px] text-[#1e1e23]/35 font-medium">{t('home.cta_note')}</p>
      </section>

      {/* Trip Detail Modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedCard(null)}>
            <motion.div
              className="bg-white border border-black/5 rounded-[32px] w-full max-w-lg text-[#1e1e23] relative shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden"
              initial={{ y: 50, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={e => e.stopPropagation()}
            >
              {/* Map preview — light tiles */}
              <div className="relative w-full h-[240px] bg-[#f4f2ee] overflow-hidden">
                {(() => {
                  const z = 9;
                  const n = Math.pow(2, z);
                  const cx = Math.floor(((selectedCard.lon + 180) / 360) * n);
                  const latRad = selectedCard.lat * Math.PI / 180;
                  const cy = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
                  const tiles = [];
                  for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                      tiles.push({ tx: cx + dx, ty: cy + dy, px: (dx + 2) * 256 - 128, py: (dy + 1) * 256 - 136 });
                    }
                  }
                  return tiles.map((t, i) => (
                    <img key={i} src={`https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${t.tx}/${t.ty}.png`}
                      alt="" className="absolute pointer-events-none" style={{ left: t.px, top: t.py, width: 256, height: 256 }} />
                  ));
                })()}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
                <div className="absolute inset-x-8 inset-y-6">
                  <SpeedRoute path={selectedCard.routePath} colors={selectedCard.routeColors} />
                </div>
                <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md hover:bg-white rounded-full flex items-center justify-center transition-colors z-10 border border-black/10 shadow-sm" onClick={() => setSelectedCard(null)}>
                  <X className="w-5 h-5 text-[#1e1e23]" />
                </button>
              </div>

              <div className="p-6">
                {/* Date & vehicle */}
                <div className="flex items-center gap-2 mb-3 text-[#1e1e23]/40 text-[12px] font-medium">
                  <span>{selectedCard.date}</span>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">{selectedCard.vehicle} {selectedCard.vehicleName}</span>
                </div>

                <h2 className="text-[24px] font-extrabold mb-1 text-[#1e1e23]">{selectedCard.title}</h2>
                <p className="text-[#1e1e23]/40 text-[13px] mb-6 flex items-center gap-1.5"><Map className="w-3 h-3" />{selectedCard.location}</p>

                {/* Stats grid — app style, light */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#f4f2ee] rounded-2xl p-4 border border-black/5">
                    <span className="text-[10px] font-bold text-[#1e1e23]/30 uppercase tracking-wider block mb-1">{t('home.distance')}</span>
                    <span className="text-[28px] font-bold font-mono text-[#2EAE50] leading-none">{selectedCard.distance} <span className="text-[14px]">{selectedCard.unit}</span></span>
                  </div>
                  <div className="bg-[#f4f2ee] rounded-2xl p-4 border border-black/5">
                    <span className="text-[10px] font-bold text-[#1e1e23]/30 uppercase tracking-wider block mb-1">{t('home.time')}</span>
                    <span className="text-[28px] font-bold font-mono text-[#EB571E] leading-none">{selectedCard.duration}</span>
                  </div>
                  <div className="bg-[#f4f2ee] rounded-2xl p-4 border border-black/5">
                    <span className="text-[10px] font-bold text-[#1e1e23]/30 uppercase tracking-wider block mb-1">{t('home.avg_speed')}</span>
                    <span className="text-[28px] font-bold font-mono text-[#3884E0] leading-none">{selectedCard.avgSpeed} <span className="text-[14px]">km/h</span></span>
                  </div>
                  <div className="bg-[#f4f2ee] rounded-2xl p-4 border border-black/5">
                    <span className="text-[10px] font-bold text-[#1e1e23]/30 uppercase tracking-wider block mb-1">Max speed</span>
                    <span className="text-[28px] font-bold font-mono text-[#DC3C32] leading-none">{selectedCard.maxSpeed} <span className="text-[14px]">km/h</span></span>
                  </div>
                </div>

                <Link to="/download" className="w-full bg-[#EB571E] hover:bg-[#EB571E]/90 text-white rounded-2xl py-4 font-bold text-[16px] shadow-[0_0_20px_rgba(235,87,30,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2">
                  {t('home.modal_try_free')} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
