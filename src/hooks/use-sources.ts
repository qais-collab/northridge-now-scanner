import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Source, SourceInsert, SourceUpdate } from '@/lib/types';

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sources').select('*').order('priority', { ascending: false });
      if (error) throw error;
      return data as Source[];
    },
  });
}

export function useInsertSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: SourceInsert) => {
      const { data, error } = await supabase.from('sources').insert(source).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useUpdateSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: SourceUpdate }) => {
      const { data, error } = await supabase.from('sources').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });
}
