RSS ingestion pipeline: edge functions, source health tracking, feed testing.

## Edge Functions
- `ingest-rss`: Fetches all active RSS sources, parses RSS/Atom, deduplicates by URL, inserts articles, updates source health columns, logs scan_runs
- `test-feed`: Tests a single feed_url — returns reachability, item count, sample title/URL, feed type
- Both have verify_jwt = false in config.toml

## Source Health Columns (added to sources table)
- last_scan_at, last_success_at, last_error, items_today

## Known Feed Issues
- Daily News, Patch Northridge, LAist feed URLs may need periodic updating (403/404 common)
- CSUN Sundial and LA Metro feeds work reliably

## Dashboard
- "Run Scan" button triggers ingest-rss from Dashboard
- Sources page has "Test Feed" button per source with inline results
