import { useState, useEffect, useCallback } from 'react';
import type { PiholeSession, DomainSearchResult, DomainMatch, GravityMatch } from '@/lib/types';
import { searchDomain, addDomain, removeDomain } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ShieldCheck, ShieldBan, X } from 'lucide-react';

interface DomainControlProps {
  address: string;
  domain: string;
  ensureSession: () => Promise<PiholeSession>;
}

export function DomainControl({ address, domain, ensureSession }: DomainControlProps) {
  const [searchResult, setSearchResult] = useState<DomainSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!domain) return;
    setLoading(true);
    setError(null);
    try {
      const session = await ensureSession();
      const result = await searchDomain(address, session, domain);
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [address, domain, ensureSession]);

  useEffect(() => {
    search();
  }, [search]);

  const handleAdd = async (type: 'allow' | 'deny') => {
    setActing(true);
    setError(null);
    try {
      const session = await ensureSession();
      await addDomain(address, session, domain, type);
      await search();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${type} domain`);
    } finally {
      setActing(false);
    }
  };

  const handleRemove = async (entry: DomainMatch) => {
    setActing(true);
    setError(null);
    try {
      const session = await ensureSession();
      await removeDomain(address, session, entry.domain, entry.type, entry.kind);
      await search();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    } finally {
      setActing(false);
    }
  };

  const domainMatches = searchResult?.search.domains ?? [];
  const gravityMatches = searchResult?.search.gravity ?? [];
  const hasExactAllow = domainMatches.some((d) => d.type === 'allow' && d.kind === 'exact' && d.domain === domain);
  const hasExactDeny = domainMatches.some((d) => d.type === 'deny' && d.kind === 'exact' && d.domain === domain);
  const totalResults = searchResult?.search.results.total ?? 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <label className="text-sm font-medium">Current Domain</label>
            <p className="text-xs text-muted-foreground truncate" title={domain}>
              {domain}
            </p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        {/* Allow / Block buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={hasExactAllow ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleAdd('allow')}
            disabled={acting || hasExactAllow}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {hasExactAllow ? 'Allowed' : 'Allow'}
          </Button>
          <Button
            variant={hasExactDeny ? 'destructive' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleAdd('deny')}
            disabled={acting || hasExactDeny}
          >
            <ShieldBan className="h-3.5 w-3.5" />
            {hasExactDeny ? 'Blocked' : 'Block'}
          </Button>
          {acting && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>

        {/* Existing rules affecting this domain */}
        {totalResults > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Matching rules ({totalResults})
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {domainMatches.map((d) => (
                <DomainRuleRow key={`${d.type}-${d.kind}-${d.domain}`} entry={d} onRemove={handleRemove} acting={acting} />
              ))}
              {gravityMatches.map((g) => (
                <GravityRuleRow key={`gravity-${g.id}`} entry={g} />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}

function DomainRuleRow({
  entry,
  onRemove,
  acting,
}: {
  entry: DomainMatch;
  onRemove: (entry: DomainMatch) => void;
  acting: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Badge
        variant={entry.type === 'allow' ? 'success' : 'danger'}
        className="text-[10px] px-1.5 py-0"
      >
        {entry.type}
      </Badge>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {entry.kind}
      </Badge>
      <span className="truncate min-w-0 text-muted-foreground" title={entry.domain}>
        {entry.domain}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 ml-auto"
        onClick={() => onRemove(entry)}
        disabled={acting}
        title="Remove rule"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

function GravityRuleRow({ entry }: { entry: GravityMatch }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Badge
        variant={entry.type === 'allow' ? 'success' : 'danger'}
        className="text-[10px] px-1.5 py-0"
      >
        {entry.type === 'block' ? 'deny' : entry.type}
      </Badge>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
        list
      </Badge>
      <span className="truncate min-w-0 text-muted-foreground" title={entry.domain}>
        {entry.domain}
      </span>
    </div>
  );
}
