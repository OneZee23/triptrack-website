import { useSyncExternalStore } from 'react';

/** Nothing ever changes, so the store never notifies. */
const neverChanges = () => () => {};

/**
 * False while the server renders and while React hydrates; true afterwards.
 *
 * Anything that cannot exist in prerendered HTML — WebGL, a randomly seeded
 * starfield, a mouse-following cursor — is gated on this rather than on
 * `typeof window`. A `typeof window` check renders one thing in the build and
 * a different thing on the very first client render, which is exactly the
 * hydration mismatch it looks like it is avoiding.
 *
 * `useSyncExternalStore` is the mechanism rather than `useState` + `useEffect`
 * because React itself uses the server snapshot until hydration finishes: the
 * flag flips once, after the tree is attached, with no cascading render.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}
