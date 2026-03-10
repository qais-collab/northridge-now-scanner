import { Article } from '@/lib/types';
import { TOPIC_LABELS } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bookmark, X, Eye, Mail, Share2, Copy, StickyNote,
  ExternalLink, Clock, MapPin, Tag, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUpdateArticle } from '@/hooks/use-articles';
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

export function ArticleCard({ article, compact }: ArticleCardProps) {
  const update = useUpdateArticle();
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState(article.editor_notes || '');

  const act = (updates: Partial<Article>) => {
    update.mutate({ id: article.id, updates: updates as any }, {
      onSuccess: () => toast.success('Article updated'),
    });
  };

  return (
    <Card className={`p-3 hover:shadow-md transition-shadow ${article.is_duplicate ? 'opacity-60 border-dashed' : ''} ${article.status === 'dismissed' ? 'opacity-40' : ''}`}>
      <div className="flex gap-3">
        {/* Score */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${scoreColor(article.relevance_score)}`}>
            {article.relevance_score}
          </div>
          <span className="text-[10px]">{freshnessIcon(article.freshness_bucket)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 flex-1">
              {article.title}
            </h3>
            {article.is_duplicate && (
              <Badge variant="outline" className="text-[10px] shrink-0 border-destructive text-destructive">DUP</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
            <span className="font-medium">{article.source_name}</span>
            {article.published_at && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </span>
              </>
            )}
            {article.neighborhood_guess && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-3 w-3" />
                  {article.neighborhood_guess}
                </span>
              </>
            )}
            {article.topic_guess && (
              <>
                <span>·</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {TOPIC_LABELS[article.topic_guess] || article.topic_guess}
                </Badge>
              </>
            )}
          </div>

          {!compact && article.summary && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{article.summary}</p>
          )}

          {!compact && article.why_it_matters && (
            <p className="text-xs mt-1 text-foreground/80 italic">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {article.why_it_matters}
            </p>
          )}

          {showNote && (
            <div className="mt-2 flex gap-1">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs h-16 min-h-0"
                placeholder="Editor notes…"
              />
              <Button size="sm" variant="outline" className="shrink-0 h-8" onClick={() => {
                act({ editor_notes: note });
                setShowNote(false);
              }}>Save</Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 mt-2 flex-wrap">
            {article.status !== 'shortlisted' && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => act({ status: 'shortlisted' })}>
                <Bookmark className="h-3 w-3 mr-0.5" />Save
              </Button>
            )}
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => act({ status: 'dismissed' })}>
              <X className="h-3 w-3 mr-0.5" />Dismiss
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => act({ status: 'reviewed' })}>
              <Eye className="h-3 w-3 mr-0.5" />Reviewed
            </Button>
            <Button
              size="sm"
              variant={article.use_for_newsletter ? 'default' : 'ghost'}
              className="h-6 text-[10px] px-1.5"
              onClick={() => act({ use_for_newsletter: !article.use_for_newsletter })}
            >
              <Mail className="h-3 w-3 mr-0.5" />Newsletter
            </Button>
            <Button
              size="sm"
              variant={article.use_for_social ? 'default' : 'ghost'}
              className="h-6 text-[10px] px-1.5"
              onClick={() => act({ use_for_social: !article.use_for_social })}
            >
              <Share2 className="h-3 w-3 mr-0.5" />Social
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => act({ is_duplicate: !article.is_duplicate })}>
              <Copy className="h-3 w-3 mr-0.5" />{article.is_duplicate ? 'Unmark Dup' : 'Mark Dup'}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" onClick={() => setShowNote(!showNote)}>
              <StickyNote className="h-3 w-3 mr-0.5" />Note
            </Button>
            {article.url && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5" asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-0.5" />Open
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
