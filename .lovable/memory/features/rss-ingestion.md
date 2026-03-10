RSS and watchlist ingestion pipeline: edge functions, source health tracking, feed testing.

## Edge Functions
- `ingest-rss`: Fetches all active RSS sources, parses RSS/Atom, deduplicates by URL, inserts articles, updates source health columns, logs scan_runs
- `ingest-watchlist`: Crawls active watchlist source base_url pages, extracts article links matching /news, /article, /story, /202, /2026 patterns, deduplicates by URL, inserts articles
- `test-feed`: Tests a single feed_url — returns reachability, item count, sample title/URL, feed type
- All have verify_jwt = false in config.toml

## Sports Keyword Detection (both ingest functions)
- Keywords: basketball, baseball, football, soccer, tournament, athletics
- Sets topic_guess = "sports" and relevance_score -2 unless text contains "CSUN campus" or "Northridge"

## Source Health Columns (sources table)
- last_scan_at, last_success_at, last_error, items_today

## Dashboard
- "Run Scan" button triggers both ingest-rss and ingest-watchlist in parallel
- Sources page has "Test Feed" button per source with inline results
