RSS and watchlist ingestion pipeline: edge functions, source health tracking, feed testing.

## Location Detection (3-Tier System)
Both `ingest-rss` and `ingest-watchlist` use identical detection:

### Text Normalization
`normalizeText()` combines title + summary, lowercases, strips punctuation, collapses whitespace.

### Tier 1 — City Names (highest confidence, +3 strong / +2 other)
Multi-word checked first: Porter Ranch, Granada Hills, Canoga Park, North Hills, Mission Hills, Lake Balboa, Van Nuys, Sherman Oaks, Woodland Hills, West Hills, Sun Valley, Panorama City, Studio City, San Fernando Valley.
Then single-word: Northridge, Chatsworth, Reseda, Winnetka, Encino, Tarzana, Pacoima, Arleta, Sylmar, San Fernando.

### Tier 2 — Landmarks (medium confidence, +1)
- CSUN, Cal State Northridge, Devonshire Division, Northridge Academy/Park, Nobel Middle, Beckford → Northridge
- Porter Ranch Town Center, Aliso/Limekiln/Bee Canyon → Porter Ranch
- Granada Hills Charter, Cleveland High, Knollwood → Granada Hills
- Topanga Canyon/Boulevard, Box Canyon, Santa Susana, Stoney Point, Chatsworth High → Chatsworth
- Balboa Park/Boulevard, Van Nuys Airport → Van Nuys
- Sepulveda Basin → Encino
- Sylmar High → Sylmar
- Brand Park → Mission Hills
- Owensmouth → Canoga Park

### Tier 3 — Streets & Freeways (low confidence, +1)
- 118 freeway/SR-118 → Chatsworth
- 405 freeway/I-405 → Van Nuys
- 101 freeway/US-101 → Encino
- Reseda Blvd → Reseda
- Balboa Blvd → Van Nuys
- Topanga Canyon Blvd → Chatsworth
- Rinaldi St, Sesnon Blvd → Porter Ranch
- Zelzah Ave → Granada Hills
- Nordhoff/Devonshire/Plummer/Tampa/Lassen St → Northridge
- De Soto Ave → Canoga Park
- Roscoe Blvd → North Hills
- Woodman Ave → North Hills
- Old San Fernando Rd → Sylmar

### Multi-Location Priority
If multiple detected: Northridge > Porter Ranch > Granada Hills > Chatsworth > Reseda > Winnetka > North Hills > Canoga Park > Mission Hills > other Valley cities

### Scoring
| Signal | Points |
|---|---|
| Strong local city (Northridge, Porter Ranch, Granada Hills, Chatsworth) | +3 |
| Other Valley city | +2 |
| Landmark match | +1 |
| Street/freeway signal | +1 |
| Priority event keyword | +2 |
| Hyperlocal source | +1 |
| Sports without local signals | -2 |
| No location detected | -2 |
| Missing publish date | -2 |

## Edge Functions
- `ingest-rss`: Fetches active RSS sources, parses RSS/Atom, deduplicates by URL, inserts articles with 3-tier detection
- `ingest-watchlist`: Two-stage crawl (base URL → article pages), extracts meta tags, same 3-tier detection
- `test-feed`: Tests a single feed_url — returns reachability, item count, sample title/URL, feed type
- All have verify_jwt = false in config.toml

## Source Health Columns (sources table)
- last_scan_at, last_success_at, last_error, items_today
- article_link_selector, article_title_selector, article_date_selector, article_summary_selector
- exclude_url_patterns, required_keywords

## Source Type Normalization
- Changing source_type auto-clears: feed_url (non-RSS), last_error, last_scan_at, last_success_at, items_today
- UI conditionally shows Test Feed (RSS only), "Watchlist scan" label, or "Manual" label
- "Reset Source State" button clears stale health fields for any source

## Client-Side Scoring (src/lib/scoring.ts)
- Mirrors edge function scoring with ScoringWeights interface
- Tiered: strongLocal (+3), otherValley (+2), landmarkSignal (+1), streetSignal (+1)
- Settings page shows all weight sliders
