import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Article, ArticleUpdate, ArticleStatus } from '@/lib/types';

export function useArticles(filters?: {
  status?: ArticleStatus;
  hideDuplicates?: boolean;
  neighborhood?: string;
  topic?: string;
  source?: string;
  newsletterOnly?: boolean;
  socialOnly?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*')
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.hideDuplicates) query = query.eq('is_duplicate', false);
      if (filters?.neighborhood) query = query.eq('neighborhood_guess', filters.neighborhood);
      if (filters?.topic) query = query.eq('topic_guess', filters.topic);
      if (filters?.source) query = query.eq('source_name', filters.source);
      if (filters?.newsletterOnly) query = query.eq('use_for_newsletter', true);
      if (filters?.socialOnly) query = query.eq('use_for_social', true);
      if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,source_name.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ArticleUpdate }) => {
      const { data, error } = await supabase.from('articles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useInsertArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (article: Omit<Article, 'id' | 'created_at' | 'imported_at'>) => {
      const { data, error } = await supabase.from('articles').insert(article as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useArticleStats() {
  return useQuery({
    queryKey: ['article-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase.from('articles').select('*');
      if (error) throw error;
      const articles = data as Article[];

      const todayArticles = articles.filter(a => new Date(a.imported_at) >= today);
      return {
        newToday: todayArticles.filter(a => a.status === 'new').length,
        duplicates: articles.filter(a => a.is_duplicate).length,
        shortlisted: articles.filter(a => a.status === 'shortlisted').length,
        newsletter: articles.filter(a => a.use_for_newsletter).length,
        social: articles.filter(a => a.use_for_social).length,
        total: articles.length,
      };
    },
  });
}
