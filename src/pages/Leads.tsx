import { useArticles } from '@/hooks/use-articles';
import { useSources } from '@/hooks/use-sources';
import { AppLayout } from '@/components/AppLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { NEIGHBORHOODS, TOPICS, TOPIC_LABELS } from '@/lib/types';
import { Loader2, ArrowUpDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Article } from '@/lib/types';

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

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [topic, setTopic] = useState('');
  const [source, setSource] = useState('');
  const [freshnessHours, setFreshnessHours] = useState('');
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');

  const { data: sources } = useSources();
  const { data: articles, isLoading } = useArticles({
    status: 'new',
    hideDuplicates,
    neighborhood: neighborhood || undefined,
    topic: topic || undefined,
    source: source || undefined,
    search: search || undefined,
    freshnessHours: freshnessHours ? Number(freshnessHours) : undefined,
  });

  const sorted = useMemo(() => sortArticles(articles ?? [], sortBy), [articles, sortBy]);
  const hasFilters = !!(neighborhood || topic || source || freshnessHours);

  return (
    <AppLayout onSearch={setSearch} searchValue={search}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Today's Leads</h1>
            <p className="text-[11px] text-muted-foreground">New articles awaiting triage</p>
          </div>
          <div className="flex items-center gap-1.5 bg-card border rounded-md px-2 py-1">
            <Zap className="h-3 w-3 text-primary" />
            <Label htmlFor="compact-leads" className="text-[10px] font-medium">Compact Scan</Label>
            <Switch id="compact-leads" checked={compactMode} onCheckedChange={setCompactMode} className="scale-75" />
          </div>
        </div>

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
            <Switch id="hide-dup-leads" checked={hideDuplicates} onCheckedChange={setHideDuplicates} className="scale-[0.65]" />
            <Label htmlFor="hide-dup-leads" className="text-[10px]">Hide dups</Label>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1.5" onClick={() => {
              setNeighborhood(''); setTopic(''); setSource(''); setFreshnessHours('');
            }}>Clear</Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{sorted.length} leads</p>
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className={compactMode ? 'space-y-1' : 'space-y-1.5'}>
            {sorted.map(a => <ArticleCard key={a.id} article={a} compact={compactMode} />)}
            {sorted.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">All clear — no new leads.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
