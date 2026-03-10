import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useUpdateSource } from '@/hooks/use-sources';
import { toast } from 'sonner';

export function ResetSourceButton({ sourceId }: { sourceId: string }) {
  const [resetting, setResetting] = useState(false);
  const updateSource = useUpdateSource();

  const handleReset = () => {
    setResetting(true);
    updateSource.mutate(
      {
        id: sourceId,
        updates: {
          last_error: null,
          last_scan_at: null,
          last_success_at: null,
          items_today: 0,
        } as any,
      },
      {
        onSuccess: () => {
          toast.success('Source state reset');
          setResetting(false);
        },
        onError: () => {
          toast.error('Failed to reset');
          setResetting(false);
        },
      }
    );
  };

  return (
    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={handleReset} disabled={resetting}>
      {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      Reset
    </Button>
  );
}
