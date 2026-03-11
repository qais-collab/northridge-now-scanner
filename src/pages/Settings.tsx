import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { DEFAULT_WEIGHTS, type ScoringWeights } from '@/lib/scoring';

const WEIGHT_LABELS: Record<keyof ScoringWeights, string> = {
  strongLocal: 'Strong local keyword (+Northridge, CSUN, etc.)',
  priorityKeyword: 'Priority keyword (fire, shooting, etc.)',
  hyperlocalSource: 'Hyperlocal source bonus',
  fresh24h: 'Published within 24h',
  recent72h: 'Published within 72h',
  sportsNoLocal: 'Sports without local context',
  missingDate: 'Missing publish date',
  duplicate: 'Duplicate penalty',
  outsideCoverage: 'Outside coverage area',
};

export default function SettingsPage() {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [digestSize, setDigestSize] = useState(15);

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">Configure scoring, neighborhoods, and preferences</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Relevance Scoring Weights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(weights) as (keyof ScoringWeights)[]).map(key => (
              <div key={key} className="flex items-center gap-4">
                <Label className="text-xs w-48 shrink-0">{WEIGHT_LABELS[key]}</Label>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([v]) => setWeights(w => ({ ...w, [key]: v }))}
                  min={-5}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">{weights[key] > 0 ? '+' : ''}{weights[key]}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Digest Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label className="text-xs">Default digest size</Label>
              <Input
                type="number"
                value={digestSize}
                onChange={e => setDigestSize(Number(e.target.value))}
                className="h-8 w-20 text-xs"
                min={5}
                max={50}
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground italic">
          Note: Settings are currently local to this session. Persistent settings with database storage coming soon.
        </p>
      </div>
    </AppLayout>
  );
}
