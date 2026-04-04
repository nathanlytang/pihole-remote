import { useState, useEffect, useRef } from 'react';
import type { BlockingStatus, StatsSummary, TimerPreset, TimerSetting } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const PRESETS: { value: TimerPreset; label: string }[] = [
  { value: 0, label: '∞' },
  { value: 10, label: '10s' },
  { value: 60, label: '1m' },
  { value: 600, label: '10m' },
  { value: 3600, label: '1h' },
  { value: 'custom', label: 'Custom' },
];

interface PiholeTabProps {
  blocking: BlockingStatus | null;
  stats: StatsSummary | null;
  loading: boolean;
  error: string | null;
  timerSetting: TimerSetting;
  onTimerSettingChange: (setting: TimerSetting) => void;
  refresh: () => void;
  toggleBlocking: (enabled: boolean, timer?: number) => Promise<void>;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function PiholeTab({ blocking, stats, loading, error, timerSetting, onTimerSettingChange, refresh, toggleBlocking }: PiholeTabProps) {
  const isEnabled = blocking?.blocking === 'enabled';
  const hasData = blocking !== null;

  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (!isEnabled && blocking?.timer != null && blocking.timer > 0) {
      setCountdown(Math.round(blocking.timer));
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            refresh();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [blocking?.timer, isEnabled, refresh]);

  const activePreset = timerSetting.customSeconds > 0 ? 'custom' : timerSetting.preset;

  const getTimerSeconds = (): number => {
    if (activePreset === 'custom') return timerSetting.customSeconds;
    if (typeof timerSetting.preset === 'number') return timerSetting.preset;
    return 0;
  };

  const handleToggle = async (enabled: boolean) => {
    const seconds = getTimerSeconds();
    await toggleBlocking(enabled, seconds > 0 ? seconds : undefined);
  };

  const handlePresetClick = (preset: TimerPreset) => {
    if (preset === 'custom') {
      onTimerSettingChange({ preset: 'custom', customSeconds: timerSetting.customSeconds || 30 });
    } else {
      onTimerSettingChange({ preset, customSeconds: 0 });
    }
  };

  const handleCustomChange = (value: string) => {
    const seconds = Math.max(0, parseInt(value) || 0);
    onTimerSettingChange({ preset: 'custom', customSeconds: seconds });
  };

  if (error && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Retry'}
        </Button>
      </div>
    );
  }

  if (!hasData && loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status & Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isEnabled ? 'success' : 'danger'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {countdown != null && countdown > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatCountdown(countdown)} remaining
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer Presets */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <label className="text-sm font-medium">Re-enable after:</label>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {PRESETS.map((p) => (
              <Button
                key={String(p.value)}
                variant={activePreset === p.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => handlePresetClick(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {activePreset === 'custom' && (
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                min={1}
                value={timerSetting.customSeconds || ''}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="h-7 w-24 text-xs"
                placeholder="seconds"
              />
              <span className="text-xs text-muted-foreground">seconds</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{stats.queries.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Queries</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-500">
                  {stats.queries.blocked.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {stats.queries.percent_blocked.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Blocked %</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && hasData && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
