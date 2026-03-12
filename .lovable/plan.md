

# Upgrade Location Detection and Relevance Scoring

## What's Changing

The current `detectNeighborhood()` function and `scoreArticle()` in both edge functions already have ~65 regex patterns and basic scoring. This upgrade restructures them into a cleaner, more accurate system with text normalization, tiered signal detection, and improved scoring that differentiates between strong local cities (+3), other Valley cities (+2), and landmark/street signals (+1).

## Current Problems
- Many patterns are Northridge-biased (streets like `Devonshire`, `Plummer` default to Northridge even when they cross multiple neighborhoods)
- No text normalization — matching relies on raw title+summary with inconsistent casing/punctuation
- No freeway detection (118, 405, 101)
- Scoring doesn't differentiate between a direct city match (+3) vs a landmark hint (+1)
- `balboa` maps to Encino but should map to multiple (Lake Balboa, Van Nuys)
- No debug logging for detection decisions

## Implementation

### 1. Add `normalizeText()` to both edge functions
Combines title + summary, lowercases, strips punctuation, collapses whitespace. All detection runs against this normalized string.

### 2. Restructure detection into 3 tiers (checked in order)

**Tier 1 — City names** (highest confidence):
The existing city patterns (Northridge, Porter Ranch, Granada Hills, Chatsworth, Reseda, Winnetka, North Hills, Canoga Park, Mission Hills, Lake Balboa, Van Nuys, Sherman Oaks, Encino, San Fernando, Tarzana, Woodland Hills, West Hills, Pacoima, Arleta, Sylmar, Sun Valley, Panorama City, Studio City) — checked first with multi-word patterns before single-word.

**Tier 2 — Landmarks** (medium confidence):
- `csun`, `cal state northridge` → Northridge
- `devonshire division` → Northridge (but bare `devonshire` removed — too ambiguous)
- `topanga canyon`, `topanga boulevard` → Chatsworth
- `balboa park`, `balboa boulevard` → Van Nuys (not Encino)
- `van nuys airport` → Van Nuys
- `sepulveda basin` → Encino
- `stoney point` → Chatsworth
- `granada hills charter`, `cleveland high` → Granada Hills
- `porter ranch town center` → Porter Ranch
- Schools, parks as before but with more specific patterns

**Tier 3 — Streets/Freeways** (low confidence, still useful):
- `118 freeway`, `sr-118`, `route 118` → Chatsworth/Porter Ranch
- `405 freeway`, `i-405` → Van Nuys/Sherman Oaks  
- `101 freeway`, `us-101` → Encino/Sherman Oaks
- `reseda blvd`, `reseda boulevard` → Reseda
- `balboa blvd` → Van Nuys
- `topanga canyon blvd` → Chatsworth

### 3. Multi-location priority
If multiple neighborhoods are detected, use a priority list: Northridge > Porter Ranch > Granada Hills > Chatsworth > Reseda > Winnetka > North Hills > Canoga Park > Mission Hills > other Valley cities.

### 4. Updated scoring in both edge functions

| Signal | Points |
|---|---|
| Strong local city (Northridge, Porter Ranch, Granada Hills, Chatsworth) | +3 |
| Other Valley city match | +2 |
| Landmark match | +1 |
| Street/freeway signal | +1 |
| Priority event keyword | +2 |
| Hyperlocal source | +1 |
| Sports without local signals | -2 |
| No location signals at all | -2 |
| Missing publish date | -2 |

### 5. Update `src/lib/scoring.ts` (client-side re-scoring)
Add the same tiered scoring logic so the dashboard's `calculateRelevanceScore()` matches the edge function behavior. Add Van Nuys, Sherman Oaks, Encino, Lake Balboa etc. to `STRONG_LOCAL_AREAS` as secondary (+2) tier.

### 6. Debug logging
Add `console.log` in `detectNeighborhood()` outputting: article title (truncated), matched pattern, detected neighborhood, score adjustments. These appear in edge function logs for debugging.

### 7. Backfill existing articles
Run a data update to re-tag articles currently marked "San Fernando Valley" or "Unknown" using the improved detection against their title+summary fields. This uses SQL `CASE WHEN` with regex matching.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/ingest-rss/index.ts` | Restructured detection + scoring |
| `supabase/functions/ingest-watchlist/index.ts` | Same changes |
| `src/lib/scoring.ts` | Add tiered city scoring, expand local areas |
| Database update | Re-tag existing articles with improved detection |

