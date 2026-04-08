/**
 * Fetches a destination photo URL.
 * Uses Pexels API if VITE_PEXELS_API_KEY is set in .env,
 * otherwise falls back to Unsplash Source (deprecated but functional).
 */
export async function fetchDestinationImage(keyword: string): Promise<string | null> {
  const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

  if (pexelsKey) {
    try {
      const resp = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      );
      if (resp.ok) {
        const json = await resp.json() as {
          photos?: { src: { large2x: string; large: string } }[];
        };
        if (json.photos && json.photos.length > 0) {
          // Pick randomly from the top 5 results for variety
          const pick = json.photos[Math.floor(Math.random() * Math.min(5, json.photos.length))];
          return pick.src.large2x || pick.src.large;
        }
      }
    } catch {
      // fall through to fallback
    }
  }

  // Fallback: Unsplash Source (may return generic results)
  return `https://source.unsplash.com/1080x720/?${encodeURIComponent(keyword)}`;
}
