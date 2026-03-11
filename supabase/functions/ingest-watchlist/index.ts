import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Patterns that indicate an article URL */
const ARTICLE_PATH_PATTERNS = ["/news", "/article", "/story", "/202", "/2026"];

/** Extract all anchor links from HTML */
function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const links: { href: string; text: string }[] = [];
  const re = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    let href = match[1].trim();
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;

    // Resolve relative URLs
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

/** Check if a URL looks like an article link */
function isArticleUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  return ARTICLE_PATH_PATTERNS.some((p) => path.includes(p));
}

/** Try to extract a date from a URL path like /2026/03/10/ */
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

/** Extract preview text from nearby context — we just use the link text as a fallback */
function extractPreviewFromMeta(html: string, url: string): string {
  // Try to find og:description or meta description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  if (ogDesc) return ogDesc[1].slice(0, 300);
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (metaDesc) return metaDesc[1].slice(0, 300);
  return "";
}

const NEIGHBORHOOD_PATTERNS: [RegExp, string][] = [
  // Exact neighborhood names first
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
  // CSUN
  [/\bcsun\b/i, "Northridge"],
  [/\bcal\s+state\s+northridge\b/i, "Northridge"],
  // Streets & landmarks → Northridge
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
  // Streets & landmarks → Porter Ranch
  [/\brinaldi\b/i, "Porter Ranch"],
  [/\bsesnon\b/i, "Porter Ranch"],
  [/\bporter\s+ranch\s+town\s+center\b/i, "Porter Ranch"],
  [/\baliso\s+canyon\b/i, "Porter Ranch"],
  [/\blimekiln\s+canyon\b/i, "Porter Ranch"],
  [/\bbee\s+canyon\b/i, "Porter Ranch"],
  // Streets & landmarks → Granada Hills
  [/\bgranada\s+hills\s+charter\b/i, "Granada Hills"],
  [/\bcleveland\s+h/i, "Granada Hills"],
  [/\bzelzah\b/i, "Granada Hills"],
  [/\bknollwood\b/i, "Granada Hills"],
  // Streets & landmarks → Chatsworth
  [/\btopanga\b/i, "Chatsworth"],
  [/\bbox\s+canyon\b/i, "Chatsworth"],
  [/\bsanta\s+susana\b/i, "Chatsworth"],
  [/\bchatsworth\s+h/i, "Chatsworth"],
  [/\bstoney\s+point\b/i, "Chatsworth"],
  // Streets & landmarks → Reseda
  [/\bvanalden\b/i, "Reseda"],
  [/\bresheda\b/i, "Reseda"],
  // Streets & landmarks → Canoga Park
  [/\bde\s+soto\b/i, "Canoga Park"],
  [/\bvanowen.*canoga\b/i, "Canoga Park"],
  [/\bowensmouth\b/i, "Canoga Park"],
  // Streets & landmarks → North Hills
  [/\broscoe\b/i, "North Hills"],
  [/\bwoodman\b/i, "North Hills"],
  // Streets & landmarks → Mission Hills
  [/\bbrand\s+park\b/i, "Mission Hills"],
  [/\bsepulveda\s+va\b/i, "Mission Hills"],
  // Streets & landmarks → Sylmar
  [/\bsylmar\s+h/i, "Sylmar"],
  [/\bold\s+san\s+fernando\s+rd\b/i, "Sylmar"],
  // Streets & landmarks → Encino
  [/\bbalboa\b/i, "Encino"],
  [/\bwoodley\b/i, "Encino"],
  [/\bsepulveda\s+basin\b/i, "Encino"],
  // General SFV — keep last as fallback
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

interface ExtractedArticle {
  title: string;
  url: string;
  published_at: string | null;
  summary: string;
}

function extractArticles(html: string, baseUrl: string): ExtractedArticle[] {
  const links = extractLinks(html, baseUrl);
  const seen = new Set<string>();
  const articles: ExtractedArticle[] = [];

  for (const { href, text } of links) {
    if (!isArticleUrl(href)) continue;
    if (seen.has(href)) continue;
    seen.add(href);

    // Skip very short link text (likely navigation)
    if (text.length < 15) continue;

    articles.push({
      title: text.slice(0, 300),
      url: href,
      published_at: extractDateFromUrl(href),
      summary: "",
    });
  }

  return articles;
}

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
    // Get active watchlist sources
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
    const existingUrls = new Set((existingArticles ?? []).map((a: any) => a.url));

    for (const source of sources) {
      sourcesChecked++;
      try {
        const crawlUrl = source.base_url!;
        const res = await fetch(crawlUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NorthridgeNow/1.0)",
            "Accept": "text/html",
          },
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
        const items = extractArticles(html, crawlUrl);
        let sourceInserted = 0;

        const SPORTS_KEYWORDS = /\b(basketball|baseball|football|soccer|tournament|athletics)\b/i;
        const LOCAL_KEYWORDS = /\b(CSUN campus|Northridge|Porter Ranch|Granada Hills|Chatsworth|Reseda|Winnetka|North Hills|Canoga Park|San Fernando Valley)\b/i;
        const PRIORITY_KEYWORDS = /\b(fire|shooting|earthquake|crash|closure|arrest|homicide|robbery|evacuation|power outage|water main|zoning|council vote|school board)\b/i;
        const isHyperlocal = source.category === "hyperlocal_publisher";

        const newArticles = items
          .filter((item) => !existingUrls.has(item.url))
          .map((item) => {
            const text = `${item.title} ${item.summary}`;
            const isSports = SPORTS_KEYWORDS.test(text);
            const hasLocal = LOCAL_KEYWORDS.test(text);
            const hasKeyword = PRIORITY_KEYWORDS.test(text);
            const topicGuess = isSports ? "sports" : null;

            let score = 0;
            if (isSports && !hasLocal) score -= 2;
            if (hasKeyword) score += 2;
            if (isHyperlocal) score += 2;
            if (item.published_at) {
              const hours = (Date.now() - new Date(item.published_at).getTime()) / 3600000;
              if (hours <= 24) score += 1;
            }

            return {
              title: item.title,
              url: item.url,
              published_at: item.published_at,
              summary: item.summary || null,
              source_id: source.id,
              source_name: source.name,
              status: "new" as const,
              relevance_score: score,
              freshness_bucket: "today" as const,
              is_duplicate: false,
              use_for_newsletter: false,
              use_for_social: false,
              topic_guess: topicGuess,
              neighborhood_guess: detectNeighborhood(item.title, item.summary, source.coverage_area),
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

    // Log scan run
    await supabase.from("scan_runs").insert({
      started_at: scanStart,
      completed_at: new Date().toISOString(),
      articles_found: totalInserted,
      duplicates_found: 0,
    });

    return new Response(
      JSON.stringify({
        sources_checked: sourcesChecked,
        articles_inserted: totalInserted,
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
