import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSources } from '@/hooks/use-sources';
import { useInsertArticle } from '@/hooks/use-articles';
import { NEIGHBORHOODS, TOPICS, TOPIC_LABELS } from '@/lib/types';
import { useState } from 'react';
import { toast } from 'sonner';

export default function QuickAddPage() {
  const { data: sources } = useSources();
  const insertArticle = useInsertArticle();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [summary, setSummary] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!title) { toast.error('Headline is required'); return; }
    const source = sources?.find(s => s.id === sourceId);
    insertArticle.mutate({
      title,
      url: url || null,
      source_id: sourceId || null,
      source_name: source?.name || null,
      published_at: publishDate ? new Date(publishDate).toISOString() : new Date().toISOString(),
      summary: summary || null,
      neighborhood_guess: neighborhood || null,
      topic_guess: topic || null,
      editor_notes: notes || null,
      status: 'new',
      relevance_score: 0,
      is_duplicate: false,
      use_for_newsletter: false,
      use_for_social: false,
      freshness_bucket: 'today',
      image_url: null,
      duplicate_group_id: null,
      why_it_matters: null,
      raw_location_text: null,
    }, {
      onSuccess: () => {
        toast.success('Article added');
        setTitle(''); setUrl(''); setSourceId(''); setPublishDate('');
        setSummary(''); setNeighborhood(''); setTopic(''); setNotes('');
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-lg">
        <h1 className="text-xl font-bold tracking-tight">Quick Add</h1>
        <p className="text-xs text-muted-foreground mb-4">Manually capture a story lead</p>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div><Label className="text-xs">Headline *</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} className="h-8 text-xs mt-1" placeholder="https://..." /></div>
            <div><Label className="text-xs">Source</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>{sources?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Publish Date</Label><Input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Summary</Label><Textarea value={summary} onChange={e => setSummary(e.target.value)} className="text-xs min-h-[60px] mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Neighborhood</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Topic</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{TOPICS.map(t => <SelectItem key={t} value={t}>{TOPIC_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-[50px] mt-1" /></div>
            <Button className="w-full" onClick={handleSubmit} disabled={insertArticle.isPending}>
              {insertArticle.isPending ? 'Adding…' : 'Add Article'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
