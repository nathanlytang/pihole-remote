import { useState, useEffect, useCallback, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useTheme } from '@/hooks/useTheme';
import { usePiholeStatus } from '@/hooks/usePiholeStatus';
import type { PiholeConfig, TimerSetting } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PiholeTab } from '@/components/PiholeTab';
import { PiholeLogo } from '@/components/PiholeLogo';
import { Settings } from 'lucide-react';

interface PanelControls {
  toggle: (enabled: boolean, timer?: number) => Promise<void>;
  refresh: () => void;
}

function PiholePanelWrapper({
  config,
  timerSetting,
  onTimerSettingChange,
  onStatusChange,
  onControlsRef,
}: {
  config: PiholeConfig;
  timerSetting: TimerSetting;
  onTimerSettingChange: (setting: TimerSetting) => void;
  onStatusChange: (enabled: boolean) => void;
  onControlsRef: (controls: PanelControls) => void;
}) {
  const status = usePiholeStatus(config);
  const isEnabled = status.blocking?.blocking === 'enabled';

  useEffect(() => {
    if (status.blocking) {
      onStatusChange(isEnabled);
    }
  }, [isEnabled, status.blocking, onStatusChange]);

  useEffect(() => {
    onControlsRef({ toggle: status.toggleBlocking, refresh: status.refresh });
  }, [status.toggleBlocking, status.refresh, onControlsRef]);

  return (
    <PiholeTab
      blocking={status.blocking}
      stats={status.stats}
      loading={status.loading}
      error={status.error}
      timerSetting={timerSetting}
      onTimerSettingChange={onTimerSettingChange}
      refresh={status.refresh}
      toggleBlocking={status.toggleBlocking}
    />
  );
}

export default function App() {
  const { piholes, theme, timerSetting, loading, savePiholes, saveTheme, saveTimerSetting } = useStorage();
  useTheme(theme);
  const [activeTab, setActiveTab] = useState('0');
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [togglingAll, setTogglingAll] = useState(false);
  const controlsRefs = useRef<Record<number, PanelControls>>({});

  const handleOpenOptions = () => {
    browser.runtime.openOptionsPage();
  };

  const handleStatusChange = useCallback(
    (index: number) => (enabled: boolean) => {
      setStatuses((prev) => {
        if (prev[index] === enabled) return prev;
        return { ...prev, [index]: enabled };
      });
    },
    []
  );

  const handleControlsRef = useCallback(
    (index: number) => (controls: PanelControls) => {
      controlsRefs.current[index] = controls;
    },
    []
  );

  const allEnabled = piholes.length > 0 && piholes.every((_, i) => statuses[i] !== false);

  const getTimerSeconds = (): number => {
    if (timerSetting.customSeconds > 0) return timerSetting.customSeconds;
    if (typeof timerSetting.preset === 'number') return timerSetting.preset;
    return 0;
  };

  const handleDisableAll = async (enabled: boolean) => {
    setTogglingAll(true);
    try {
      const seconds = getTimerSeconds();
      await Promise.all(
        piholes.map((_, i) => controlsRefs.current[i]?.toggle(enabled, seconds > 0 ? seconds : undefined))
      );
      // Refresh all panels to sync statuses
      piholes.forEach((_, i) => controlsRefs.current[i]?.refresh());
    } finally {
      setTogglingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="w-[360px] p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (piholes.length === 0) {
    return (
      <div className="w-[360px] p-6 flex flex-col items-center gap-4">
        <PiholeLogo enabled={false} className="h-12 w-12" />
        <p className="text-sm text-muted-foreground text-center">
          No Pi-holes configured. Add one in settings.
        </p>
        <Button onClick={handleOpenOptions} size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Open Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="w-[360px] p-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <Switch
            checked={allEnabled}
            onCheckedChange={handleDisableAll}
            disabled={togglingAll}
          />
          <span className="text-sm font-medium">
            {allEnabled ? 'All Enabled' : 'Disabled'}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleOpenOptions} className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          {piholes.map((ph, i) => (
            <TabsTrigger key={i} value={String(i)}>
              <PiholeLogo
                enabled={statuses[i] ?? true}
                className="h-4 w-4 mr-1.5"
              />
              {ph.name || `Pi-hole ${i + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>

        {piholes.map((ph, i) => (
          <div key={i} className={activeTab === String(i) ? '' : 'hidden'}>
            <PiholePanelWrapper
              config={ph}
              timerSetting={timerSetting}
              onTimerSettingChange={saveTimerSetting}
              onStatusChange={handleStatusChange(i)}
              onControlsRef={handleControlsRef(i)}
            />
          </div>
        ))}
      </Tabs>
    </div>
  );
}
