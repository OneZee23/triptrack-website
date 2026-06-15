import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { GlobeTrip } from './types';
import { avatarStyle } from '../../lib/anonAvatar';
import { useTranslation } from '../../i18n/useTranslation';
import { RouteMiniMap } from './RouteMiniMap';

const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

export function TripCard({ trip, onClose }: { trip: GlobeTrip; onClose: () => void }) {
  const { t } = useTranslation();
  const av = avatarStyle(trip.id);
  const label = [t('home.globe.card_traveler'), trip.region].filter(Boolean).join(' · ');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0b0d12]/55 text-white shadow-[0_12px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150"
    >
      {/* liquid-glass specular highlights */}
      <div className="pointer-events-none absolute inset-x-5 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[26px] ring-1 ring-inset ring-white/10" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-30 rounded-full bg-black/35 p-1.5 text-white/85 backdrop-blur transition hover:bg-black/55 hover:text-white"
      >
        <X size={16} />
      </button>

      {/* real map snapshot of the route */}
      <div className="relative m-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1622]">
        <RouteMiniMap trip={trip} />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
      </div>

      {/* meta + cta */}
      <div className="relative px-4 pb-4 pt-1">
        <div className="flex items-center gap-3">
          <span
            className="h-9 w-9 shrink-0 rounded-full ring-2 ring-white/15"
            style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
          />
          <span className="text-sm font-medium text-white/85">{label}</span>
        </div>
        <a
          href={APP_STORE_URL}
          className="mt-4 block rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] py-2.5 text-center font-bold text-[#1a1209] shadow-[0_4px_22px_rgba(255,107,0,0.4)] transition hover:brightness-105"
        >
          {t('home.globe.card_cta')}
        </a>
      </div>
    </motion.div>
  );
}
