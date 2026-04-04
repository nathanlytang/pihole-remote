import { useState } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useTheme } from '@/hooks/useTheme';
import { testConnection } from '@/lib/api';
import { requestHostPermission } from '@/lib/permissions';
import type { PiholeConfig, Theme, VersionInfo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PiholeLogo } from '@/components/PiholeLogo';
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Sun, Moon, Monitor, Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';

interface PiholeFormState {
  config: PiholeConfig;
  testResult: {
    status: 'idle' | 'testing' | 'success' | 'error';
    version?: VersionInfo;
    error?: string;
  };
}

const emptyConfig: PiholeConfig = { name: '', address: '', apiKey: '' };

export default function App() {
  const { piholes, theme, loading, savePiholes, saveTheme } = useStorage();
  useTheme(theme);
  const [forms, setForms] = useState<PiholeFormState[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});

  // Initialize forms from storage once loaded
  if (!loading && !initialized) {
    const initial = piholes.length > 0
      ? piholes.map((config) => ({
          config,
          testResult: { status: 'idle' as const },
        }))
      : [{ config: { ...emptyConfig }, testResult: { status: 'idle' as const } }];
    setForms(initial);
    setInitialized(true);
  }

  const updateForm = (index: number, updates: Partial<PiholeConfig>) => {
    setForms((prev) =>
      prev.map((f, i) =>
        i === index
          ? { ...f, config: { ...f.config, ...updates }, testResult: { status: 'idle' } }
          : f
      )
    );
  };

  const addPihole = () => {
    if (forms.length >= 2) return;
    setForms((prev) => [
      ...prev,
      { config: { ...emptyConfig }, testResult: { status: 'idle' } },
    ]);
  };

  const removePihole = (index: number) => {
    setForms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTest = async (index: number) => {
    const form = forms[index];
    if (!form.config.address || !form.config.apiKey) return;

    const granted = await requestHostPermission(form.config.address);
    if (!granted) {
      setForms((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, testResult: { status: 'error', error: 'Host permission denied. Please allow access to connect.' } }
            : f
        )
      );
      return;
    }

    setForms((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, testResult: { status: 'testing' } } : f
      )
    );

    const result = await testConnection(form.config.address, form.config.apiKey);

    setForms((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              testResult: result.success
                ? { status: 'success', version: result.version }
                : { status: 'error', error: result.error },
            }
          : f
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configs = forms
        .map((f) => f.config)
        .filter((c) => c.address && c.apiKey);
      // Ensure host permissions are granted for all configured Pi-holes
      for (const config of configs) {
        const granted = await requestHostPermission(config.address);
        if (!granted) {
          toast.error(`Permission denied for ${config.address}`, {
            description: 'Please allow access to connect to this Pi-hole.',
          });
          return;
        }
      }
      await savePiholes(configs);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initialized) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Toaster richColors position="top-right" />
      <div className="flex items-center gap-3 mb-6">
        <PiholeLogo enabled={true} className="h-8 w-8" />
        <h1 className="text-2xl font-bold">Pi-hole Remote Settings</h1>
      </div>

      <div className="space-y-4">
        {forms.map((form, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pi-hole {index + 1}</CardTitle>
                {forms.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removePihole(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name (optional)</label>
                <Input
                  placeholder="e.g. Primary Pi-hole"
                  value={form.config.name}
                  onChange={(e) => updateForm(index, { name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="http://192.168.1.2 or https://pi.hole"
                  value={form.config.address}
                  onChange={(e) => updateForm(index, { address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center gap-1">
                  <Input
                    type={showApiKey[index] ? 'text' : 'password'}
                    placeholder="Your Pi-hole password"
                    value={form.config.apiKey}
                    onChange={(e) => updateForm(index, { apiKey: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setShowApiKey((prev) => ({ ...prev, [index]: !prev[index] }))}
                    title={showApiKey[index] ? 'Hide API key' : 'Show API key'}
                    type="button"
                  >
                    {showApiKey[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(index)}
                  disabled={
                    !form.config.address ||
                    !form.config.apiKey ||
                    form.testResult.status === 'testing'
                  }
                >
                  {form.testResult.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Test Connection
                </Button>

                {form.testResult.status === 'success' && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                )}

                {form.testResult.status === 'error' && (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-500">{form.testResult.error}</span>
                  </div>
                )}
              </div>

              {form.testResult.status === 'success' && form.testResult.version && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="secondary">
                    Core: {form.testResult.version.version.core.local.version ?? 'N/A'}
                  </Badge>
                  <Badge variant="secondary">
                    FTL: {form.testResult.version.version.ftl.local.version ?? 'N/A'}
                  </Badge>
                  <Badge variant="secondary">
                    Web: {form.testResult.version.version.web.local.version ?? 'N/A'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={addPihole}
          disabled={forms.length >= 2}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pi-hole
        </Button>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Settings
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => saveTheme(t)}
              >
                {t === 'light' && <Sun className="h-4 w-4 mr-1.5" />}
                {t === 'dark' && <Moon className="h-4 w-4 mr-1.5" />}
                {t === 'system' && <Monitor className="h-4 w-4 mr-1.5" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
