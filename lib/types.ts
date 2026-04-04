export interface PiholeConfig {
  name: string;
  address: string;
  apiKey: string;
}

export interface PiholeSession {
  sid: string;
  csrf: string;
  validity: number;
}

export interface BlockingStatus {
  blocking: 'enabled' | 'disabled' | 'failed' | 'unknown';
  timer: number | null;
}

export interface StatsSummary {
  queries: {
    total: number;
    blocked: number;
    percent_blocked: number;
  };
}

export interface VersionInfo {
  version: {
    core: {
      local: { version: string | null; branch: string | null };
    };
    ftl: {
      local: { version: string | null; branch: string | null };
    };
    web: {
      local: { version: string | null; branch: string | null };
    };
  };
}

export interface PiholeState {
  config: PiholeConfig;
  blocking: BlockingStatus | null;
  stats: StatsSummary | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
}

export type Theme = 'light' | 'dark' | 'system';

export type TimerPreset = 0 | 10 | 60 | 600 | 3600 | 'custom';

export interface TimerSetting {
  preset: TimerPreset;
  customSeconds: number;
}

export interface DomainMatch {
  domain: string;
  type: 'allow' | 'deny';
  kind: 'exact' | 'regex';
  comment: string | null;
  enabled: boolean;
  id: number;
  groups: number[];
}

export interface GravityMatch {
  domain: string;
  address: string;
  type: 'allow' | 'block';
  comment: string | null;
  enabled: boolean;
  id: number;
  groups: number[];
}

export interface DomainSearchResult {
  search: {
    domains: DomainMatch[];
    gravity: GravityMatch[];
    parameters: {
      domain: string;
      N: number;
      partial: boolean;
      debug: boolean;
    };
    results: {
      domains: { exact: number; regex: number };
      gravity: { allow: number; block: number };
      total: number;
    };
  };
}

export interface StorageData {
  piholes: PiholeConfig[];
  theme: Theme;
  timerSetting: TimerSetting;
}
