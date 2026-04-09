
/**
 * Fetches a destination photo URL via the search-images edge function.
 * Falls back to Unsplash Source if the edge function fails.
 */
export async function fetchDestinationImage(keyword: string): Promise<string | null> {
  const urls = await fetchDestinationImages(keyword, 1);
  return urls[0] ?? null;
}

/**
 * Fetches multiple destination photo URLs (up to `count`).
 * Uses the search-images edge function (Pexels API server-side).
 */
export async function fetchDestinationImages(keyword: string, count: number = 3): Promise<string[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("search-images", {
      body: { keyword, count },
    });

    if (!error && data?.urls && data.urls.length > 0) {
      return data.urls;
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: Unsplash Source
  return Array.from({ length: count }, (_, i) =>
    `https://source.unsplash.com/1080x720/?${encodeURIComponent(keyword)}&sig=${i + 1}`
  );
}
