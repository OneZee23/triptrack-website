import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Route, Clock, Gauge, Zap, type LucideIcon } from 'lucide-react';
import type { GlobeTrip } from './types';
import { avatarStyle } from '../../lib/anonAvatar';
import { useTranslation } from '../../i18n/useTranslation';
import { RouteMiniMap } from './RouteMiniMap';

const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

type StatItem = { icon: LucideIcon; value: string; label: string };

function Stat({ icon: Icon, value, label }: StatItem) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 py-2">
      <Icon size={15} className="shrink-0 text-[#FFB000]" />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold leading-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-white/45 leading-tight">{label}</div>
      </div>
    </div>
  );
}

export function TripCard({ trip, onClose }: { trip: GlobeTrip; onClose: () => void }) {
  const { t, lang } = useTranslation();
  const av = avatarStyle(trip.id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = trip.title || trip.region || t('home.globe.card_traveler');
  const dateLabel = trip.date
    ? new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(trip.date),
      )
    : null;
  const subtitle = [dateLabel, trip.region].filter(Boolean).join(' · ');

  const fmtDuration = (sec: number) => {
    let h = Math.floor(sec / 3600);
    let m = Math.round((sec % 3600) / 60);
    if (m === 60) {
      h += 1;
      m = 0;
    }
    return h > 0 ? `${h} ${t('home.globe.unit_h')} ${m} ${t('home.globe.unit_min')}` : `${m} ${t('home.globe.unit_min')}`;
  };

  const km = t('home.globe.km');
  const kmh = t('home.globe.unit_kmh');
  const stats: StatItem[] = [
    trip.distanceKm != null ? { icon: Route, value: `${trip.distanceKm} ${km}`, label: t('home.globe.stat_distance') } : null,
    trip.durationSec != null ? { icon: Clock, value: fmtDuration(trip.durationSec), label: t('home.globe.stat_duration') } : null,
    trip.avgSpeedKmh != null ? { icon: Gauge, value: `${trip.avgSpeedKmh} ${kmh}`, label: t('home.globe.stat_avg') } : null,
    trip.maxSpeedKmh != null ? { icon: Zap, value: `${trip.maxSpeedKmh} ${kmh}`, label: t('home.globe.stat_max') } : null,
  ].filter((s): s is StatItem => s !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0b0d12]/55 text-white shadow-[0_12px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl backdrop-saturate-150"
    >
      {/* liquid-glass specular highlights */}
      <div className="pointer-events-none absolute inset-x-5 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[26px] ring-1 ring-inset ring-white/10" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-30 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white/90 backdrop-blur-md transition hover:bg-black/65 hover:text-white"
      >
        <X size={15} />
      </button>

      {/* real map snapshot of the route + "auto-recorded" hook pill */}
      <div className="relative m-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1622]">
        <RouteMiniMap trip={trip} />
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/10" />
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-[#FFD9A8] backdrop-blur-md">
          <Sparkles size={12} />
          {t('home.modal_auto_recorded')}
        </div>
      </div>

      {/* memory: title + facts + stats + traveler + CTA */}
      <div className="relative px-4 pb-4 pt-1">
        <h3 className="text-[15px] font-bold leading-snug">{title}</h3>
        {subtitle && <div className="mt-1 text-xs text-white/60">{subtitle}</div>}

        {stats.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <Stat key={s.label} icon={s.icon} value={s.value} label={s.label} />
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base ring-2 ring-white/15"
            style={{ background: `linear-gradient(135deg, ${av.from}, ${av.to})` }}
          >
            {trip.avatarEmoji || ''}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-tight">
              {trip.traveler || t('home.globe.card_traveler')}
            </div>
            {trip.level != null && (
              <div className="text-[10px] text-white/45 leading-tight">
                {t('home.globe.card_level')} {trip.level}
              </div>
            )}
          </div>
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
