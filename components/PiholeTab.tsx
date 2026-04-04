import { useState } from 'react';
import type { BlockingStatus, StatsSummary } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface PiholeTabProps {
  blocking: BlockingStatus | null;
  stats: StatsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  toggleBlocking: (enabled: boolean, timer?: number) => Promise<void>;
}

export function PiholeTab({ blocking, stats, loading, error, refresh, toggleBlocking }: PiholeTabProps) {
  const [timer, setTimer] = useState(0);

  const isEnabled = blocking?.blocking === 'enabled';
  const hasData = blocking !== null;

  const handleToggle = async (enabled: boolean) => {
    await toggleBlocking(enabled, timer > 0 ? timer : undefined);
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
              {blocking?.timer != null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(blocking.timer)}s remaining
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

      {/* Timer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium shrink-0">Timer (s):</label>
            <Input
              type="number"
              min={0}
              value={timer}
              onChange={(e) => setTimer(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-8 w-24"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">
              {timer === 0 ? 'Permanent' : `Auto-reenable in ${timer}s`}
            </span>
          </div>
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
