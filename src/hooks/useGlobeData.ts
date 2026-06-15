import { useEffect, useState } from 'react';
import type { GlobeData } from '../components/globe/types';

export type GlobeDataState =
  | { status: 'loading' }
  | { status: 'success'; data: GlobeData }
  | { status: 'empty' }
  | { status: 'error' };

const ENDPOINT = '/api/globe';

function isValid(d: unknown): d is GlobeData {
  return !!d && typeof d === 'object' && 'stats' in d && Array.isArray((d as GlobeData).trips);
}

export function useGlobeData(): GlobeDataState {
  const [state, setState] = useState<GlobeDataState>({ status: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    // Guard against a hung request (RU users have hit relay timeouts): abort
    // after 8s and surface an error instead of spinning on 'loading' forever.
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, 8000);
    fetch(ENDPOINT, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: unknown) => {
        if (!isValid(d)) return setState({ status: 'error' });
        setState(d.trips.length ? { status: 'success', data: d } : { status: 'empty' });
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') {
          if (timedOut) setState({ status: 'error' });
          return;
        }
        setState({ status: 'error' });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      ctrl.abort();
    };
  }, []);

  return state;
}
