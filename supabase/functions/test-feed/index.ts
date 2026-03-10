const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feed_url } = await req.json();
    if (!feed_url) {
      return new Response(JSON.stringify({ error: "feed_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(feed_url, {
      headers: { "User-Agent": "NorthridgeNow/1.0 RSS Reader" },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ reachable: false, error: `HTTP ${res.status} ${res.statusText}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xml = await res.text();

    // Count items
    const rssItems = xml.match(/<item[\s>]/gi) ?? [];
    const atomEntries = xml.match(/<entry[\s>]/gi) ?? [];
    const totalItems = rssItems.length + atomEntries.length;

    // Get first item as sample
    let sampleTitle = "";
    let sampleUrl = "";

    const itemMatch = xml.match(/<item[\s>]([\s\S]*?)<\/item>/i) || xml.match(/<entry[\s>]([\s\S]*?)<\/entry>/i);
    if (itemMatch) {
      sampleTitle = extractText(itemMatch[1], "title");
      sampleUrl = extractText(itemMatch[1], "link") || extractAttr(itemMatch[1], "link", "href");
    }

    return new Response(
      JSON.stringify({
        reachable: true,
        items_found: totalItems,
        sample_title: sampleTitle,
        sample_url: sampleUrl,
        feed_type: rssItems.length > 0 ? "RSS" : atomEntries.length > 0 ? "Atom" : "Unknown",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ reachable: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
