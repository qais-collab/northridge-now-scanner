
-- Create enum types
CREATE TYPE public.source_type AS ENUM ('rss', 'watchlist', 'manual');
CREATE TYPE public.source_category AS ENUM ('major_news', 'hyperlocal_publisher', 'government', 'public_safety', 'transportation', 'schools', 'events', 'civic_planning', 'community_organizations');
CREATE TYPE public.article_status AS ENUM ('new', 'reviewed', 'saved', 'dismissed', 'shortlisted');
CREATE TYPE public.freshness_bucket AS ENUM ('breaking', 'today', 'recent', 'older');

-- Create neighborhoods table
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to neighborhoods" ON public.neighborhoods FOR ALL USING (true) WITH CHECK (true);

-- Create sources table
CREATE TABLE public.sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category source_category NOT NULL DEFAULT 'major_news',
  base_url TEXT,
  feed_url TEXT,
  source_type source_type NOT NULL DEFAULT 'manual',
  coverage_area TEXT DEFAULT 'San Fernando Valley',
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to sources" ON public.sources FOR ALL USING (true) WITH CHECK (true);

-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_name TEXT,
  neighborhood_guess TEXT,
  topic_guess TEXT,
  relevance_score INTEGER NOT NULL DEFAULT 0,
  duplicate_group_id UUID,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  status article_status NOT NULL DEFAULT 'new',
  use_for_newsletter BOOLEAN NOT NULL DEFAULT false,
  use_for_social BOOLEAN NOT NULL DEFAULT false,
  editor_notes TEXT,
  why_it_matters TEXT,
  raw_location_text TEXT,
  freshness_bucket freshness_bucket NOT NULL DEFAULT 'today',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_articles_source_id ON public.articles(source_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX idx_articles_relevance_score ON public.articles(relevance_score DESC);
CREATE INDEX idx_articles_duplicate_group ON public.articles(duplicate_group_id);

-- Create article_tags table
CREATE TABLE public.article_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to article_tags" ON public.article_tags FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_article_tags_article_id ON public.article_tags(article_id);

-- Create shortlists table
CREATE TABLE public.shortlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to shortlists" ON public.shortlists FOR ALL USING (true) WITH CHECK (true);

-- Create scan_runs table
CREATE TABLE public.scan_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  articles_found INTEGER NOT NULL DEFAULT 0,
  duplicates_found INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to scan_runs" ON public.scan_runs FOR ALL USING (true) WITH CHECK (true);
