/**
 * Fetches a destination photo URL.
 * Uses Pexels API if VITE_PEXELS_API_KEY is set in .env,
 * otherwise falls back to Unsplash Source (deprecated but functional).
 */
export async function fetchDestinationImage(keyword: string): Promise<string | null> {
  const urls = await fetchDestinationImages(keyword, 1);
  return urls[0] ?? null;
}

/**
 * Fetches multiple destination photo URLs (up to `count`).
 * Uses Pexels API if VITE_PEXELS_API_KEY is set, otherwise Unsplash Source fallback.
 */
export async function fetchDestinationImages(keyword: string, count: number = 3): Promise<string[]> {
  const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

  if (pexelsKey) {
    try {
      const resp = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=15&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      );
      if (resp.ok) {
        const json = await resp.json() as {
          photos?: { src: { large2x: string; large: string } }[];
        };
        if (json.photos && json.photos.length > 0) {
          // Shuffle top results for variety
          const pool = json.photos.slice(0, Math.min(10, json.photos.length));
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          return shuffled.slice(0, count).map(p => p.src.large2x || p.src.large);
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback: Unsplash Source with different sig for each image
  return Array.from({ length: count }, (_, i) =>
    `https://source.unsplash.com/1080x720/?${encodeURIComponent(keyword)}&sig=${i + 1}`
  );
}
