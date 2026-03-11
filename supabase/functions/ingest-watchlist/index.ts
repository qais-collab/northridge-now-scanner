import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── URL Normalization (Part 10) ──────────────────────────────────────────

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid",
]);

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    for (const p of TRACKING_PARAMS) u.searchParams.delete(p);
    u.hash = "";
    // Standardize trailing slash — remove from paths (except root)
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return raw;
  }
}

// ── Article Filtering (Part 7) ───────────────────────────────────────────

const JUNK_PATH_PATTERNS = [
  /\/tag\//i, /\/tags\//i, /\/category\//i, /\/categories\//i,
  /\/author\//i, /\/authors\//i, /\/search/i, /\/login/i, /\/signup/i,
  /\/register/i, /\/subscribe/i, /\/newsletter/i, /\/video-hub/i,
  /\/videos?\/?$/i, /\/archive\/?$/i, /\/page\/\d+/i,
  /\/wp-login/i, /\/wp-admin/i, /\/feed\/?$/i, /\/rss\/?$/i,
  /\/contact/i, /\/about\/?$/i, /\/privacy/i, /\/terms/i,
];

function isJunkUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return JUNK_PATH_PATTERNS.some((p) => p.test(path));
  } catch {
    return true;
  }
}

// ── Neighborhood Detection ───────────────────────────────────────────────

const NEIGHBORHOOD_PATTERNS: [RegExp, string][] = [
  [/\bporter\s+ranch\b/i, "Porter Ranch"],
  [/\bgranada\s+hills\b/i, "Granada Hills"],
  [/\bcanoga\s+park\b/i, "Canoga Park"],
  [/\bnorth\s+hills\b/i, "North Hills"],
  [/\bmission\s+hills\b/i, "Mission Hills"],
  [/\bnorthridge\b/i, "Northridge"],
  [/\bchatsworth\b/i, "Chatsworth"],
  [/\breseda\b/i, "Reseda"],
  [/\bwinnetka\b/i, "Winnetka"],
  [/\bencino\b/i, "Encino"],
  [/\btarzana\b/i, "Tarzana"],
  [/\bwoodland\s+hills\b/i, "Woodland Hills"],
  [/\bwest\s+hills\b/i, "West Hills"],
  [/\bpacoima\b/i, "Pacoima"],
  [/\barleta\b/i, "Arleta"],
  [/\bsylmar\b/i, "Sylmar"],
  [/\bsun\s+valley\b/i, "Sun Valley"],
  [/\bpanorama\s+city\b/i, "Panorama City"],
  [/\bvan\s+nuys\b/i, "Van Nuys"],
  [/\bsherman\s+oaks\b/i, "Sherman Oaks"],
  [/\bstudio\s+city\b/i, "Studio City"],
  [/\blake\s+balboa\b/i, "Lake Balboa"],
  [/\bcsun\b/i, "Northridge"],
  [/\bcal\s+state\s+northridge\b/i, "Northridge"],
  [/\bdevonshire\b/i, "Northridge"],
  [/\bnordhoff\b/i, "Northridge"],
  [/\bplummer\b/i, "Northridge"],
  [/\btampa\s+ave\b/i, "Northridge"],
  [/\blassen\s+st\b/i, "Northridge"],
  [/\bnorthridge\s+park\b/i, "Northridge"],
  [/\bnorthridge\s+academy\b/i, "Northridge"],
  [/\bnobel\s+m/i, "Northridge"],
  [/\bbeckford\b/i, "Northridge"],
  [/\bdearborn\s+park\b/i, "Northridge"],
  [/\brinaldi\b/i, "Porter Ranch"],
  [/\bsesnon\b/i, "Porter Ranch"],
  [/\bporter\s+ranch\s+town\s+center\b/i, "Porter Ranch"],
  [/\baliso\s+canyon\b/i, "Porter Ranch"],
  [/\blimekiln\s+canyon\b/i, "Porter Ranch"],
  [/\bbee\s+canyon\b/i, "Porter Ranch"],
  [/\bgranada\s+hills\s+charter\b/i, "Granada Hills"],
  [/\bcleveland\s+h/i, "Granada Hills"],
  [/\bzelzah\b/i, "Granada Hills"],
  [/\bknollwood\b/i, "Granada Hills"],
  [/\btopanga\b/i, "Chatsworth"],
  [/\bbox\s+canyon\b/i, "Chatsworth"],
  [/\bsanta\s+susana\b/i, "Chatsworth"],
  [/\bchatsworth\s+h/i, "Chatsworth"],
  [/\bstoney\s+point\b/i, "Chatsworth"],
  [/\bvanalden\b/i, "Reseda"],
  [/\bde\s+soto\b/i, "Canoga Park"],
  [/\bvanowen.*canoga\b/i, "Canoga Park"],
  [/\bowensmouth\b/i, "Canoga Park"],
  [/\broscoe\b/i, "North Hills"],
  [/\bwoodman\b/i, "North Hills"],
  [/\bbrand\s+park\b/i, "Mission Hills"],
  [/\bsepulveda\s+va\b/i, "Mission Hills"],
  [/\bsylmar\s+h/i, "Sylmar"],
  [/\bold\s+san\s+fernando\s+rd\b/i, "Sylmar"],
  [/\bbalboa\b/i, "Encino"],
  [/\bwoodley\b/i, "Encino"],
  [/\bsepulveda\s+basin\b/i, "Encino"],
  [/\bsan\s+fernando\s+valley\b/i, "San Fernando Valley"],
  [/\bsfv\b/i, "San Fernando Valley"],
];

function detectNeighborhood(title: string, summary: string, coverageArea: string | null): string {
  const text = `${title} ${summary}`;
  for (const [pattern, name] of NEIGHBORHOOD_PATTERNS) {
    if (pattern.test(text)) return name;
  }
  if (coverageArea) return coverageArea;
  return "Unknown";
}

// ── Relevance Scoring (Part 9) ───────────────────────────────────────────

const STRONG_LOCAL = /\b(Northridge|Porter\s+Ranch|Granada\s+Hills|Chatsworth|Reseda|Winnetka|North\s+Hills|Canoga\s+Park|Mission\s+Hills|CSUN|San\s+Fernando\s+Valley)\b/i;
const PRIORITY_KEYWORDS = /\b(fire|shooting|police|evacuation|road\s+closure|development|restaurant\s+opening|school\s+board|construction|earthquake|crash|arrest|homicide|robbery|power\s+outage|water\s+main|zoning|council\s+vote)\b/i;
const LOW_PRIORITY = /\b(sports|national\s+news|celebrity|basketball|baseball|football|soccer|tournament|athletics)\b/i;

function scoreArticle(
  title: string,
  summary: string,
  publishedAt: string | null,
  isHyperlocal: boolean
): number {
  const text = `${title} ${summary}`;
  let score = 0;

  if (STRONG_LOCAL.test(text)) score += 3;
  if (PRIORITY_KEYWORDS.test(text)) score += 2;
  if (isHyperlocal) score += 1;

  const isSports = LOW_PRIORITY.test(text);
  if (isSports && !STRONG_LOCAL.test(text)) score -= 2;

  if (!publishedAt) {
    score -= 2;
  } else {
    const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
    if (hours <= 24) score += 1;
  }

  return score;
}

// ── Freshness (Part 8) ──────────────────────────────────────────────────

function getFreshnessBucket(publishedAt: string | null): string {
  if (!publishedAt) return "older"; // no date → conservative
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (hours <= 2) return "breaking";
  if (hours <= 24) return "today";
  if (hours <= 72) return "recent";
  return "older";
}

// ── Link Extraction ─────────────────────────────────────────────────────

const ARTICLE_PATH_PATTERNS = ["/news", "/article", "/story", "/202", "/2026", "/2025", "/post", "/blog"];

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const re = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    let href = match[1].trim();
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;
    try {
      const resolved = new URL(href, baseUrl);
      href = resolved.href;
    } catch {
      continue;
    }
    links.push({ href, text });
  }
  return links;
}

function isArticleUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  return ARTICLE_PATH_PATTERNS.some((p) => path.includes(p));
}

function extractDateFromUrl(url: string): string | null {
  const m = url.match(/\/(20\d{2})\/(\d{1,2})\/(\d{1,2})/);
  if (m) {
    try {
      return new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T12:00:00Z`).toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function matchesExcludePatterns(url: string, patterns: string[] | null): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => url.toLowerCase().includes(p.toLowerCase()));
}

function matchesRequiredKeywords(text: string, keywords: string[] | null): boolean {
  if (!keywords || keywords.length === 0) return true; // no filter = pass
  return keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));
}

// ── Two-Stage Extraction (Part 6) ────────────────────────────────────────

interface ExtractedArticle {
  title: string;
  url: string;
  published_at: string | null;
  summary: string;
}

async function fetchArticleMeta(url: string): Promise<{ title: string; summary: string; date: string | null } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NorthridgeNow/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract title
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const htmlTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = ogTitle?.[1] || htmlTitle?.[1]?.replace(/<[^>]+>/g, "").trim() || "";

    // Extract description
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const summary = ogDesc?.[1]?.slice(0, 500) || metaDesc?.[1]?.slice(0, 500) || "";

    // Extract date
    const articleDate = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i);
    const timeTag = html.match(/<time[^>]*datetime=["']([^"']*)["']/i);
    const dateStr = articleDate?.[1] || timeTag?.[1] || null;
    let date: string | null = null;
    if (dateStr) {
      try { date = new Date(dateStr).toISOString(); } catch { /* skip */ }
    }

    return { title, summary, date };
  } catch {
    return null;
  }
}

function extractCandidateArticles(html: string, baseUrl: string, source: any): ExtractedArticle[] {
  const links = extractLinks(html, baseUrl);
  const seen = new Set<string>();
  const articles: ExtractedArticle[] = [];
  const excludePatterns = source.exclude_url_patterns as string[] | null;

  for (const { href, text } of links) {
    if (!isArticleUrl(href)) continue;
    const normalized = normalizeUrl(href);
    if (seen.has(normalized)) continue;
    if (isJunkUrl(normalized)) continue;
    if (matchesExcludePatterns(normalized, excludePatterns)) continue;
    seen.add(normalized);

    if (text.length < 15) continue;

    articles.push({
      title: text.slice(0, 300),
      url: normalized,
      published_at: extractDateFromUrl(href),
      summary: "",
    });
  }

  return articles;
}

// ── Main Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const scanStart = new Date().toISOString();
  let totalInserted = 0;
  let totalErrors = 0;
  let totalCandidates = 0;
  let totalRejected = 0;
  let sourcesChecked = 0;

  try {
    const { data: sources, error: srcErr } = await supabase
      .from("sources")
      .select("*")
      .eq("active", true)
      .eq("source_type", "watchlist")
      .not("base_url", "is", null);

    if (srcErr) throw srcErr;
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active watchlist sources found", inserted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing URLs for dedup
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("url")
      .not("url", "is", null);
    const existingUrls = new Set((existingArticles ?? []).map((a: any) => normalizeUrl(a.url)));

    for (const source of sources) {
      sourcesChecked++;
      const sourceStats = { candidates: 0, accepted: 0, rejected: 0 };

      try {
        const crawlUrl = source.base_url!;
        const res = await fetch(crawlUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NorthridgeNow/1.0)",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          totalErrors++;
          await supabase
            .from("sources")
            .update({ last_scan_at: new Date().toISOString(), last_error: `HTTP ${res.status}` })
            .eq("id", source.id);
          continue;
        }

        const html = await res.text();
        const candidates = extractCandidateArticles(html, crawlUrl, source);
        sourceStats.candidates = candidates.length;
        totalCandidates += candidates.length;

        const requiredKw = source.required_keywords as string[] | null;
        const isHyperlocal = source.category === "hyperlocal_publisher";

        // Stage 2: Fetch meta for each candidate (limited to 20 per source)
        const toProcess = candidates.filter((c) => !existingUrls.has(c.url)).slice(0, 20);
        const enriched: ExtractedArticle[] = [];

        for (const candidate of toProcess) {
          const meta = await fetchArticleMeta(candidate.url);
          if (meta) {
            enriched.push({
              title: meta.title || candidate.title,
              url: candidate.url,
              published_at: meta.date || candidate.published_at,
              summary: meta.summary || candidate.summary,
            });
          } else {
            enriched.push(candidate);
          }
        }

        // Filter by required keywords
        const filtered = enriched.filter((item) => {
          const text = `${item.title} ${item.summary}`;
          if (!matchesRequiredKeywords(text, requiredKw)) {
            sourceStats.rejected++;
            return false;
          }
          return true;
        });

        sourceStats.accepted = filtered.length;
        sourceStats.rejected += enriched.length - filtered.length;
        totalRejected += sourceStats.rejected;

        const newArticles = filtered.map((item) => ({
          title: item.title,
          url: item.url,
          published_at: item.published_at,
          summary: item.summary || null,
          source_id: source.id,
          source_name: source.name,
          status: "new" as const,
          relevance_score: scoreArticle(item.title, item.summary, item.published_at, isHyperlocal),
          freshness_bucket: getFreshnessBucket(item.published_at) as any,
          is_duplicate: false,
          use_for_newsletter: false,
          use_for_social: false,
          topic_guess: LOW_PRIORITY.test(`${item.title} ${item.summary}`) ? "sports" : null,
          neighborhood_guess: detectNeighborhood(item.title, item.summary, source.coverage_area),
        }));

        let sourceInserted = 0;
        if (newArticles.length > 0) {
          for (let i = 0; i < newArticles.length; i += 50) {
            const batch = newArticles.slice(i, i + 50);
            const { data: inserted, error: insErr } = await supabase
              .from("articles")
              .insert(batch)
              .select("id");

            if (insErr) {
              console.error(`Insert error for ${source.name}:`, insErr);
              totalErrors++;
            } else {
              sourceInserted += inserted?.length ?? 0;
              batch.forEach((a) => existingUrls.add(a.url));
            }
          }
        }

        totalInserted += sourceInserted;

        await supabase
          .from("sources")
          .update({
            last_scan_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            last_error: null,
            items_today: sourceInserted,
          })
          .eq("id", source.id);

        // Log per-source diagnostics
        await supabase.from("scan_runs").insert({
          started_at: scanStart,
          completed_at: new Date().toISOString(),
          articles_found: sourceInserted,
          duplicates_found: 0,
          candidates_found: sourceStats.candidates,
          rejected_count: sourceStats.rejected,
          scan_type: "watchlist",
          source_id: source.id,
        });
      } catch (e) {
        totalErrors++;
        console.error(`Error crawling ${source.name}:`, e);
        await supabase
          .from("sources")
          .update({
            last_scan_at: new Date().toISOString(),
            last_error: e instanceof Error ? e.message : String(e),
          })
          .eq("id", source.id);
      }
    }

    return new Response(
      JSON.stringify({
        sources_checked: sourcesChecked,
        articles_inserted: totalInserted,
        candidates_found: totalCandidates,
        rejected: totalRejected,
        errors: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Watchlist ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
