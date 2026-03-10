import { useArticles } from '@/hooks/use-articles';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, MapPin } from 'lucide-react';
import { TOPIC_LABELS } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function DigestPage() {
  const { data: articles, isLoading } = useArticles({ hideDuplicates: true });

  // Get top 15 sorted by score
  const top = (articles || [])
    .filter(a => a.status !== 'dismissed')
    .slice(0, 15);

  // Group by topic
  const grouped = top.reduce((acc, a) => {
    const topic = a.topic_guess || 'other';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(a);
    return acc;
  }, {} as Record<string, typeof top>);

  return (
    <AppLayout>
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Daily Digest</h1>
          <p className="text-xs text-muted-foreground">Top {top.length} story leads — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          Object.entries(grouped).map(([topic, items]) => (
            <div key={topic} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {TOPIC_LABELS[topic] || topic}
              </h2>
              {items.map((a, i) => (
                <Card key={a.id} className="p-3">
                  <div className="flex gap-3">
                    <span className="text-lg font-bold text-muted-foreground/30 w-6 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-tight">{a.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span>{a.source_name}</span>
                        {a.neighborhood_guess && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{a.neighborhood_guess}</span>
                          </>
                        )}
                      </div>
                      {a.summary && <p className="text-xs text-muted-foreground mt-1">{a.summary}</p>}
                      {a.why_it_matters && (
                        <p className="text-xs mt-1 italic text-foreground/80">
                          <TrendingUp className="inline h-3 w-3 mr-1" />{a.why_it_matters}
                        </p>
                      )}
                      {a.url && (
                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1 mt-1" asChild>
                          <a href={a.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-0.5" />Read</a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
