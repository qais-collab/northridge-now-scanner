import { useArticles, useArticleStats } from '@/hooks/use-articles';
import { useSources } from '@/hooks/use-sources';
import { AppLayout } from '@/components/AppLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { DigestPreview } from '@/components/DigestPreview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Newspaper, Copy, ListChecks, Mail, Share2, Loader2, ArrowUpDown, Zap, RefreshCw } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { NEIGHBORHOODS, TOPICS, TOPIC_LABELS } from '@/lib/types';
import type { Article } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="p-2 flex items-center gap-2">
        <div className={`h-7 w-7 rounded flex items-center justify-center shrink-0 ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-none font-mono">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type SortKey = 'relevance' | 'freshness' | 'published' | 'neighborhood';

const FRESHNESS_ORDER: Record<string, number> = { breaking: 0, today: 1, recent: 2, older: 3 };

function sortArticles(articles: Article[], sortBy: SortKey): Article[] {
  const sorted = [...articles];
  switch (sortBy) {
    case 'relevance': return sorted.sort((a, b) => b.relevance_score - a.relevance_score);
    case 'freshness': return sorted.sort((a, b) => (FRESHNESS_ORDER[a.freshness_bucket] ?? 9) - (FRESHNESS_ORDER[b.freshness_bucket] ?? 9));
    case 'published': return sorted.sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
    case 'neighborhood': return sorted.sort((a, b) => (a.neighborhood_guess ?? 'zzz').localeCompare(b.neighborhood_guess ?? 'zzz'));
    default: return sorted;
  }
}
function ScanButton() {
  const [scanning, setScanning] = useState(false);
  const qc = useQueryClient();

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ingest-rss');
      if (error) throw error;
      toast.success(`Scan complete: ${data.articles_inserted} new articles from ${data.sources_checked} sources`);
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article-stats'] });
      qc.invalidateQueries({ queryKey: ['sources'] });
    } catch (e: any) {
      toast.error(`Scan failed: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={runScan} disabled={scanning}>
      {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      {scanning ? 'Scanning…' : 'Run Scan'}
    </Button>
  );
}


  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [freshnessHours, setFreshnessHours] = useState('');
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [newsletterOnly, setNewsletterOnly] = useState(false);
  const [socialOnly, setSocialOnly] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');

  const { data: stats } = useArticleStats();
  const { data: sources } = useSources();
  const { data: articles, isLoading } = useArticles({
    hideDuplicates,
    neighborhood: neighborhood || undefined,
    topic: topic || undefined,
    source: source || undefined,
    newsletterOnly,
    socialOnly,
    search: search || undefined,
    freshnessHours: freshnessHours ? Number(freshnessHours) : undefined,
  });

  const sorted = useMemo(() => sortArticles(articles ?? [], sortBy), [articles, sortBy]);
  const hasFilters = !!(neighborhood || topic || source || freshnessHours || newsletterOnly || socialOnly);

  return (
    <AppLayout onSearch={setSearch} searchValue={search}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
            <p className="text-[11px] text-muted-foreground">Morning scan overview</p>
          </div>
          <div className="flex items-center gap-2">
            <ScanButton />
            <DigestPreview />
            <div className="flex items-center gap-1.5 bg-card border rounded-md px-2 py-1">
              <Zap className="h-3 w-3 text-primary" />
              <Label htmlFor="compact-dash" className="text-[10px] font-medium">Compact Scan</Label>
              <Switch id="compact-dash" checked={compactMode} onCheckedChange={setCompactMode} className="scale-75" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-2">
          <StatCard label="New Today" value={stats?.newToday ?? 0} icon={Newspaper} />
          <StatCard label="Duplicates" value={stats?.duplicates ?? 0} icon={Copy} color="bg-destructive/10 text-destructive" />
          <StatCard label="Shortlisted" value={stats?.shortlisted ?? 0} icon={ListChecks} color="bg-[hsl(var(--score-high))]/10 text-[hsl(var(--score-high))]" />
          <StatCard label="Newsletter" value={stats?.newsletter ?? 0} icon={Mail} color="bg-primary/10 text-primary" />
          <StatCard label="Social" value={stats?.social ?? 0} icon={Share2} color="bg-[hsl(var(--score-medium))]/10 text-[hsl(var(--score-medium))]" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-card rounded-md border p-1.5">
          <Select value={neighborhood} onValueChange={v => setNeighborhood(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[130px] h-6 text-[11px]"><SelectValue placeholder="Neighborhood" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Neighborhoods</SelectItem>
              {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={topic} onValueChange={v => setTopic(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[120px] h-6 text-[11px]"><SelectValue placeholder="Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {TOPICS.map(t => <SelectItem key={t} value={t}>{TOPIC_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={v => setSource(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[130px] h-6 text-[11px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources?.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={freshnessHours} onValueChange={v => setFreshnessHours(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[100px] h-6 text-[11px]"><SelectValue placeholder="Freshness" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="24">Last 24h</SelectItem>
              <SelectItem value="72">Last 72h</SelectItem>
              <SelectItem value="168">This Week</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Switch id="hide-dup" checked={hideDuplicates} onCheckedChange={setHideDuplicates} className="scale-[0.65]" />
            <Label htmlFor="hide-dup" className="text-[10px]">Hide dups</Label>
          </div>
          <div className="flex items-center gap-1">
            <Switch id="nl-only" checked={newsletterOnly} onCheckedChange={setNewsletterOnly} className="scale-[0.65]" />
            <Label htmlFor="nl-only" className="text-[10px]">Newsletter</Label>
          </div>
          <div className="flex items-center gap-1">
            <Switch id="social-only" checked={socialOnly} onCheckedChange={setSocialOnly} className="scale-[0.65]" />
            <Label htmlFor="social-only" className="text-[10px]">Social</Label>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => {
              setNeighborhood(''); setTopic(''); setSource(''); setFreshnessHours('');
              setNewsletterOnly(false); setSocialOnly(false);
            }}>Clear</Button>
          )}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{sorted.length} articles</p>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-[130px] h-6 text-[10px] border-none bg-transparent p-0 gap-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance Score</SelectItem>
                <SelectItem value="freshness">Freshness</SelectItem>
                <SelectItem value="published">Publish Time</SelectItem>
                <SelectItem value="neighborhood">Neighborhood</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Article List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className={compactMode ? 'space-y-1' : 'space-y-1.5'}>
            {sorted.map(a => <ArticleCard key={a.id} article={a} compact={compactMode} />)}
            {sorted.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No articles match your filters.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
