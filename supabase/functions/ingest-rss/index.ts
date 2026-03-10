import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractText(xml: string, tag: string): string {
  // Try CDATA first
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

interface FeedItem {
  title: string;
  url: string;
  published_at: string | null;
  summary: string;
}

function parseRSS(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // RSS 2.0 items
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
        url: link,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
        summary: summary.slice(0, 500),
      });
    }
  }

  // Atom entries
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
          url: link,
          published_at: pubDate ? new Date(pubDate).toISOString() : null,
          summary: summary.slice(0, 500),
        });
      }
    }
  }

  return items;
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
    // Get active RSS sources
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

    // Get existing URLs for dedup
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("url")
      .not("url", "is", null);
    const existingUrls = new Set((existingArticles ?? []).map((a: any) => a.url));

    for (const source of sources) {
      sourcesChecked++;
      try {
        const res = await fetch(source.feed_url!, {
          headers: { "User-Agent": "NorthridgeNow/1.0 RSS Reader" },
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
        let sourceInserted = 0;

        const SPORTS_KEYWORDS = /\b(basketball|baseball|football|soccer|tournament|athletics)\b/i;
        const LOCAL_KEYWORDS = /\b(CSUN campus|Northridge|Porter Ranch|Granada Hills|Chatsworth|Reseda|Winnetka|North Hills|Canoga Park|San Fernando Valley)\b/i;
        const PRIORITY_KEYWORDS = /\b(fire|shooting|earthquake|crash|closure|arrest|homicide|robbery|evacuation|power outage|water main|zoning|council vote|school board)\b/i;
        const isHyperlocal = source.category === "hyperlocal_publisher";

        const newArticles = items
          .filter((item) => item.url && !existingUrls.has(item.url))
          .map((item) => {
            const text = `${item.title} ${item.summary}`;
            const isSports = SPORTS_KEYWORDS.test(text);
            const hasLocal = LOCAL_KEYWORDS.test(text);
            const hasKeyword = PRIORITY_KEYWORDS.test(text);
            const topicGuess = isSports ? "sports" : null;

            let score = 0;
            // Sports penalty unless local
            if (isSports && !hasLocal) score -= 2;
            // Keyword match +2
            if (hasKeyword) score += 2;
            // Hyperlocal source +2
            if (isHyperlocal) score += 2;
            // Published today +1
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
            };
          });

        if (newArticles.length > 0) {
          // Insert in batches of 50
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
              sourceInserted += (inserted?.length ?? 0);
              // Add URLs to dedup set
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
    console.error("Ingestion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
