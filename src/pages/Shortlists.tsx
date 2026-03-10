import { useArticles } from '@/hooks/use-articles';
import { AppLayout } from '@/components/AppLayout';
import { ArticleCard } from '@/components/ArticleCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { ArticleStatus } from '@/lib/types';

const LISTS: { label: string; status?: ArticleStatus; filter?: 'newsletter' | 'social' }[] = [
  { label: 'Newsletter', filter: 'newsletter' },
  { label: 'Social', filter: 'social' },
  { label: 'Shortlisted', status: 'shortlisted' },
  { label: 'Saved', status: 'saved' },
  { label: 'Reviewed', status: 'reviewed' },
  { label: 'Dismissed', status: 'dismissed' },
];

function ShortlistTab({ status, filter }: { status?: ArticleStatus; filter?: string }) {
  const { data, isLoading } = useArticles({
    status,
    newsletterOnly: filter === 'newsletter',
    socialOnly: filter === 'social',
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs text-muted-foreground">{data?.length ?? 0} articles</p>
      {data?.map(a => <ArticleCard key={a.id} article={a} compact />)}
      {data?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No articles in this list.</p>}
    </div>
  );
}

export default function ShortlistsPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Shortlists</h1>
          <p className="text-xs text-muted-foreground">Curated article lists</p>
        </div>

        <Tabs defaultValue="newsletter">
          <TabsList className="h-8">
            {LISTS.map(l => (
              <TabsTrigger key={l.label} value={l.label.toLowerCase()} className="text-xs h-7">{l.label}</TabsTrigger>
            ))}
          </TabsList>
          {LISTS.map(l => (
            <TabsContent key={l.label} value={l.label.toLowerCase()}>
              <ShortlistTab status={l.status} filter={l.filter} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
