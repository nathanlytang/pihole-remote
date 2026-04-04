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

export interface StorageData {
  piholes: PiholeConfig[];
}
