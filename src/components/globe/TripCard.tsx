import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { GlobeTrip } from './types';
import { avatarStyle } from '../../lib/anonAvatar';
import { useTranslation } from '../../i18n/useTranslation';

const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

function routeThumb(coords: [number, number][]): string {
  if (coords.length < 2) return '';
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of coords) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }
  const w = 200, h = 90, pad = 12;
  const sx = maxLng - minLng || 1e-6;
  const sy = maxLat - minLat || 1e-6;
  return coords
    .map(([lat, lng]) => {
      const x = pad + ((lng - minLng) / sx) * (w - 2 * pad);
      const y = h - pad - ((lat - minLat) / sy) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TripCard({ trip, onClose }: { trip: GlobeTrip; onClose: () => void }) {
  const { t } = useTranslation();
  const av = avatarStyle(trip.id);
  const pts = routeThumb(trip.coords);
  const label = [t('home.globe.card_traveler'), trip.region].filter(Boolean).join(' · ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      className="rounded-2xl bg-[#16161d] border border-white/10 shadow-2xl overflow-hidden text-white"
    >
      <div className="relative h-[100px] bg-[#0d1622]">
        <svg viewBox="0 0 200 90" preserveAspectRatio="none" className="w-full h-full">
          <polyline points={pts} fill="none" stroke="#FF7A18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-full shrink-0"
            style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
          />
          <span className="text-sm text-white/80">{label}</span>
        </div>
        <a
          href={APP_STORE_URL}
          className="mt-4 block text-center rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] py-2.5 font-bold text-[#1a1209]"
        >
          {t('home.globe.card_cta')}
        </a>
      </div>
    </motion.div>
  );
}
