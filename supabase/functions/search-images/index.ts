import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPexelsQueries(keyword: string): string[] {
  const clean = keyword.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const noAccents = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const queries = [clean, noAccents];
  if (!/\bbrazil\b/i.test(clean)) queries.push(`${noAccents} Brazil`);
  if (!/\b(beach|praia|trip|travel)\b/i.test(clean)) queries.push(`${noAccents} beach travel`);
  return Array.from(new Set(queries));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, count = 3 } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return new Response(JSON.stringify({ error: "keyword is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pexelsKey = Deno.env.get("PEXELS_API_KEY");
    if (!pexelsKey) {
      return new Response(JSON.stringify({ error: "PEXELS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let photos: any[] = [];
    for (const query of buildPexelsQueries(keyword)) {
      const resp = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&locale=pt-BR`,
        { headers: { Authorization: pexelsKey } }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Pexels API error:", resp.status, errText);
        continue;
      }

      const json = await resp.json();
      photos = json.photos ?? [];
      if (photos.length > 0) break;
    }

    if (photos.length === 0) {
      return new Response(JSON.stringify({ error: "No Pexels images found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pool = photos.slice(0, Math.min(10, photos.length));
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const urls = pool.slice(0, count).map((p: any) => p.src.large2x || p.src.large);

    return new Response(JSON.stringify({ urls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
