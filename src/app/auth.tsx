import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getSession, logout, onSessionChange } from './api';
import { resumeAnalytics } from './analytics';
import { AuthContext } from './authContext';
import type { Session } from './storage';

/** Holds the session for the whole `/app` section.
 *
 *  It subscribes to the API client rather than owning the truth, because a
 *  session can also end deep inside a fetch (refresh refused) — the screen
 *  has to follow that, not find out on the next click. */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Read straight out of storage on the first render: it is synchronous,
  // so there is no "checking…" state to flash and no effect that would
  // bounce a signed-in person to the login screen for one frame.
  const [session, setSession] = useState<Session | null>(getSession);

  useEffect(() => onSessionChange(setSession), []);

  const signedIn = useCallback((next: Session) => setSession(next), []);

  const signOut = useCallback(async () => {
    await logout();
    // Tracking was suppressed for as long as this browser had a session;
    // giving it up gives analytics back (see analytics.ts).
    resumeAnalytics();
  }, []);

  const value = useMemo(
    () => ({ session, signedIn, signOut }),
    [session, signedIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
