import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Send, ChevronDown, Globe2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGlobeData } from '../../hooks/useGlobeData';
import { useMounted } from '../../lib/useMounted';
import { trackEvent } from '../../lib/analytics';
import { StarField } from './StarField';
import { GlobeBoundary } from './GlobeBoundary';
import { GlobePoster } from './GlobePoster';
import { isWebGLAvailable } from './webgl';
import type { GlobeTrip } from './types';

const MapGlobe = lazy(() => import('./MapGlobe'));
// `motion` and the card's own mini-map live behind this import; see the note
// in TripCardLayer for why the hero does not pay for them up front.
const TripCardLayer = lazy(() => import('./TripCardLayer'));
const APP_STORE_URL = 'https://apps.apple.com/us/app/triptrack-road-journal/id6760650361';

/** The lightweight globe is ready in HTML. Interactive tiles load only on request,
 * on desktop as well as mobile, so browsing the page never starts WebGL work. */
export default function GlobeHero() {
  const { t, lang } = useTranslation();
  // WebGL and a randomly-seeded starfield cannot exist in prerendered HTML:
  // the globe needs a canvas and the stars would differ between the build and
  // the browser. Both wait for mount, so the markup the crawler reads and the
  // markup React hydrates are the same — a dark hero with the copy in it.
  const mounted = useMounted();
  const state = useGlobeData();
  const [selected, setSelected] = useState<GlobeTrip | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [asked, setAsked] = useState(false);
  const [broke, setBroke] = useState(false);
  const [mapPainted, setMapPainted] = useState(false);
  const globe: 'poster' | 'live' | 'off' = broke ? 'off' : asked ? 'live' : 'poster';
  const sectionRef = useRef<HTMLElement>(null);

  // Latched, never cleared: the layer stays mounted after the first open so
  // that closing the card is an exit animation rather than a disappearance.
  const [cardUsed, setCardUsed] = useState(false);

  const handleSelect = useCallback((trip: GlobeTrip) => {
    trackEvent('trip-card-open', { id: trip.id, title: trip.title ?? trip.region ?? '' });
    setCardUsed(true);
    setSelected(trip);
  }, []);

  const trips = state.status === 'success' ? state.data.trips : [];
  const stats = state.status === 'success' ? state.data.stats : null;

  const statWord = (base: string, n: number) => t(`home.globe.${base}_${new Intl.PluralRules(lang).select(n)}`);

  const showMap = mounted && globe === 'live';
  // With no map on screen the copy and the globe get a row each instead of
  // sharing the screen — on a phone that is the difference between a hero and
  // two things printed on top of one another.
  const stacked = !showMap;

  const spin = useCallback(() => {
    trackEvent('globe-spin');
    if (!isWebGLAvailable()) {
      setBroke(true);
      return;
    }
    setAsked(true);
  }, []);

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
  const heroHidden = showMap && (interacting || selected !== null);

  const poster = (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
      <GlobePoster trips={trips} label={lang === 'ru' ? 'Глобус с маршрутами поездок' : 'Globe with recorded road trips'} className="h-full w-full max-h-[min(100%,560px)] max-w-[min(100%,560px)]" />
    </div>
  );

  return (
    <section
      ref={sectionRef}
      // -mt cancels the safe-area padding <main> adds: the hero is the one
      // section that is SUPPOSED to run up under the header.
      className={`relative -mt-[env(safe-area-inset-top,0px)] w-full overflow-hidden text-white ${
        stacked ? 'flex min-h-[560px] flex-col md:h-[100svh] md:min-h-[640px]' : 'h-[88svh] min-h-[560px] md:h-[100svh]'
      }`}
      style={{ background: 'radial-gradient(circle at 60% 42%, #16284d 0%, #0a1126 42%, #05060c 80%)' }}
    >
      {/* animated deep-space backdrop (shows through the transparent space around the globe) */}
      {mounted && (
        <>
          <StarField />
          <div className="globe-orb pointer-events-none" aria-hidden />
          <div className="globe-orb-2 pointer-events-none" aria-hidden />
          <div className="globe-shoot pointer-events-none" style={{ top: '16%', left: '6%' }} aria-hidden />
        </>
      )}

      {/* The interactive map is full-bleed under the copy; the poster is not —
          it lives in the row the stacked layout gives it, below the text. */}
      {/* The poster stays underneath until the map has a style and its routes
          on it. MapLibre's canvas is transparent until then, and without this
          the hero went poster → empty gradient → globe. */}
      {showMap && !mapPainted && <div className="absolute inset-0">{poster}</div>}
      {showMap && (
        <div className="absolute inset-0">
          <GlobeBoundary onFailed={() => setBroke(true)}>
            <Suspense fallback={null}>
              <MapGlobe
                trips={trips}
                onSelect={handleSelect}
                onInteracting={setInteracting}
                paused={selected !== null}
                onFailed={() => setBroke(true)}
                onReady={() => setMapPainted(true)}
              />
            </Suspense>
          </GlobeBoundary>
        </div>
      )}

      {/* left scrim for text readability — only under the full-bleed map */}
      {showMap && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-[#06060a]/92 via-[#06060a]/45 to-transparent pointer-events-none transition-opacity duration-700 ${heroHidden ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* hero copy — smart-hides while interacting / card open */}
      <div
        className={`relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 pointer-events-none transition-all duration-500 sm:px-6 ${
          stacked ? 'pt-[calc(6rem+env(safe-area-inset-top,0px))] pb-6 md:h-full md:justify-center md:py-0' : 'h-full justify-center'
        } ${heroHidden ? 'opacity-0 -translate-y-1' : 'opacity-100'}`}
      >
        <div className="max-w-[620px]">
          <h1 className="text-[34px] sm:text-4xl md:text-6xl font-extrabold leading-[1.06] drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">
            {t('home.globe.title')}
          </h1>
          <p className="mt-4 text-[17px] sm:text-lg text-white/85 max-w-md drop-shadow-[0_1px_10px_rgba(0,0,0,0.75)] md:mt-5">
            {t('home.globe.subtitle')}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 md:mt-8">
            <a
              href={APP_STORE_URL}
              data-umami-event="appstore-click"
              data-umami-event-source="hero"
              className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FFB000] px-6 py-3 text-[16px] font-bold text-[#1a1209] shadow-lg"
            >
              {t('home.globe.cta')}
            </a>
            {/* Opt in to map downloads and animation on every device. */}
            {globe === 'poster' && (
              <button
                type="button"
                onClick={spin}
                title={t('home.globe.spin_note')}
                className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Globe2 aria-hidden size={17} />
                {t('home.globe.spin')}
              </button>
            )}
          </div>
          {/* The row is on the page from the first frame even when the numbers
              are not. They arrive with `/api/globe` about two seconds in, and
              inserting a line of text at that point pushed everything below it
              down — it was the whole of the home page's layout shift. */}
          <div className="mt-6 flex min-h-[20px] gap-5 text-sm text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            {stats && (
              <>
                <span><b className="text-[#FFB000]">{stats.trips}</b> {statWord('stat_trips', stats.trips)}</span>
                <span><b className="text-[#FFB000]">{stats.cities}</b> {statWord('stat_cities', stats.cities)}</span>
              </>
            )}
          </div>
          {/* «Drag · zoom · tap a trip» describes the live map. With the poster
              on screen there is nothing to drag, and the line used to sit over
              the hero telling people to do something impossible. */}
          {showMap && !mapPainted && (
            <p role="status" className="mt-6 text-sm text-white/80">
              {lang === 'ru' ? 'Загружаем интерактивный глобус…' : 'Loading the interactive globe…'}
            </p>
          )}
          {showMap && mapPainted && (
            <p className="globe-hint mt-8 text-[12px] uppercase tracking-[0.15em] text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              {t('home.globe.hint')}
            </p>
          )}
          {globe === 'off' && (
            <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-white/60 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              {t('home.globe.no_webgl')}
            </p>
          )}
          <a
            href="https://t.me/onezee123"
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="telegram-click"
            className="pointer-events-auto mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[13px] text-white/60 transition-colors hover:text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]"
          >
            <Send aria-hidden size={12} />
            {t('home.globe.join_cta')}
          </a>
        </div>
      </div>

      {/* The poster's own row. It grows into whatever the copy leaves, which is
          why the copy can never be painted over on a narrow screen. On a wide
          one it takes the right half, where the map would have been. */}
      {stacked && (
        <div className="relative z-0 min-h-[200px] flex-1 md:absolute md:inset-y-0 md:left-1/2 md:right-0 md:flex-none">
          {poster}
        </div>
      )}

      {/* focus scrim + trip card (card opens on the LEFT, where the text was) */}
      {cardUsed && (
        <Suspense fallback={null}>
          <TripCardLayer trip={selected} onClose={() => setSelected(null)} />
        </Suspense>
      )}

      {/* mobile: the live globe takes one-finger gestures, so give an explicit
          way to scroll past the hero. The poster does not take them — there is
          nothing to escape — so the button only exists alongside the map. */}
      {showMap && !selected && (
        <button
          type="button"
          onClick={() => {
            const el = sectionRef.current;
            if (el) window.scrollTo({ top: el.offsetHeight, behavior: 'smooth' });
          }}
          aria-label={t('home.globe.scroll')}
          className="pointer-events-auto absolute bottom-5 left-1/2 z-20 grid h-[44px] w-[44px] -translate-x-1/2 place-items-center rounded-full bg-black/35 text-white/90 ring-1 ring-white/15 backdrop-blur-md md:hidden"
        >
          <ChevronDown aria-hidden size={22} className="animate-bounce" />
        </button>
      )}
    </section>
  );
}
