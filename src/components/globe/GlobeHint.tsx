import { forwardRef } from 'react';
import { RotateCw, ZoomIn } from 'lucide-react';

/**
 * Small, unobtrusive "you can rotate / zoom" cue shown over the globe while idle.
 * Purely presentational + `pointer-events: none`; MapGlobe anchors it to the
 * globe's screen center and fades it out on the first interaction.
 */
export const GlobeHint = forwardRef<HTMLDivElement>(function GlobeHint(_props, ref) {
  return (
    <div ref={ref} className="globe-hint-overlay" aria-hidden>
      <div className="globe-hint-chip">
        <RotateCw className="ghint-rock" size={17} strokeWidth={2.2} />
        <span className="ghint-divider" />
        <ZoomIn size={17} strokeWidth={2.2} />
      </div>
    </div>
  );
});
