import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Parallax starfield for the globe hero.
 *
 * Each depth layer is a single element whose `box-shadow` paints N randomly
 * positioned dots (so there is NO repeating grid). Movement is a pure CSS
 * `transform: translateY` loop — it runs on the compositor thread, so there is
 * no per-frame JavaScript and no repaint. A `::after` duplicate one viewport
 * below makes the vertical drift seamless. Animations pause when the hero
 * scrolls offscreen and are disabled under prefers-reduced-motion.
 */

type LayerStyle = React.CSSProperties & Record<'--sf' | '--sf-h' | '--sf-dur', string>;

const TINT_WARM = '255,228,196';
const TINT_COOL = '200,220,255';
const TINT_WHITE = '255,255,255';

function buildField(count: number, w: number, h: number): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * w);
    const y = Math.round(Math.random() * h);
    const alpha = (0.45 + Math.random() * 0.55).toFixed(2);
    const r = Math.random();
    const tint = r > 0.93 ? TINT_WARM : r < 0.07 ? TINT_COOL : TINT_WHITE;
    parts.push(`${x}px ${y}px rgba(${tint},${alpha})`);
  }
  return parts.join(', ');
}

export function StarField() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(() => ({
    w: typeof window === 'undefined' ? 1440 : window.innerWidth,
    h: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  const [paused, setPaused] = useState(false);

  // regenerate on meaningful resize only (avoid star "jumps" on tiny changes)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSize((prev) => {
          if (Math.abs(prev.w - window.innerWidth) < 120 && Math.abs(prev.h - window.innerHeight) < 120) return prev;
          return { w: window.innerWidth, h: window.innerHeight };
        });
      }, 250);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // pause the drift while the hero is offscreen — zero cost when not visible
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { w, h } = size;
  const layers = useMemo(() => {
    const area = w * h;
    const far = Math.min(Math.round(area / 8000), 300);
    const mid = Math.min(Math.round(area / 19000), 140);
    const near = Math.min(Math.round(area / 55000), 54);
    return {
      far: buildField(far, w, h),
      mid: buildField(mid, w, h),
      near: buildField(near, w, h),
    };
  }, [w, h]);

  const hPx = `${h}px`;
  const layer = (shadow: string, dur: string): LayerStyle => ({ '--sf': shadow, '--sf-h': hPx, '--sf-dur': dur });

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${paused ? 'sf-paused' : ''}`} aria-hidden>
      <div className="sf-layer sf-far" style={layer(layers.far, '320s')} />
      <div className="sf-layer sf-mid" style={layer(layers.mid, '220s')} />
      <div className="sf-layer sf-near" style={layer(layers.near, '150s')} />
    </div>
  );
}
