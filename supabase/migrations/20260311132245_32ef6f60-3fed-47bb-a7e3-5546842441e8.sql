
-- Part 5: Add crawler selector columns to sources
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS article_link_selector text,
  ADD COLUMN IF NOT EXISTS article_title_selector text,
  ADD COLUMN IF NOT EXISTS article_date_selector text,
  ADD COLUMN IF NOT EXISTS article_summary_selector text,
  ADD COLUMN IF NOT EXISTS exclude_url_patterns text[],
  ADD COLUMN IF NOT EXISTS required_keywords text[];

-- Part 11: Add scan diagnostics columns to scan_runs
ALTER TABLE public.scan_runs
  ADD COLUMN IF NOT EXISTS candidates_found integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rejected_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scan_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL;
