import { useArticles } from '@/hooks/use-articles';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FileText, MapPin } from 'lucide-react';
import { TOPIC_LABELS } from '@/lib/types';
import type { Article } from '@/lib/types';

export function DigestPreview() {
  const { data: articles } = useArticles({ newsletterOnly: true });

  const grouped = (articles ?? []).reduce<Record<string, Article[]>>((acc, a) => {
    const topic = a.topic_guess || 'other';
    (acc[topic] ??= []).push(a);
    return acc;
  }, {});

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <FileText className="h-3 w-3" />Preview Digest
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">Daily Digest Preview</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No newsletter articles selected.</p>
          )}
          {Object.entries(grouped).map(([topic, items]) => (
            <div key={topic}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                {TOPIC_LABELS[topic] || topic}
              </h3>
              <div className="space-y-2">
                {items.sort((a, b) => b.relevance_score - a.relevance_score).map(a => (
                  <div key={a.id} className="border-l-2 border-primary/30 pl-2">
                    <p className="text-sm font-semibold leading-tight">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.source_name}
                      {a.neighborhood_guess && <span className="inline-flex items-center gap-0.5 ml-1.5"><MapPin className="h-2.5 w-2.5" />{a.neighborhood_guess}</span>}
                    </p>
                    {a.summary && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.summary}</p>}
                    {a.why_it_matters && <p className="text-[11px] italic mt-0.5">{a.why_it_matters}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
