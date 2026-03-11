import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── URL Normalization ────────────────────────────────────────────────────

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid",
]);

function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    for (const p of TRACKING_PARAMS) u.searchParams.delete(p);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return raw;
  }
}

// ── XML Helpers ──────────────────────────────────────────────────────────

function extractText(xml: string, tag: string): string {
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i");
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? m[1].replace(/<[^>]+>/g, "").trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, "i");
  const m = xml.match(re);
  return m ? m[1].trim() : "";
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

function scoreArticle(title: string, summary: string, publishedAt: string | null, isHyperlocal: boolean): number {
  const text = `${title} ${summary}`;
  let score = 0;
  if (STRONG_LOCAL.test(text)) score += 3;
  if (PRIORITY_KEYWORDS.test(text)) score += 2;
  if (isHyperlocal) score += 1;
  if (LOW_PRIORITY.test(text) && !STRONG_LOCAL.test(text)) score -= 2;
  if (!publishedAt) {
    score -= 2;
  } else {
    const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
    if (hours <= 24) score += 1;
  }
  return score;
}

// ── Freshness ────────────────────────────────────────────────────────────

function getFreshnessBucket(publishedAt: string | null): string {
  if (!publishedAt) return "older";
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (hours <= 2) return "breaking";
  if (hours <= 24) return "today";
  if (hours <= 72) return "recent";
  return "older";
}

// ── RSS Parser ───────────────────────────────────────────────────────────

interface FeedItem {
  title: string;
  url: string;
  published_at: string | null;
  summary: string;
}

function parseRSS(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractText(block, "title");
    const link = extractText(block, "link") || extractAttr(block, "link", "href");
    const pubDate = extractText(block, "pubDate") || extractText(block, "dc:date") || extractText(block, "published");
    const summary = extractText(block, "description") || extractText(block, "summary") || extractText(block, "content:encoded");
    if (title && link) {
      items.push({
        title,
        url: normalizeUrl(link),
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
        summary: summary.slice(0, 500),
      });
    }
  }

  if (items.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = extractText(block, "title");
      const link = extractAttr(block, "link", "href") || extractText(block, "link");
      const pubDate = extractText(block, "published") || extractText(block, "updated");
      const summary = extractText(block, "summary") || extractText(block, "content");
      if (title && link) {
        items.push({
          title,
          url: normalizeUrl(link),
          published_at: pubDate ? new Date(pubDate).toISOString() : null,
          summary: summary.slice(0, 500),
        });
      }
    }
  }

  return items;
}

// ── Main ─────────────────────────────────────────────────────────────────

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
  let sourcesChecked = 0;

  try {
    const { data: sources, error: srcErr } = await supabase
      .from("sources")
      .select("*")
      .eq("active", true)
      .eq("source_type", "rss")
      .not("feed_url", "is", null);

    if (srcErr) throw srcErr;
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: "No active RSS sources found", inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingArticles } = await supabase
      .from("articles")
      .select("url")
      .not("url", "is", null);
    const existingUrls = new Set((existingArticles ?? []).map((a: any) => normalizeUrl(a.url)));

    for (const source of sources) {
      sourcesChecked++;
      try {
        const res = await fetch(source.feed_url!, {
          headers: { "User-Agent": "NorthridgeNow/1.0 RSS Reader" },
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

        const xml = await res.text();
        const items = parseRSS(xml);
        const isHyperlocal = source.category === "hyperlocal_publisher";
        let sourceInserted = 0;

        const newArticles = items
          .filter((item) => item.url && !existingUrls.has(item.url))
          .map((item) => ({
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

        // Log per-source scan
        await supabase.from("scan_runs").insert({
          started_at: scanStart,
          completed_at: new Date().toISOString(),
          articles_found: sourceInserted,
          duplicates_found: 0,
          candidates_found: items.length,
          rejected_count: items.length - newArticles.length,
          scan_type: "rss",
          source_id: source.id,
        });
      } catch (e) {
        totalErrors++;
        console.error(`Error fetching ${source.name}:`, e);
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
        errors: totalErrors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
