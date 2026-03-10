import { Article } from '@/lib/types';
import { TOPIC_LABELS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Bookmark, X, Eye, Mail, Share2, Copy, StickyNote,
  ExternalLink, Clock, MapPin, Tag, TrendingUp, Newspaper, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUpdateArticle } from '@/hooks/use-articles';
import { useDuplicateGroup } from '@/hooks/use-articles';
import { toast } from 'sonner';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ArticleCardProps {
  article: Article;
  compact?: boolean;
}

function scoreColor(score: number) {
  if (score >= 7) return 'bg-[hsl(var(--score-high))] text-white';
  if (score >= 4) return 'bg-[hsl(var(--score-medium))] text-white';
  return 'bg-muted text-muted-foreground';
}

function freshnessIcon(bucket: string) {
  if (bucket === 'breaking') return '🔴';
  if (bucket === 'today') return '🟡';
  if (bucket === 'recent') return '🔵';
  return '⚪';
}

function ActionBtn({ icon: Icon, label, active, onClick, variant }: {
  icon: any; label: string; active?: boolean; onClick: () => void; variant?: 'destructive';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant={active ? 'default' : 'ghost'}
          className={`h-6 w-6 p-0 ${variant === 'destructive' && active ? 'bg-destructive text-destructive-foreground' : ''}`}
          onClick={onClick}
        >
          <Icon className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ArticleCard({ article, compact }: ArticleCardProps) {
  const update = useUpdateArticle();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(article.editor_notes || '');
  const [dupOpen, setDupOpen] = useState(false);

  const { data: duplicates } = useDuplicateGroup(
    article.duplicate_group_id && !article.is_duplicate ? article.duplicate_group_id : null,
    article.id
  );

  const act = (updates: Partial<Article>) => {
    update.mutate({ id: article.id, updates: updates as any }, {
      onSuccess: () => toast.success('Updated'),
    });
  };

  const dupCount = duplicates?.length ?? 0;

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={`${compact ? 'py-1.5 px-2' : 'p-2'} hover:shadow-sm transition-shadow ${article.is_duplicate ? 'opacity-50 border-dashed' : ''} ${article.status === 'dismissed' ? 'opacity-40' : ''}`}>
        <div className="flex gap-2">
          {/* Score */}
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold font-mono ${scoreColor(article.relevance_score)}`}>
              {article.relevance_score}
            </div>
            <span className="text-[9px] leading-none">{freshnessIcon(article.freshness_bucket)}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Headline + Source */}
            <div className="flex items-baseline gap-1.5 min-w-0">
              <h3 className={`text-sm font-bold leading-tight flex-1 min-w-0 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>
                {article.title}
              </h3>
              <span className="text-[11px] font-semibold text-primary shrink-0 whitespace-nowrap">
                {article.source_name}
              </span>
            </div>

            {/* Metadata badges */}
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {article.published_at && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </span>
              )}
              {article.neighborhood_guess && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />{article.neighborhood_guess}
                </Badge>
              )}
              {article.topic_guess && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0">
                  {TOPIC_LABELS[article.topic_guess] || article.topic_guess}
                </Badge>
              )}
            </div>

            {/* Summary - hidden in compact */}
            {!compact && article.summary && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{article.summary}</p>
            )}

            {/* Duplicate indicator */}
            {dupCount > 0 && !article.is_duplicate && (
              <Collapsible open={dupOpen} onOpenChange={setDupOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 mt-1 text-[10px] font-medium text-primary hover:underline cursor-pointer">
                  <Newspaper className="h-3 w-3" />
                  Reported by {dupCount + 1} sources
                  <ChevronDown className={`h-3 w-3 transition-transform ${dupOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-1 pl-2 border-l-2 border-primary/20">
                  {duplicates?.map(d => (
                    <div key={d.id} className="flex items-baseline gap-1.5 text-[11px]">
                      <span className="font-medium text-muted-foreground">{d.source_name}</span>
                      <span className="text-muted-foreground/60 truncate">{d.title}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Editor note */}
            {showNote && !compact && (
              <div className="mt-1 flex gap-1">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="text-xs h-14 min-h-0" placeholder="Editor notes…" />
                <Button size="sm" variant="outline" className="shrink-0 h-7 text-[10px]" onClick={() => { act({ editor_notes: note }); setShowNote(false); }}>Save</Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-0.5 mt-1">
              {article.status !== 'shortlisted' && (
                <ActionBtn icon={Bookmark} label="Save" onClick={() => act({ status: 'shortlisted' })} />
              )}
              <ActionBtn icon={X} label="Dismiss" onClick={() => act({ status: 'dismissed' })} />
              <ActionBtn icon={Eye} label="Reviewed" onClick={() => act({ status: 'reviewed' })} />
              <ActionBtn icon={Mail} label="Newsletter" active={article.use_for_newsletter} onClick={() => act({ use_for_newsletter: !article.use_for_newsletter })} />
              <ActionBtn icon={Share2} label="Social" active={article.use_for_social} onClick={() => act({ use_for_social: !article.use_for_social })} />
              <ActionBtn icon={Copy} label={article.is_duplicate ? 'Unmark Dup' : 'Mark Dup'} active={article.is_duplicate} onClick={() => act({ is_duplicate: !article.is_duplicate })} variant="destructive" />
              {!compact && <ActionBtn icon={StickyNote} label="Note" onClick={() => setShowNote(!showNote)} />}
              {article.url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">Open source</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
