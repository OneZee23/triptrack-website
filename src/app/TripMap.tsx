import { useMemo } from 'react';
import TripsMap from './TripsMap';

const NO_CHECKPOINTS: [] = [];
const ignoreSelection = () => {};

/** The standalone trip page uses the same map lifecycle, loading and error
 * handling as the explorer. It has no card over the map, so all four edges
 * keep the same padding. On a phone one finger still scrolls the page. */
export default function TripMap({ coords }: { coords: [number, number][] }) {
  const routes = useMemo(() => [{ id: 'trip', coords }], [coords]);
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-black/5" style={{ height: 'clamp(260px, 55svh, 480px)' }}>
      <TripsMap routes={routes} selectedId="trip" selectedCoords={coords}
        checkpoints={NO_CHECKPOINTS} focusedCheckpointId={null} onSelect={ignoreSelection}
        fitRequest={0} padding={48} cooperativeGestures />
    </div>
  );
}
