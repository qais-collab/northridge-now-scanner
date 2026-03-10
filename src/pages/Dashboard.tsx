import { useArticles, useArticleStats } from '@/hooks/use-articles';
import { AppLayout } from '@/components/AppLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Newspaper, Copy, ListChecks, Mail, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { NEIGHBORHOODS, TOPICS, TOPIC_LABELS } from '@/lib/types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [hideDuplicates, setHideDuplicates] = useState(true);
  const [newsletterOnly, setNewsletterOnly] = useState(false);
  const [socialOnly, setSocialOnly] = useState(false);

  const { data: stats } = useArticleStats();
  const { data: articles, isLoading } = useArticles({
    hideDuplicates,
    neighborhood: neighborhood || undefined,
    topic: topic || undefined,
    newsletterOnly,
    socialOnly,
    search: search || undefined,
  });

  return (
    <AppLayout onSearch={setSearch} searchValue={search}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Morning scan overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <StatCard label="New Today" value={stats?.newToday ?? 0} icon={Newspaper} />
          <StatCard label="Duplicates" value={stats?.duplicates ?? 0} icon={Copy} color="bg-destructive/10 text-destructive" />
          <StatCard label="Shortlisted" value={stats?.shortlisted ?? 0} icon={ListChecks} color="bg-[hsl(var(--score-high))]/10 text-[hsl(var(--score-high))]" />
          <StatCard label="Newsletter" value={stats?.newsletter ?? 0} icon={Mail} color="bg-primary/10 text-primary" />
          <StatCard label="Social" value={stats?.social ?? 0} icon={Share2} color="bg-[hsl(var(--score-medium))]/10 text-[hsl(var(--score-medium))]" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-card rounded-md border p-2">
          <Select value={neighborhood} onValueChange={setNeighborhood}>
            <SelectTrigger className="w-[140px] h-7 text-xs"><SelectValue placeholder="Neighborhood" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {TOPICS.map(t => <SelectItem key={t} value={t}>{TOPIC_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Switch id="hide-dup" checked={hideDuplicates} onCheckedChange={setHideDuplicates} className="scale-75" />
            <Label htmlFor="hide-dup" className="text-[11px]">Hide dups</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch id="nl-only" checked={newsletterOnly} onCheckedChange={setNewsletterOnly} className="scale-75" />
            <Label htmlFor="nl-only" className="text-[11px]">Newsletter</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch id="social-only" checked={socialOnly} onCheckedChange={setSocialOnly} className="scale-75" />
            <Label htmlFor="social-only" className="text-[11px]">Social</Label>
          </div>

          {(neighborhood || topic || newsletterOnly || socialOnly) && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => {
              setNeighborhood('');
              setTopic('');
              setNewsletterOnly(false);
              setSocialOnly(false);
            }}>Clear filters</Button>
          )}
        </div>

        {/* Article List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{articles?.length ?? 0} articles</p>
            {articles?.map(a => <ArticleCard key={a.id} article={a} />)}
            {articles?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No articles match your filters.</p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
