import type { PiholeSession, BlockingStatus, StatsSummary, VersionInfo } from './types';

function buildUrl(address: string, path: string): string {
  const base = address.replace(/\/+$/, '');
  return new URL(`${base}/api${path}`).toString();
}

function authHeaders(session: PiholeSession): Record<string, string> {
  return {
    'X-FTL-SID': session.sid,
    'X-FTL-CSRF': session.csrf,
  };
}

export async function authenticate(
  address: string,
  apiKey: string
): Promise<PiholeSession> {
  const res = await fetch(buildUrl(address, '/auth'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: apiKey }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      data?.error?.message || `Authentication failed (${res.status})`
    );
  }

  const data = await res.json();
  const session = data.session;

  if (!session?.valid) {
    throw new Error(session?.message || 'Authentication failed');
  }

  return {
    sid: session.sid ?? '',
    csrf: session.csrf ?? '',
    validity: session.validity ?? 300,
  };
}

export async function getBlockingStatus(
  address: string,
  session: PiholeSession
): Promise<BlockingStatus> {
  const res = await fetch(buildUrl(address, '/dns/blocking'), {
    headers: authHeaders(session),
  });

  if (!res.ok) {
    throw new Error(`Failed to get blocking status (${res.status})`);
  }

  const data = await res.json();
  return {
    blocking: data.blocking ?? 'unknown',
    timer: data.timer ?? null,
  };
}

export async function setBlocking(
  address: string,
  session: PiholeSession,
  blocking: boolean,
  timer?: number
): Promise<BlockingStatus> {
  const body: { blocking: boolean; timer?: number | null } = { blocking };
  if (timer && timer > 0) {
    body.timer = timer;
  } else {
    body.timer = null;
  }

  const res = await fetch(buildUrl(address, '/dns/blocking'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(session),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to set blocking status (${res.status})`);
  }

  const data = await res.json();
  return {
    blocking: data.blocking ?? 'unknown',
    timer: data.timer ?? null,
  };
}

export async function getStatsSummary(
  address: string,
  session: PiholeSession
): Promise<StatsSummary> {
  const res = await fetch(buildUrl(address, '/stats/summary'), {
    headers: authHeaders(session),
  });

  if (!res.ok) {
    throw new Error(`Failed to get stats (${res.status})`);
  }

  const data = await res.json();
  return {
    queries: {
      total: data.queries?.total ?? 0,
      blocked: data.queries?.blocked ?? 0,
      percent_blocked: data.queries?.percent_blocked ?? 0,
    },
  };
}

export async function getVersion(
  address: string,
  session: PiholeSession
): Promise<VersionInfo> {
  const res = await fetch(buildUrl(address, '/info/version'), {
    headers: authHeaders(session),
  });

  if (!res.ok) {
    throw new Error(`Failed to get version info (${res.status})`);
  }

  return await res.json();
}

export async function testConnection(
  address: string,
  apiKey: string
): Promise<{ success: boolean; version?: VersionInfo; error?: string }> {
  try {
    const session = await authenticate(address, apiKey);
    const version = await getVersion(address, session);
    return { success: true, version };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}
