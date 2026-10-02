/** Probe only after the visitor requests the globe. Release the temporary
 * context immediately; the real map will allocate its own canvas. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!context) return false;
    context.getExtension?.('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** The one place the reduced-motion query is spelled out. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
