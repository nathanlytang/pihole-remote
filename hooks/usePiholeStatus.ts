import { useState, useEffect, useCallback, useRef } from 'react';
import type { PiholeConfig, PiholeSession, BlockingStatus, StatsSummary } from '@/lib/types';
import { authenticate, getBlockingStatus, getStatsSummary, setBlocking as apiSetBlocking } from '@/lib/api';
import { hasHostPermission } from '@/lib/permissions';

const POLL_INTERVAL = 10_000;

export function usePiholeStatus(config: PiholeConfig | null) {
  const [blocking, setBlockingState] = useState<BlockingStatus | null>(null);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<PiholeSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureSession = useCallback(async (): Promise<PiholeSession> => {
    if (!config) throw new Error('No Pi-hole configured');

    if (sessionRef.current) return sessionRef.current;

    const session = await authenticate(config.address, config.apiKey);
    sessionRef.current = session;
    return session;
  }, [config]);

  const refresh = useCallback(async () => {
    if (!config?.address || !config?.apiKey) return;

    setLoading(true);
    setError(null);

    const permitted = await hasHostPermission(config.address);
    if (!permitted) {
      setError('Host permission not granted. Please re-save settings in the options page.');
      setLoading(false);
      return;
    }

    try {
      const session = await ensureSession();
      const [blockingRes, statsRes] = await Promise.all([
        getBlockingStatus(config.address, session),
        getStatsSummary(config.address, session),
      ]);
      setBlockingState(blockingRes);
      setStats(statsRes);
    } catch {
      // Session may have expired — clear and retry once
      sessionRef.current = null;
      try {
        const session = await ensureSession();
        const [blockingRes, statsRes] = await Promise.all([
          getBlockingStatus(config.address, session),
          getStatsSummary(config.address, session),
        ]);
        setBlockingState(blockingRes);
        setStats(statsRes);
      } catch (retryErr) {
        setError(retryErr instanceof Error ? retryErr.message : 'Connection failed');
      }
    } finally {
      setLoading(false);
    }
  }, [config, ensureSession]);

  const toggleBlocking = useCallback(
    async (enabled: boolean, timer?: number) => {
      if (!config?.address || !config?.apiKey) return;

      setLoading(true);
      setError(null);

      try {
        const session = await ensureSession();
        const result = await apiSetBlocking(config.address, session, enabled, timer);
        setBlockingState(result);
      } catch (err) {
        sessionRef.current = null;
        setError(err instanceof Error ? err.message : 'Failed to toggle blocking');
      } finally {
        setLoading(false);
      }
    },
    [config, ensureSession]
  );

  useEffect(() => {
    sessionRef.current = null;

    if (!config?.address || !config?.apiKey) {
      setBlockingState(null);
      setStats(null);
      setError(null);
      return;
    }

    refresh();

    timerRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [config?.address, config?.apiKey, refresh]);

  return { blocking, stats, loading, error, refresh, toggleBlocking, ensureSession };
}
