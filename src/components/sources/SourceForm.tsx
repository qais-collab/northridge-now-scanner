import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, SOURCE_CATEGORIES, type Source, type SourceInsert } from '@/lib/types';
import { toast } from 'sonner';

interface SourceFormProps {
  source?: Source;
  onSave: (data: SourceInsert) => void;
  onClose: () => void;
}

export function SourceForm({ source, onSave, onClose }: SourceFormProps) {
  const [name, setName] = useState(source?.name || '');
  const [category, setCategory] = useState(source?.category || 'major_news');
  const [baseUrl, setBaseUrl] = useState(source?.base_url || '');
  const [feedUrl, setFeedUrl] = useState(source?.feed_url || '');
  const [sourceType, setSourceType] = useState(source?.source_type || 'manual');
  const [priority, setPriority] = useState(source?.priority || 5);
  const [notes, setNotes] = useState(source?.notes || '');

  const handleTypeChange = (newType: string) => {
    setSourceType(newType as any);
    // Clear RSS-only fields when switching away from RSS
    if (newType !== 'rss') {
      setFeedUrl('');
    }
  };

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
      {sourceType === 'rss' && (
        <div><Label className="text-xs">Feed URL</Label><Input value={feedUrl} onChange={e => setFeedUrl(e.target.value)} className="h-8 text-xs mt-1" placeholder="RSS feed URL" /></div>
      )}
      <div><Label className="text-xs">Source Type</Label>
        <Select value={sourceType} onValueChange={handleTypeChange}>
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
          const data: any = {
            name,
            category,
            base_url: baseUrl || null,
            feed_url: sourceType === 'rss' ? (feedUrl || null) : null,
            source_type: sourceType,
            priority,
            notes: notes || null,
          };
          // When changing type, clear stale health fields
          if (source && source.source_type !== sourceType) {
            data.last_error = null;
            data.last_scan_at = null;
            data.last_success_at = null;
            data.items_today = 0;
          }
          onSave(data);
        }}>Save</Button>
      </div>
    </div>
  );
}
