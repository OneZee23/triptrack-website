import { useEffect } from 'react';

/** `/app` is a private section: it must never be indexed, and the robots
 *  line has to exist in the live DOM as well as in robots.txt, because the
 *  section is reachable from the marketing header. Added on mount and taken
 *  away on leave, so the marketing pages keep their own meta. */
export function useNoIndex(): void {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    meta.setAttribute('content', 'noindex, nofollow');
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}
