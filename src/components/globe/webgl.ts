import { useSyncExternalStore } from 'react';

/**
 * Can this browser give MapLibre a canvas at all?
 *
 * Asked by GlobeHero BEFORE it mounts the map, not by the map after it fails:
 * the hero lays itself out differently when there will be no globe (the copy
 * and the poster get their own rows instead of sharing the screen), and a
 * layout cannot be decided by something that has already been painted over
 * the text. Creates a throwaway canvas and never touches the document.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

/** The one place the reduced-motion query is spelled out. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * What this browser should do about the globe, decided once per page load.
 *
 *   'off'    — no WebGL: the poster is the hero, permanently.
 *   'auto'   — a desktop that can take the map: fetch it when idle.
 *   'manual' — a phone, or a visitor who asked for reduced motion: poster
 *              plus a button, and the 1 MB map only if it is pressed.
 *
 * Read through `useSyncExternalStore` for the same reason `useMounted` is:
 * the answer does not exist while the page is being prerendered, and a plain
 * `typeof window` check would render one hero in the build and a different
 * one on the first client render — a hydration mismatch dressed up as a
 * capability check. The store never notifies; the value is settled by the
 * time the first effect runs and nothing can change it afterwards.
 */
export type GlobePlan = 'off' | 'auto' | 'manual';

let cached: GlobePlan | null = null;

function clientPlan(): GlobePlan {
  if (cached) return cached;
  if (!isWebGLAvailable()) cached = 'off';
  else if (prefersReducedMotion()) cached = 'manual';
  else if (window.matchMedia?.('(min-width: 768px)').matches && window.matchMedia?.('(pointer: fine)').matches) cached = 'auto';
  else cached = 'manual';
  return cached;
}

const neverChanges = () => () => {};
const serverPlan = (): GlobePlan => 'manual';

export function useGlobePlan(): GlobePlan {
  return useSyncExternalStore(neverChanges, clientPlan, serverPlan);
}
