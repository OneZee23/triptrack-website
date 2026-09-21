import { AnimatePresence, motion } from 'motion/react';
import { TripCard } from './TripCard';
import type { GlobeTrip } from './types';

/**
 * The scrim and the card that open when a route on the globe is tapped —
 * and the only thing on the home page that imports `motion`.
 *
 * It lives in its own module so it can be loaded lazily, which is the whole
 * point: `motion` is 120 kB (39 kB over the wire), the card cannot be opened
 * until the interactive globe is on screen, and on a phone the globe is not
 * loaded until somebody asks for it. Before this split, every phone paid for
 * an animation library it had no way to reach.
 *
 * GlobeHero keeps this mounted once it has been opened once, with `trip` going
 * back to null on close, so `AnimatePresence` still has something to animate
 * OUT of. Unmounting the layer instead would make the card vanish.
 */
export default function TripCardLayer({ trip, onClose }: { trip: GlobeTrip | null; onClose: () => void }) {
  return (
    <>
      <AnimatePresence>
        {trip && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-[15] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {trip && (
          <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-6">
            <div className="pointer-events-auto w-full max-w-[360px]">
              <TripCard trip={trip} onClose={onClose} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
