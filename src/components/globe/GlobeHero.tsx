import { Suspense, lazy, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGlobeData } from '../../hooks/useGlobeData';
import { TripCard } from './TripCard';
import type { GlobeTrip } from './types';

const TripGlobe = lazy(() => import('./TripGlobe'));
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const Fallback = () => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{ background: 'radial-gradient(circle at 50% 45%, #16263a 0%, #0a1018 55%, #06060a 100%)' }}
  />
);

export default function GlobeHero() {
  const { t } = useTranslation();
  const state = useGlobeData();
  const [selected, setSelected] = useState<GlobeTrip | null>(null);

  const trips = state.status === 'success' ? state.data.trips : [];
  const stats = state.status === 'success' ? state.data.stats : null;
  const reduce = prefersReducedMotion();
  const showGlobe = !reduce && trips.length > 0;

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[#06060a] text-white">
      <div className="absolute inset-0">
        {showGlobe ? (
          <Suspense fallback={<Fallback />}>
            <TripGlobe trips={trips} onSelect={setSelected} />
          </Suspense>
        ) : (
          <Fallback />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#06060a]/90 via-[#06060a]/40 to-transparent pointer-events-none" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-[640px]">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05]">{t('home.globe.title')}</h1>
          <p className="mt-5 text-lg text-white/70 max-w-md">{t('home.globe.subtitle')}</p>
          <a
            href={APP_STORE_URL}
            className="mt-8 inline-flex w-max items-center gap-2 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] px-6 py-3 font-bold text-[#1a1209]"
          >
            {t('home.globe.cta')}
          </a>
          {stats && (
            <div className="mt-6 flex gap-5 text-sm text-white/60">
              <span><b className="text-[#FFB000]">{stats.trips}</b> {t('home.globe.stat_trips')}</span>
              <span><b className="text-[#FFB000]">{stats.cities}</b> {t('home.globe.stat_cities')}</span>
            </div>
          )}
          {showGlobe && (
            <p className="globe-hint mt-8 text-xs uppercase tracking-[0.15em] text-white/40">{t('home.globe.hint')}</p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="absolute z-20 bottom-8 right-6 left-6 md:left-auto md:w-[340px]">
            <TripCard trip={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
