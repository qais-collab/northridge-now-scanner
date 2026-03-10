ALTER TABLE public.sources 
  ADD COLUMN IF NOT EXISTS last_scan_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_success_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS items_today integer NOT NULL DEFAULT 0;