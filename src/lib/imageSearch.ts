
const PEXELS_API_KEY = (import.meta.env.PEXELS_API_KEY || import.meta.env.VITE_PEXELS_API_KEY) as string | undefined;

function buildPexelsQueries(keyword: string): string[] {
  const clean = keyword.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const noAccents = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return Array.from(new Set([clean, noAccents]));
}

/**
 * Fetches a single destination photo URL.
 */
export async function fetchDestinationImage(keyword: string): Promise<string | null> {
  const urls = await fetchDestinationImages(keyword, 1);
  return urls[0] ?? null;
}

/**
 * Fetches multiple destination photo URLs (up to `count`) via Pexels API.
 * Falls back to picsum.photos if Pexels is unavailable.
 */
export async function fetchDestinationImages(keyword: string, count: number = 3): Promise<string[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("search-images", {
      body: { keyword, count },
    });
    if (!error && Array.isArray(data?.urls) && data.urls.length > 0) {
      return data.urls.slice(0, count);
    }
  } catch {
    // fall through to local fallback/direct key path
  }

  if (PEXELS_API_KEY) {
    for (const query of buildPexelsQueries(keyword)) {
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.max(count, 8)}&orientation=landscape&locale=pt-BR`,
          { headers: { Authorization: PEXELS_API_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          const urls = (data.photos ?? [])
            .map((p: { src: { large2x?: string; large?: string } }) => p.src.large2x || p.src.large)
            .filter(Boolean)
            .slice(0, count) as string[];
          if (urls.length > 0) return urls;
        }
      } catch {
        // try next query
      }
    }
  }

  // Fallback: deterministic placeholder images
  return Array.from({ length: count }, (_, i) =>
    `https://picsum.photos/seed/${encodeURIComponent(keyword)}-${i + 1}/1080/720`
  );
}
