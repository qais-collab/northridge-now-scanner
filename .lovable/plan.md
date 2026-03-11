

# Fix: Neighborhood Filter Returns No Results

## Problem
All ingested articles have `neighborhood_guess = null`. The neighborhood filter uses `eq('neighborhood_guess', value)` which never matches null. No articles appear for any neighborhood selection.

## Root Cause
Neither `ingest-rss` nor `ingest-watchlist` assigns `neighborhood_guess` during ingestion. The field is always null.

## Solution

### 1. Add neighborhood detection to both edge functions

Add a `detectNeighborhood()` function that scans the article title and summary for neighborhood keywords:

| Keyword Pattern | Assigned Neighborhood |
|---|---|
| `northridge` | Northridge |
| `porter ranch` | Porter Ranch |
| `granada hills` | Granada Hills |
| `chatsworth` | Chatsworth |
| `reseda` | Reseda |
| `winnetka` | Winnetka |
| `north hills` | North Hills |
| `canoga park` | Canoga Park |
| `mission hills` | Mission Hills |
| `san fernando valley`, `sfv` | San Fernando Valley |
| `csun` | Northridge |

If no keyword match is found, fall back to the source's `coverage_area` field (already populated for most sources).

If neither matches, set `neighborhood_guess = 'Unknown'`.

### 2. Apply during article insert

Set `neighborhood_guess` on each article record before inserting, using `detectNeighborhood(title, summary, source.coverage_area)`.

### 3. Backfill existing articles

Run a SQL migration that sets `neighborhood_guess` for existing articles based on their source's `coverage_area` when `neighborhood_guess IS NULL`. This immediately fixes the filter for all current data.

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/ingest-rss/index.ts` | Add `detectNeighborhood()`, assign on insert |
| `supabase/functions/ingest-watchlist/index.ts` | Same |
| New migration | Backfill existing articles from source coverage_area |

