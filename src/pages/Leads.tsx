import { useArticles } from '@/hooks/use-articles';
import { AppLayout } from '@/components/AppLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { NEIGHBORHOODS, TOPICS, TOPIC_LABELS } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [topic, setTopic] = useState('');
  const [hideDuplicates, setHideDuplicates] = useState(true);

  const { data: articles, isLoading } = useArticles({
    status: 'new',
    hideDuplicates,
    neighborhood: neighborhood || undefined,
    topic: topic || undefined,
    search: search || undefined,
  });

  return (
    <AppLayout onSearch={setSearch} searchValue={search}>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Today's Leads</h1>
          <p className="text-xs text-muted-foreground">New articles awaiting triage</p>
        </div>

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
            <Switch id="hide-dup-leads" checked={hideDuplicates} onCheckedChange={setHideDuplicates} className="scale-75" />
            <Label htmlFor="hide-dup-leads" className="text-[11px]">Hide duplicates</Label>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{articles?.length ?? 0} leads</p>
            {articles?.map(a => <ArticleCard key={a.id} article={a} />)}
            {articles?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">All clear — no new leads.</p>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
