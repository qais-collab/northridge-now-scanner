

# Triage Speed Optimization Plan

## Overview
Refactor the Dashboard and ArticleCard components for maximum editorial scanning speed. Add sort controls, compact scan mode, enhanced filters, duplicate group expansion, source badges, and a digest preview button.

---

## 1. ArticleCard Redesign

**Current**: Cards use `p-3`, `space-y-2` gaps, summary and "why it matters" take significant vertical space.

**Changes**:
- Reduce padding to `p-2`, tighten all internal spacing
- Make headline `text-sm font-bold` — visually dominant, single line with `line-clamp-1` (expand on hover/click)
- Move source name directly after headline on the same line, styled as `font-semibold text-primary` (e.g., "Fire at Porter Ranch — **LA Daily News**")
- Summary: single line `line-clamp-1` in normal mode, hidden in compact mode
- "Why it matters": hidden by default, visible only on hover or expand
- Add `compact` prop behavior: when true, hide summary, why_it_matters, note button — show only headline + source + score + badges + core actions
- **Duplicate indicator**: Replace simple "DUP" badge with "📰 Reported by 3 sources" collapsible section showing the duplicate group (query articles with same `duplicate_group_id`)
- **Source badges row**: Show small inline badges for neighborhood, topic, and source category — all on the metadata line

**Action bar changes**:
- Keep all 8 actions visible as icon-only buttons (no text labels) with tooltips, in a single tight row
- Use filled/colored icons for active states (newsletter, social)

## 2. Compact Scan Mode Toggle

- Add a `compactMode` state toggle in Dashboard header area, labeled "Compact Scan"
- When active: cards use `py-1.5 px-2`, headline is single-line, no summary/why_it_matters, actions are icon-only, article list uses `space-y-1` instead of `space-y-2`
- Pass `compact` prop to all ArticleCards

## 3. Sort Controls

Add a sort dropdown/segmented control above the article list:
- **Options**: Relevance Score (default), Freshness, Source Priority, Publish Time, Neighborhood
- Implement client-side sorting on the fetched articles array (already loaded)
- Sort options: `relevance_score` desc, `freshness_bucket` enum order, source priority (need to join/lookup), `published_at` desc, `neighborhood_guess` alpha

## 4. Enhanced Filters

Expand the filter bar on Dashboard and Leads pages:
- Add **Source filter** — dropdown populated from `useSources()` hook
- Add **Freshness filter** — select with options: All, Last 24h, Last 72h, This Week
- Freshness filter applies client-side date math against `published_at`
- Make filter bar slightly more prominent with labeled sections

## 5. Duplicate Group Expansion

- When an article has `duplicate_group_id` and `is_duplicate === false` (i.e., it's the primary), show a clickable "Reported by N sources" indicator
- On click, expand inline to show the other articles in the same duplicate group (fetched via `duplicate_group_id`)
- Use a collapsible within the card

## 6. Digest Preview Button

- Add a "Preview Digest" button in the Dashboard header (next to stats or filter bar)
- Opens a Dialog/Sheet showing the current shortlisted + newsletter articles in the Daily Digest format (reuse Digest page component or extract a `DigestPreview` component)
- Read-only view, sorted by topic then score

## 7. Files Changed

| File | Change |
|---|---|
| `src/components/ArticleCard.tsx` | Complete redesign for density, icon-only actions, duplicate expansion, source badges |
| `src/pages/Dashboard.tsx` | Add sort controls, compact mode toggle, source/freshness filters, digest preview button |
| `src/pages/Leads.tsx` | Same filter/sort/compact enhancements |
| `src/components/DigestPreview.tsx` | New — reusable digest preview in a Sheet |
| `src/hooks/use-articles.ts` | Add freshness filter param, add `useDuplicateGroup` hook |

