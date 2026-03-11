

# Fix: Neighborhood Detection Too Broad

## Problem
175 of 203 articles are tagged "San Fernando Valley" because the `detectNeighborhood()` function only matches keywords in the article title/summary. Most articles don't mention a specific neighborhood name, so they fall back to the source's `coverage_area` — which is "San Fernando Valley" for nearly every non-hyperlocal source. The other city filters (Porter Ranch, Granada Hills, Chatsworth, etc.) return 0 results because no articles are actually tagged with those values.

## Root Cause
The keyword list is too narrow. Only exact neighborhood names are checked. Articles about "Devonshire Division" (Northridge), "Topanga Canyon" (Chatsworth), "Tampa Ave" (Reseda/Northridge), school names, park names, and other geographic markers are missed entirely.

## Solution

### 1. Expand neighborhood keyword detection in both edge functions

Add secondary geographic markers that map to neighborhoods:

| Markers | Maps To |
|---|---|
| `devonshire`, `lassen`, `tampa ave`, `nordhoff`, `plummer` | Northridge |
| `rinaldi`, `sesnon`, `porter ranch town center` | Porter Ranch |
| `balboa`, `woodley`, `sepulveda basin` | Encino / add to list |
| `topanga`, `box canyon`, `santa susana` | Chatsworth |
| `zelzah`, `chatsworth st.*granada` | Granada Hills |
| `roscoe`, `woodman` | North Hills |
| `de soto`, `vanowen.*canoga` | Canoga Park |
| School names: `Nobel MS`, `Beckford`, `Parthenia`, `Cleveland HS`, `Granada Hills Charter`, `Chatsworth HS`, `Northridge Academy` | Respective neighborhoods |
| Parks: `Bee Canyon`, `Aliso Canyon`, `Dearborn Park`, `Northridge Park`, `Limekiln Canyon` | Respective neighborhoods |

### 2. Add `sports` to NEIGHBORHOODS list if not present — or keep as topic only

Sports is a topic, not a neighborhood — no change needed here.

### 3. Backfill existing articles with improved detection

Run a SQL + edge function approach:
- Create a one-time edge function or SQL function that re-runs the expanded detection against all existing article titles/summaries
- Update articles currently tagged "San Fernando Valley" or "Unknown" if a more specific neighborhood can be detected

### 4. Implementation details

**Files to modify:**
- `supabase/functions/ingest-rss/index.ts` — expand `NEIGHBORHOOD_PATTERNS` array
- `supabase/functions/ingest-watchlist/index.ts` — same expansion
- **New migration** — SQL update to re-tag existing articles using `CASE WHEN title ~* 'devonshire|lassen|...' THEN 'Northridge' ...` pattern

The expanded pattern list will be ~30-40 entries covering streets, schools, parks, landmarks, and police divisions that uniquely identify each SFV neighborhood. Articles that still don't match any specific marker will remain "San Fernando Valley" — that's correct for genuinely region-wide stories.

