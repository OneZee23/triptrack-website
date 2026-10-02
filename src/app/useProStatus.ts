import { useCallback, useEffect, useRef, useState } from 'react';
import { proStatus, type ProStatus } from './manualApi';
import { codeOf } from './errors';

export function useProStatus() {
  const [status, setStatus] = useState<ProStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const lastChecked = useRef(0);
  const cancelPending = useCallback(() => { generation.current += 1; }, []);
  const refresh = useCallback(async () => {
    const run = ++generation.current;
    lastChecked.current = Date.now();
    setLoading(true); setError(null);
    try {
      const result = await proStatus();
      if (run === generation.current) setStatus(result);
    } catch (e: unknown) {
      if (run === generation.current) { setError(codeOf(e) ?? 'UNKNOWN'); setStatus(null); }
    } finally {
      if (run === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const focus = () => { if (Date.now() - lastChecked.current > 30_000) void refresh(); };
    window.addEventListener('focus', focus);
    return () => { cancelPending(); window.removeEventListener('focus', focus); };
  }, [refresh, cancelPending]);
  useEffect(() => {
    if (!status?.active || !status.until) return;
    const remaining = new Date(status.until).getTime() - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = window.setTimeout(() => { void refresh(); }, Math.min(2_147_000_000, Math.max(1_000, remaining + 100)));
    return () => window.clearTimeout(timer);
  }, [status, refresh]);
  return { status, loading, error, refresh };
}
