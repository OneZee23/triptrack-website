import { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Send } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGlobeData } from '../../hooks/useGlobeData';
import { TripCard } from './TripCard';
import { StarField } from './StarField';
import type { GlobeTrip } from './types';

const MapGlobe = lazy(() => import('./MapGlobe'));
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

const Fallback = () => (
  <div
    aria-hidden
    className="absolute inset-0"
    style={{ background: 'radial-gradient(circle at 60% 42%, #16284d 0%, #0a1126 42%, #05060c 80%)' }}
  />
);

export default function GlobeHero() {
  const { t, lang } = useTranslation();
  const state = useGlobeData();
  const [selected, setSelected] = useState<GlobeTrip | null>(null);
  const [interacting, setInteracting] = useState(false);

  const trips = state.status === 'success' ? state.data.trips : [];
  const stats = state.status === 'success' ? state.data.stats : null;

  const statWord = (base: string, n: number) => t(`home.globe.${base}_${new Intl.PluralRules(lang).select(n)}`);

  // close the trip card when the user scrolls the page (avoids the card sticking
  // over the hero as it scrolls away).
  useEffect(() => {
    if (!selected) return;
    const close = () => setSelected(null);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 6) close();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('touchmove', close, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', close);
      window.removeEventListener('touchmove', close);
    };
  }, [selected]);

  // hide the hero copy while exploring the map OR while a card is open.
  const heroHidden = interacting || selected !== null;

  return (
    <section
      className="relative w-full h-[100svh] min-h-[600px] overflow-hidden text-white"
      style={{ background: 'radial-gradient(circle at 60% 42%, #16284d 0%, #0a1126 42%, #05060c 80%)' }}
    >
      {/* animated deep-space backdrop (shows through the transparent space around the globe) */}
      <StarField />
      <div className="globe-orb pointer-events-none" aria-hidden />
      <div className="globe-orb-2 pointer-events-none" aria-hidden />
      <div className="globe-shoot pointer-events-none" style={{ top: '16%', left: '6%' }} aria-hidden />

      <div className="absolute inset-0">
        <Suspense fallback={<Fallback />}>
          <MapGlobe trips={trips} onSelect={setSelected} onInteracting={setInteracting} paused={selected !== null} />
        </Suspense>
      </div>

      {/* left scrim for text readability — fades while interacting / card open */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-[#06060a]/92 via-[#06060a]/45 to-transparent pointer-events-none transition-opacity duration-700 ${heroHidden ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* hero copy — smart-hides while interacting / card open */}
      <div
        className={`relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center pointer-events-none transition-all duration-500 ${heroHidden ? 'opacity-0 -translate-y-1' : 'opacity-100'}`}
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
          <a
            href="https://t.me/onezee123"
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto mt-5 inline-flex items-center gap-1.5 text-xs text-white/45 transition-colors hover:text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
          >
            <Send size={12} />
            {t('home.globe.join_cta')}
          </a>
        </div>
      </div>

      {/* focus scrim + trip card (card opens on the LEFT, where the text was) */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-[15] bg-black/55 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex h-full max-w-7xl items-center px-6">
            <div className="pointer-events-auto w-full max-w-[360px]">
              <TripCard trip={selected} onClose={() => setSelected(null)} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
