import { useSources, useInsertSource, useUpdateSource } from '@/hooks/use-sources';
import { AppLayout } from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, SOURCE_CATEGORIES, type Source, type SourceInsert } from '@/lib/types';
import { toast } from 'sonner';

function SourceForm({ source, onSave, onClose }: { source?: Source; onSave: (data: SourceInsert) => void; onClose: () => void }) {
  const [name, setName] = useState(source?.name || '');
  const [category, setCategory] = useState(source?.category || 'major_news');
  const [baseUrl, setBaseUrl] = useState(source?.base_url || '');
  const [feedUrl, setFeedUrl] = useState(source?.feed_url || '');
  const [sourceType, setSourceType] = useState(source?.source_type || 'manual');
  const [priority, setPriority] = useState(source?.priority || 5);
  const [notes, setNotes] = useState(source?.notes || '');

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Category</Label>
        <Select value={category} onValueChange={(v: any) => setCategory(v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{SOURCE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Base URL</Label><Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Feed URL</Label><Input value={feedUrl} onChange={e => setFeedUrl(e.target.value)} className="h-8 text-xs mt-1" placeholder="RSS feed URL (optional)" /></div>
      <div><Label className="text-xs">Source Type</Label>
        <Select value={sourceType} onValueChange={(v: any) => setSourceType(v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rss">RSS Feed</SelectItem>
            <SelectItem value="watchlist">Watchlist</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Priority: {priority}</Label>
        <Slider value={[priority]} onValueChange={([v]) => setPriority(v)} min={1} max={10} step={1} className="mt-2" />
      </div>
      <div><Label className="text-xs">Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-[60px] mt-1" /></div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={() => {
          if (!name) { toast.error('Name is required'); return; }
          onSave({ name, category, base_url: baseUrl || null, feed_url: feedUrl || null, source_type: sourceType, priority, notes: notes || null } as any);
        }}>Save</Button>
      </div>
    </div>
  );
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
                  <TableHead className="text-xs">Active</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources?.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{CATEGORY_LABELS[s.category]}</Badge></TableCell>
                    <TableCell className="text-xs">{s.source_type}</TableCell>
                    <TableCell className="text-xs font-mono">{s.priority}</TableCell>
                    <TableCell>
                      <Switch
                        checked={s.active}
                        onCheckedChange={(v) => updateSource.mutate({ id: s.id, updates: { active: v } })}
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell>
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
