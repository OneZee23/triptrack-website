// The desktop-only animated cursor. Pulled out of AppLayout so `motion` isn't
// part of the entry chunk on every route — this is lazy-loaded and purely
// decorative (hidden on touch layouts via `hidden md:flex`).
import { useEffect } from 'react';
import { motion, useMotionValue } from 'motion/react';

export default function CustomCursor({ hoverState }: { hoverState: { text: string; active: boolean } | null }) {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[100] items-center justify-center overflow-hidden hidden md:flex"
      style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
      animate={{
        width: hoverState?.active ? 120 : 20,
        height: hoverState?.active ? 40 : 20,
        backgroundColor: hoverState?.active ? '#1e1e23' : '#EB571E',
        borderRadius: hoverState?.active ? 20 : 10,
        scale: 1
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.span
        className="text-white font-medium text-sm whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: hoverState?.active ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      >
        {hoverState?.text || ''}
      </motion.span>
    </motion.div>
  );
}
