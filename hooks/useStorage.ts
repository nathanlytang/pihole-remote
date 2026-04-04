import { useState, useEffect, useCallback } from 'react';
import type { PiholeConfig, StorageData } from '@/lib/types';

const DEFAULT_STORAGE: StorageData = {
  piholes: [],
};

export function useStorage() {
  const [piholes, setPiholes] = useState<PiholeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await browser.storage.local.get('piholes') as Partial<StorageData>;
      setPiholes(data.piholes ?? DEFAULT_STORAGE.piholes);
    } catch {
      setPiholes(DEFAULT_STORAGE.piholes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const listener = (changes: Record<string, Browser.storage.StorageChange>) => {
      if (changes.piholes) {
        setPiholes((changes.piholes.newValue as PiholeConfig[] | undefined) ?? DEFAULT_STORAGE.piholes);
      }
    };

    browser.storage.local.onChanged.addListener(listener);
    return () => browser.storage.local.onChanged.removeListener(listener);
  }, [load]);

  const savePiholes = useCallback(async (configs: PiholeConfig[]) => {
    await browser.storage.local.set({ piholes: configs });
    setPiholes(configs);
  }, []);

  return { piholes, loading, savePiholes, reload: load };
}
