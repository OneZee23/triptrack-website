import { useCallback, useEffect, useRef, useState } from 'react';
import { listTrips, type TripSummary } from './api';
import { codeOf } from './errors';
import { mergeTrips } from './tripExplorer';

const PAGE = 100;

/** Summary pages only. Full GPS tracks are fetched only when selected.
 * Everything stays in this mounted account's memory; cleanup rejects late
 * responses after sign-out. Retrying a failed later page preserves earlier ones. */
export function useTripLibrary() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const offset = useRef(0);

  const load = useCallback(async (restart: boolean) => {
    const run = ++generation.current;
    if (restart) {
      offset.current = 0;
      setTrips([]);
      setTotal(0);
    }
    setLoading(true);
    setError(null);
    try {
      while (run === generation.current) {
        const page = await listTrips(PAGE, offset.current);
        if (run !== generation.current) return;
        setTotal(page.total);
        setTrips((current) => mergeTrips(current, page.trips));
        offset.current += page.trips.length;
        // An empty page also terminates after concurrent deletions on the
        // phone; offset pagination is not a server-side snapshot.
        if (offset.current >= page.total || page.trips.length === 0) break;
      }
    } catch (cause) {
      if (run === generation.current) setError(codeOf(cause) ?? 'UNKNOWN');
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    return () => { generation.current += 1; };
  }, [load]);

  return { trips, total, loading, error, refresh: () => load(true), retry: () => load(false) };
}
