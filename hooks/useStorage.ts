import { useState, useEffect, useCallback } from 'react';
import type { PiholeConfig, Theme, TimerSetting, StorageData } from '@/lib/types';

const DEFAULT_STORAGE: StorageData = {
  piholes: [],
  theme: 'system',
  timerSetting: { preset: 0, customSeconds: 0 },
};

export function useStorage() {
  const [piholes, setPiholes] = useState<PiholeConfig[]>([]);
  const [theme, setTheme] = useState<Theme>(DEFAULT_STORAGE.theme);
  const [timerSetting, setTimerSetting] = useState<TimerSetting>(DEFAULT_STORAGE.timerSetting);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await browser.storage.local.get(['piholes', 'theme', 'timerSetting']) as Partial<StorageData>;
      setPiholes(data.piholes ?? DEFAULT_STORAGE.piholes);
      setTheme(data.theme ?? DEFAULT_STORAGE.theme);
      setTimerSetting(data.timerSetting ?? DEFAULT_STORAGE.timerSetting);
    } catch {
      setPiholes(DEFAULT_STORAGE.piholes);
      setTheme(DEFAULT_STORAGE.theme);
      setTimerSetting(DEFAULT_STORAGE.timerSetting);
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
      if (changes.theme) {
        setTheme((changes.theme.newValue as Theme | undefined) ?? DEFAULT_STORAGE.theme);
      }
      if (changes.timerSetting) {
        setTimerSetting((changes.timerSetting.newValue as TimerSetting | undefined) ?? DEFAULT_STORAGE.timerSetting);
      }
    };

    browser.storage.local.onChanged.addListener(listener);
    return () => browser.storage.local.onChanged.removeListener(listener);
  }, [load]);

  const savePiholes = useCallback(async (configs: PiholeConfig[]) => {
    await browser.storage.local.set({ piholes: configs });
    setPiholes(configs);
  }, []);

  const saveTheme = useCallback(async (newTheme: Theme) => {
    await browser.storage.local.set({ theme: newTheme });
    setTheme(newTheme);
  }, []);

  const saveTimerSetting = useCallback(async (setting: TimerSetting) => {
    await browser.storage.local.set({ timerSetting: setting });
    setTimerSetting(setting);
  }, []);

  return { piholes, theme, timerSetting, loading, savePiholes, saveTheme, saveTimerSetting, reload: load };
}
