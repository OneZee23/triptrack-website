import { useEffect, useState } from 'react';
import { routingCapabilities, type RoutingCapabilities } from './manualApi';

/** Capability failures and older APIs keep manual creation closed. This check
 * is independent of reading already synced trips and is never cached. */
export function useManualTripCapabilities() {
  const [state, setState] = useState<{ loading: boolean; capabilities: RoutingCapabilities | null }>({ loading: true, capabilities: null });
  useEffect(() => {
    let current = true;
    void routingCapabilities().then(
      (capabilities) => { if (current) setState({ loading: false, capabilities }); },
      () => { if (current) setState({ loading: false, capabilities: null }); },
    );
    return () => { current = false; };
  }, []);
  return state;
}
