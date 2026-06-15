import { forwardRef } from 'react';

/**
 * Onboarding affordance for the globe: translucent "you can rotate / zoom" cues
 * drawn around the globe. Purely presentational and `pointer-events: none` — it
 * must never block dragging or clicking the globe. MapGlobe anchors it to the
 * globe's screen center and fades it in/out (it disappears on first interaction).
 */
export const GlobeHint = forwardRef<HTMLDivElement>(function GlobeHint(_props, ref) {
  return (
    <div ref={ref} className="globe-hint-overlay" aria-hidden>
      {/* rotate cue — two curved arrows hugging the globe, gently rocking */}
      <div className="ghint-rot">
        <svg viewBox="0 0 220 220" width="100%" height="100%" fill="none">
          <defs>
            <marker id="ghint-ah" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="rgba(255,255,255,0.92)" />
            </marker>
          </defs>
          <circle cx="110" cy="110" r="96" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" />
          <g className="ghint-pulse" stroke="rgba(255,255,255,0.78)" strokeWidth="3" strokeLinecap="round">
            <path d="M188.6 55 A96 96 0 0 1 188.6 165.1" markerEnd="url(#ghint-ah)" />
            <path d="M31.4 165.1 A96 96 0 0 1 31.4 55" markerEnd="url(#ghint-ah)" />
          </g>
        </svg>
      </div>
      {/* zoom cue — small magnifier, gently breathing */}
      <svg className="ghint-zoom" viewBox="0 0 220 220" width="100%" height="100%" fill="none">
        <g stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="110" cy="167" r="11" />
          <line x1="104" y1="167" x2="116" y2="167" />
          <line x1="110" y1="161" x2="110" y2="173" />
          <line x1="118.8" y1="175.8" x2="127" y2="184" />
        </g>
      </svg>
    </div>
  );
});
