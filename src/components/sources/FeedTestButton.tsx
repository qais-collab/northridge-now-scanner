import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FlaskConical, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeedTestResult {
  reachable: boolean;
  items_found?: number;
  sample_title?: string;
  sample_url?: string;
  feed_type?: string;
  error?: string;
}

export function FeedTestButton({ feedUrl }: { feedUrl: string | null }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<FeedTestResult | null>(null);

  if (!feedUrl) return <span className="text-[10px] text-muted-foreground">No feed URL</span>;

  const testFeed = async () => {
    setTesting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('test-feed', {
        body: { feed_url: feedUrl },
      });
      if (error) throw error;
      setResult(data as FeedTestResult);
    } catch (e: any) {
      setResult({ reachable: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={testFeed} disabled={testing}>
        {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
        Test Feed
      </Button>
      {result && (
        <div className="text-[10px] bg-muted/50 rounded p-1.5 space-y-0.5 max-w-[280px]">
          <div className="flex items-center gap-1">
            {result.reachable ? <CheckCircle className="h-3 w-3 text-[hsl(var(--score-high))]" /> : <XCircle className="h-3 w-3 text-destructive" />}
            <span className="font-medium">{result.reachable ? 'Reachable' : 'Unreachable'}</span>
            {result.feed_type && <Badge variant="secondary" className="text-[8px] h-3 px-1">{result.feed_type}</Badge>}
          </div>
          {result.items_found !== undefined && <p>{result.items_found} items found</p>}
          {result.sample_title && (
            <p className="truncate text-muted-foreground">Sample: {result.sample_title}</p>
          )}
          {result.sample_url && (
            <a href={result.sample_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5 truncate">
              <ExternalLink className="h-2.5 w-2.5 shrink-0" />{result.sample_url}
            </a>
          )}
          {result.error && <p className="text-destructive">{result.error}</p>}
        </div>
      )}
    </div>
  );
}
