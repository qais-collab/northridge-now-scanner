import type { Database } from '@/integrations/supabase/types';

export type Article = Database['public']['Tables']['articles']['Row'];
export type ArticleInsert = Database['public']['Tables']['articles']['Insert'];
export type ArticleUpdate = Database['public']['Tables']['articles']['Update'];

export type Source = Database['public']['Tables']['sources']['Row'];
export type SourceInsert = Database['public']['Tables']['sources']['Insert'];
export type SourceUpdate = Database['public']['Tables']['sources']['Update'];

export type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];
export type Shortlist = Database['public']['Tables']['shortlists']['Row'];
export type ScanRun = Database['public']['Tables']['scan_runs']['Row'];
export type ArticleTag = Database['public']['Tables']['article_tags']['Row'];

export type ArticleStatus = Database['public']['Enums']['article_status'];
export type FreshnessBucket = Database['public']['Enums']['freshness_bucket'];
export type SourceType = Database['public']['Enums']['source_type'];
export type SourceCategory = Database['public']['Enums']['source_category'];

export const NEIGHBORHOODS = [
  'Northridge', 'Porter Ranch', 'Granada Hills', 'Chatsworth',
  'Reseda', 'Winnetka', 'North Hills', 'Canoga Park',
  'Mission Hills', 'San Fernando Valley', 'Unknown'
] as const;

export const TOPICS = [
  'breaking_news', 'public_safety', 'traffic', 'schools',
  'business', 'events', 'civic_planning', 'community',
  'weather', 'transportation'
] as const;

export const SOURCE_CATEGORIES: SourceCategory[] = [
  'major_news', 'hyperlocal_publisher', 'government', 'public_safety',
  'transportation', 'schools', 'events', 'civic_planning', 'community_organizations'
];

export const TOPIC_LABELS: Record<string, string> = {
  breaking_news: 'Breaking News',
  public_safety: 'Public Safety',
  traffic: 'Traffic',
  schools: 'Schools',
  business: 'Business',
  events: 'Events',
  civic_planning: 'Civic Planning',
  community: 'Community',
  weather: 'Weather',
  transportation: 'Transportation',
};

export const CATEGORY_LABELS: Record<SourceCategory, string> = {
  major_news: 'Major News',
  hyperlocal_publisher: 'Hyperlocal',
  government: 'Government',
  public_safety: 'Public Safety',
  transportation: 'Transportation',
  schools: 'Schools',
  events: 'Events',
  civic_planning: 'Civic Planning',
  community_organizations: 'Community Orgs',
};
