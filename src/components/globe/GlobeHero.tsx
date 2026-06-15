import { Suspense, lazy, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGlobeData } from '../../hooks/useGlobeData';
import { TripCard } from './TripCard';
import type { GlobeTrip } from './types';

const MapGlobe = lazy(() => import('./MapGlobe'));
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

const Fallback = () => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{ background: 'radial-gradient(circle at 58% 50%, #16263a 0%, #0a1018 60%, #06060a 100%)' }}
  />
);

export default function GlobeHero() {
  const { t, lang } = useTranslation();
  const state = useGlobeData();
  const [selected, setSelected] = useState<GlobeTrip | null>(null);
  const [interacting, setInteracting] = useState(false);

  const trips = state.status === 'success' ? state.data.trips : [];
  const stats = state.status === 'success' ? state.data.stats : null;

  // correct RU/EN pluralization ("1 поездка / 2 поездки / 5 поездок")
  const statWord = (base: string, n: number) => t(`home.globe.${base}_${new Intl.PluralRules(lang).select(n)}`);

  // hide the hero copy while exploring the map OR while a trip card is open,
  // so nothing pops back over the globe and competes with the card (Apple/Strava
  // map-detail pattern: selecting an object moves the page into a focused state).
  const heroHidden = interacting || selected !== null;

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[#06060a] text-white">
      <div className="absolute inset-0">
        <Suspense fallback={<Fallback />}>
          <MapGlobe trips={trips} onSelect={setSelected} onInteracting={setInteracting} paused={selected !== null} />
        </Suspense>
      </div>

      {/* darkening scrim — fades away while you explore the map */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-[#06060a]/92 via-[#06060a]/45 to-transparent pointer-events-none transition-opacity duration-700 ${heroHidden ?'opacity-0' : 'opacity-100'}`}
      />

      {/* hero copy — smart-hides while interacting, returns when idle */}
      <div
        className={`relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center pointer-events-none transition-all duration-500 ${heroHidden ?'opacity-0 -translate-y-1' : 'opacity-100'}`}
      >
        <div className="max-w-[620px]">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.05] drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">
            {t('home.globe.title')}
          </h1>
          <p className="mt-5 text-lg text-white/85 max-w-md drop-shadow-[0_1px_10px_rgba(0,0,0,0.75)]">
            {t('home.globe.subtitle')}
          </p>
          <a
            href={APP_STORE_URL}
            className="pointer-events-auto mt-8 inline-flex w-max items-center gap-2 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] px-6 py-3 font-bold text-[#1a1209] shadow-lg"
          >
            {t('home.globe.cta')}
          </a>
          {stats && (
            <div className="mt-6 flex gap-5 text-sm text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
              <span><b className="text-[#FFB000]">{stats.trips}</b> {statWord('stat_trips', stats.trips)}</span>
              <span><b className="text-[#FFB000]">{stats.cities}</b> {statWord('stat_cities', stats.cities)}</span>
            </div>
          )}
          <p className="globe-hint mt-8 text-xs uppercase tracking-[0.15em] text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
            {t('home.globe.hint')}
          </p>
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
