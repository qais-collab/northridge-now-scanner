import { useSources, useInsertSource, useUpdateSource } from '@/hooks/use-sources';
import { AppLayout } from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Loader2, CheckCircle, XCircle, Globe, Rss } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, type Source } from '@/lib/types';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { SourceForm } from '@/components/sources/SourceForm';
import { FeedTestButton } from '@/components/sources/FeedTestButton';
import { ResetSourceButton } from '@/components/sources/ResetSourceButton';

function SourceStatusCell({ source }: { source: Source }) {
  if (source.source_type === 'manual') {
    return <span className="text-[10px] text-muted-foreground">Manual</span>;
  }

  const s = source as any;

  if (s.last_error) {
    return (
      <span className="text-[10px] text-destructive flex items-center gap-0.5">
        <XCircle className="h-3 w-3" />{s.last_error}
      </span>
    );
  }

  if (s.last_success_at) {
    const label = source.source_type === 'watchlist' ? 'Crawl OK' : 'Feed OK';
    return (
      <span className="text-[10px] text-[hsl(var(--score-high))] flex items-center gap-0.5">
        <CheckCircle className="h-3 w-3" />{label}
      </span>
    );
  }

  return <span className="text-[10px] text-muted-foreground">—</span>;
}

function SourceTestCell({ source }: { source: Source }) {
  if (source.source_type === 'rss') {
    return <FeedTestButton feedUrl={source.feed_url} />;
  }
  if (source.source_type === 'watchlist') {
    return (
      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Globe className="h-3 w-3" />Watchlist
      </span>
    );
  }
  return <span className="text-[10px] text-muted-foreground">—</span>;
}

function SourceTypeIcon({ type }: { type: string }) {
  if (type === 'rss') return <Rss className="h-3 w-3 mr-0.5 inline" />;
  if (type === 'watchlist') return <Globe className="h-3 w-3 mr-0.5 inline" />;
  return null;
}

export default function SourcesPage() {
  const { data: sources, isLoading } = useSources();
  const insertSource = useInsertSource();
  const updateSource = useUpdateSource();
  const [editSource, setEditSource] = useState<Source | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sources</h1>
            <p className="text-xs text-muted-foreground">{sources?.length ?? 0} configured sources</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Add Source</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Source</DialogTitle></DialogHeader>
              <SourceForm onSave={(data) => {
                insertSource.mutate(data, { onSuccess: () => { toast.success('Source added'); setShowAdd(false); } });
              }} onClose={() => setShowAdd(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="bg-card rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Last Scan</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Items</TableHead>
                  <TableHead className="text-xs">Active</TableHead>
                  <TableHead className="text-xs">Test</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[s.category]}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        <SourceTypeIcon type={s.source_type} />
                        {s.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{s.priority}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {s.last_scan_at ? formatDistanceToNow(new Date(s.last_scan_at), { addSuffix: true }) : '—'}
                    </TableCell>
                    <TableCell><SourceStatusCell source={s} /></TableCell>
                    <TableCell className="text-xs font-mono">{s.items_today ?? 0}</TableCell>
                    <TableCell>
                      <Switch
                        checked={s.active}
                        onCheckedChange={(v) => updateSource.mutate({ id: s.id, updates: { active: v } })}
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell><SourceTestCell source={s} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog open={editSource?.id === s.id} onOpenChange={(o) => !o && setEditSource(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditSource(s)}>
                              <Pencil className="h-3 w-3 mr-1" />Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Edit Source</DialogTitle></DialogHeader>
                            <SourceForm source={s} onSave={(data) => {
                              updateSource.mutate({ id: s.id, updates: data as any }, { onSuccess: () => { toast.success('Source updated'); setEditSource(null); } });
                            }} onClose={() => setEditSource(null)} />
                          </DialogContent>
                        </Dialog>
                        <ResetSourceButton sourceId={s.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
