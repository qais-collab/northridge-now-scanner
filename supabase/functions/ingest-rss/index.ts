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

// ── Text Normalization ───────────────────────────────────────────────────

function normalizeText(title: string, summary: string): string {
  return `${title} ${summary}`
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

// ── 3-Tier Location Detection ────────────────────────────────────────────

// Priority order for multi-match resolution
const PRIORITY_NEIGHBORHOODS = [
  "Northridge", "Porter Ranch", "Granada Hills", "Chatsworth",
  "Reseda", "Winnetka", "North Hills", "Canoga Park", "Mission Hills",
  "Lake Balboa", "Van Nuys", "Sherman Oaks", "Encino", "San Fernando",
  "Tarzana", "Woodland Hills", "West Hills", "Pacoima", "Arleta",
  "Sylmar", "Sun Valley", "Panorama City", "Studio City",
];

// Tier 1: City names (highest confidence) — multi-word first
const TIER1_CITIES: [RegExp, string][] = [
  [/\bporter\s*ranch\b/, "Porter Ranch"],
  [/\bgranada\s*hills\b/, "Granada Hills"],
  [/\bcanoga\s*park\b/, "Canoga Park"],
  [/\bnorth\s*hills\b/, "North Hills"],
  [/\bmission\s*hills\b/, "Mission Hills"],
  [/\blake\s*balboa\b/, "Lake Balboa"],
  [/\bvan\s*nuys\b/, "Van Nuys"],
  [/\bsherman\s*oaks\b/, "Sherman Oaks"],
  [/\bwoodland\s*hills\b/, "Woodland Hills"],
  [/\bwest\s*hills\b/, "West Hills"],
  [/\bsun\s*valley\b/, "Sun Valley"],
  [/\bpanorama\s*city\b/, "Panorama City"],
  [/\bstudio\s*city\b/, "Studio City"],
  [/\bsan\s*fernando\s*valley\b/, "San Fernando Valley"],
  [/\bnorthridge\b/, "Northridge"],
  [/\bchatsworth\b/, "Chatsworth"],
  [/\breseda\b/, "Reseda"],
  [/\bwinnetka\b/, "Winnetka"],
  [/\bencino\b/, "Encino"],
  [/\btarzana\b/, "Tarzana"],
  [/\bpacoima\b/, "Pacoima"],
  [/\barleta\b/, "Arleta"],
  [/\bsylmar\b/, "Sylmar"],
  [/\bsan\s*fernando\b/, "San Fernando"],
];

// Tier 2: Landmarks (medium confidence)
const TIER2_LANDMARKS: [RegExp, string][] = [
  [/\bcal\s*state\s*northridge\b/, "Northridge"],
  [/\bcsun\b/, "Northridge"],
  [/\bdevonshire\s+division\b/, "Northridge"],
  [/\bnorthridge\s+academy\b/, "Northridge"],
  [/\bnorthridge\s+park\b/, "Northridge"],
  [/\bnobel\s+middle\b/, "Northridge"],
  [/\bbeckford\s+(elementary|charter|school)\b/, "Northridge"],
  [/\bdearborn\s+park\b/, "Northridge"],
  [/\bporter\s+ranch\s+town\s+center\b/, "Porter Ranch"],
  [/\baliso\s+canyon\b/, "Porter Ranch"],
  [/\blimekiln\s+canyon\b/, "Porter Ranch"],
  [/\bbee\s+canyon\b/, "Porter Ranch"],
  [/\bgranada\s+hills\s+charter\b/, "Granada Hills"],
  [/\bcleveland\s+high\b/, "Granada Hills"],
  [/\bknollwood\s+(country|golf)\b/, "Granada Hills"],
  [/\btopanga\s+canyon\b/, "Chatsworth"],
  [/\btopanga\s+boulevard\b/, "Chatsworth"],
  [/\bbox\s+canyon\b/, "Chatsworth"],
  [/\bsanta\s+susana\b/, "Chatsworth"],
  [/\bstoney\s+point\b/, "Chatsworth"],
  [/\bchatsworth\s+high\b/, "Chatsworth"],
  [/\bbalboa\s+park\b/, "Van Nuys"],
  [/\bbalboa\s+boulevard\b/, "Van Nuys"],
  [/\bvan\s+nuys\s+airport\b/, "Van Nuys"],
  [/\bsepulveda\s+basin\b/, "Encino"],
  [/\bsylmar\s+high\b/, "Sylmar"],
  [/\bbrand\s+park\b/, "Mission Hills"],
  [/\bowensmouth\b/, "Canoga Park"],
];

// Tier 3: Streets & Freeways (low confidence)
const TIER3_STREETS: [RegExp, string][] = [
  [/\b118\s*(freeway|fwy)\b/, "Chatsworth"],
  [/\bsr[\s-]*118\b/, "Chatsworth"],
  [/\broute\s*118\b/, "Chatsworth"],
  [/\b405\s*(freeway|fwy)\b/, "Van Nuys"],
  [/\bi[\s-]*405\b/, "Van Nuys"],
  [/\b101\s*(freeway|fwy)\b/, "Encino"],
  [/\bus[\s-]*101\b/, "Encino"],
  [/\breseda\s+(blvd|boulevard)\b/, "Reseda"],
  [/\bbalboa\s+(blvd|boulevard)\b/, "Van Nuys"],
  [/\btopanga\s+canyon\s+(blvd|boulevard)\b/, "Chatsworth"],
  [/\brinaldi\s+(st|street)\b/, "Porter Ranch"],
  [/\bsesnon\s+(blvd|boulevard)\b/, "Porter Ranch"],
  [/\bzelzah\s+(ave|avenue)\b/, "Granada Hills"],
  [/\bnordhoff\s+(st|street)\b/, "Northridge"],
  [/\bdevonshire\s+(st|street)\b/, "Northridge"],
  [/\bplummer\s+(st|street)\b/, "Northridge"],
  [/\btampa\s+(ave|avenue)\b/, "Northridge"],
  [/\blassen\s+(st|street)\b/, "Northridge"],
  [/\bde\s+soto\s+(ave|avenue)\b/, "Canoga Park"],
  [/\broscoe\s+(blvd|boulevard)\b/, "North Hills"],
  [/\bwoodman\s+(ave|avenue)\b/, "North Hills"],
  [/\bold\s+san\s+fernando\s+(rd|road)\b/, "Sylmar"],
];

const STRONG_LOCAL_CITIES = new Set([
  "Northridge", "Porter Ranch", "Granada Hills", "Chatsworth",
]);
const OTHER_VALLEY_CITIES = new Set([
  "Reseda", "Winnetka", "North Hills", "Canoga Park", "Mission Hills",
  "Lake Balboa", "Van Nuys", "Sherman Oaks", "Encino", "San Fernando",
  "Tarzana", "Woodland Hills", "West Hills", "Pacoima", "Arleta",
  "Sylmar", "Sun Valley", "Panorama City", "Studio City",
]);

interface DetectionResult {
  neighborhood: string;
  tier: number; // 1=city, 2=landmark, 3=street, 0=fallback
  matchedPattern: string;
}

function detectNeighborhood(title: string, summary: string, coverageArea: string | null): DetectionResult {
  const text = normalizeText(title, summary);
  const allMatches: { name: string; tier: number; pattern: string }[] = [];

  for (const [re, name] of TIER1_CITIES) {
    if (re.test(text)) allMatches.push({ name, tier: 1, pattern: re.source });
  }
  for (const [re, name] of TIER2_LANDMARKS) {
    if (re.test(text)) allMatches.push({ name, tier: 2, pattern: re.source });
  }
  for (const [re, name] of TIER3_STREETS) {
    if (re.test(text)) allMatches.push({ name, tier: 3, pattern: re.source });
  }

  if (allMatches.length === 0) {
    return { neighborhood: coverageArea || "Unknown", tier: 0, matchedPattern: "fallback" };
  }

  // Pick highest tier match; within same tier, use priority order
  allMatches.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const ai = PRIORITY_NEIGHBORHOODS.indexOf(a.name);
    const bi = PRIORITY_NEIGHBORHOODS.indexOf(b.name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const best = allMatches[0];
  console.log(`[detect] "${title.slice(0, 60)}" → ${best.name} (tier ${best.tier}, pattern: ${best.pattern})`);
  return { neighborhood: best.name, tier: best.tier, matchedPattern: best.pattern };
}

// ── Relevance Scoring ────────────────────────────────────────────────────

const PRIORITY_KEYWORDS = /\b(fire|shooting|police|evacuation|road\s*closure|development|restaurant\s*opening|school\s*board|construction|earthquake|crash|arrest|homicide|robbery|power\s*outage|water\s*main|zoning|council\s*vote)\b/i;
const LOW_PRIORITY = /\b(sports|national\s*news|celebrity|basketball|baseball|football|soccer|tournament|athletics)\b/i;

function scoreArticle(
  title: string,
  summary: string,
  publishedAt: string | null,
  isHyperlocal: boolean,
  detection: DetectionResult,
): number {
  const text = normalizeText(title, summary);
  let score = 0;

  // Location signals
  if (detection.tier === 1) {
    score += STRONG_LOCAL_CITIES.has(detection.neighborhood) ? 3 : 2;
  } else if (detection.tier === 2) {
    score += 1;
  } else if (detection.tier === 3) {
    score += 1;
  } else {
    score -= 2; // no location detected
  }

  // Priority events
  if (PRIORITY_KEYWORDS.test(text)) score += 2;

  // Hyperlocal source bonus
  if (isHyperlocal) score += 1;

  // Sports penalty
  if (LOW_PRIORITY.test(text) && detection.tier === 0) score -= 2;

  // Freshness
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
          .map((item) => {
            const detection = detectNeighborhood(item.title, item.summary, source.coverage_area);
            return {
              title: item.title,
              url: item.url,
              published_at: item.published_at,
              summary: item.summary || null,
              source_id: source.id,
              source_name: source.name,
              status: "new" as const,
              relevance_score: scoreArticle(item.title, item.summary, item.published_at, isHyperlocal, detection),
              freshness_bucket: getFreshnessBucket(item.published_at) as any,
              is_duplicate: false,
              use_for_newsletter: false,
              use_for_social: false,
              topic_guess: LOW_PRIORITY.test(`${item.title} ${item.summary}`) ? "sports" : null,
              neighborhood_guess: detection.neighborhood,
            };
          });

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
