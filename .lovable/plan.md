

# Northridge Now Local News Scanner — Implementation Plan

## Overview
A calm, professional newsroom command center for a local editor to scan ~40 San Fernando Valley news sources, triage article leads, and shortlist the best 10–15 stories daily. Built with Lovable Cloud (Supabase), seeded with realistic demo data.

---

## Phase 1: Database Setup (Lovable Cloud)

Create all normalized tables:
- **sources** — name, category, base_url, feed_url, source_type, coverage_area, priority, active, notes, last_checked_at
- **articles** — source_id (FK), title, url, summary, image_url, published_at, imported_at, source_name, neighborhood_guess, topic_guess, relevance_score, duplicate_group_id, is_duplicate, status (new/reviewed/saved/dismissed/shortlisted), use_for_newsletter, use_for_social, editor_notes, why_it_matters, raw_location_text, freshness_bucket
- **article_tags** — article_id, tag
- **neighborhoods** — id, name, display_order
- **shortlists** — id, name (newsletter/social/maybe-later/dismissed/reviewed)
- **scan_runs** — id, started_at, completed_at, articles_found, duplicates_found

RLS policies allowing full access (no auth for now). Seed with 10–15 realistic SFV sources and 25+ articles with varied neighborhoods, topics, duplicates, and statuses.

---

## Phase 2: App Layout & Navigation

- **Left sidebar** using shadcn Sidebar: Dashboard, Today's Leads, Shortlists, Sources, Daily Digest, Quick Add, Settings
- **Top bar** with global search input and filter controls
- **Main content area** — central article list
- Clean, minimal, professional newsroom aesthetic — no decorative elements, prioritize density and readability

---

## Phase 3: Dashboard (Home Page)

- **Top metrics row**: New articles today, Duplicates detected, Shortlisted, Newsletter picks, Social picks
- **Filter bar**: Date range, source, category, neighborhood, topic, score range, status, hide duplicates toggle, newsletter/social only toggles
- **Neighborhood filters**: Northridge, Porter Ranch, Granada Hills, Chatsworth, Reseda, Winnetka, North Hills, Canoga Park, Mission Hills, San Fernando Valley, Unknown
- **Topic filters**: Breaking news, public safety, traffic, schools, business, events, civic planning, community, weather

---

## Phase 4: Article Cards & Triage

Each card displays: headline, source, publish time, neighborhood tag, topic tag, relevance score badge, freshness indicator, summary snippet, "why it matters" line.

**Quick actions on each card**: Save, Dismiss, Mark Reviewed, Add to Newsletter, Add to Social, Mark Duplicate, Add Note, Open Original Link.

Cards are designed for fast scanning — compact layout, clear visual hierarchy, keyboard-friendly.

---

## Phase 5: Relevance Scoring Engine

Client-side rule-based scoring:
- +3 Northridge mention, +2 adjacent neighborhoods, +2 fresh (24h), +1 recent (72h), +2 priority topics, +1 events/business, -2 duplicate, -2 outside coverage, +1 high-priority source

Score displayed as a colored badge on each card. Scoring applied on data load and when articles are added.

---

## Phase 6: Duplicate Detection

Match by: identical URLs, very similar titles (fuzzy match), same date + similar headline.

UI: "Hide duplicates" toggle, duplicate group indicator, ability to view grouped duplicates and mark/unmark.

---

## Phase 7: Source Manager Page

Full CRUD table for sources with columns: name, category, priority, active toggle, last pull time, articles pulled today, source type, actions (edit/disable).

**Add/Edit Source form**: All source fields including feed URL, category dropdown, priority slider, source type selector, notes.

---

## Phase 8: Shortlists Page

Tab-based view: Newsletter, Social, Maybe Later, Dismissed, Reviewed.

Drag or button-based movement between lists. Each list shows article cards with counts.

---

## Phase 9: Daily Digest Page

Top 15 leads grouped by topic, sorted by score + freshness. Clean read-only view showing headline, source, summary, why it matters, neighborhood. Designed for easy copy/review.

---

## Phase 10: Quick Add Article Page

Form with: Headline, URL, Source (dropdown), Publish Date, Summary, Neighborhood (dropdown), Topic (dropdown), Notes. Saves directly to articles table with status "new".

---

## Phase 11: Settings Page

- Scoring weight controls (sliders for each scoring rule)
- Neighborhood manager (add/edit/reorder)
- Topic taxonomy manager
- Default digest size setting
- Source priority rules

---

## Phase 12: Global Search

Search across headlines, source names, URLs, notes, neighborhoods. Results displayed inline in the main content area with highlighting.

---

## Seed Data

- **Sources**: Daily News, Patch Northridge, CSUN newspaper, LAPD Valley Bureau, Metro, LAUSD, Nextdoor signals, local blogs, city council feeds, etc.
- **Articles**: 25+ realistic entries across neighborhoods and topics, including 3–4 duplicate groups, some pre-shortlisted items, varied dates and scores.

