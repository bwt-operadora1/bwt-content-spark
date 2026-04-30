import { useState, useEffect } from "react";
import { fetchDestinationImage, fetchDestinationImages } from "@/lib/imageSearch";
import { getDestinationContext } from "@/lib/destinationContext";
import { loadImageNoTaint } from "@/lib/imageLoader";

/**
 * Loads a real destination photo as an HTMLImageElement ready for canvas drawing.
 * The image is loaded with crossOrigin="anonymous" so canvas.toBlob() works without CORS errors.
 */
export function useDestinationImage(destino: string) {
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageEl(null);

    const ctx = getDestinationContext(destino);

    fetchDestinationImage(ctx.imageKeyword)
      .then(async (url) => {
        if (cancelled || !url) {
          setLoading(false);
          return;
        }
        const img = await loadImageNoTaint(url);
        if (cancelled) return;
        if (img) setImageEl(img);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destino]);

  return { imageEl, loading };
}

/**
 * Loads multiple destination photos as HTMLImageElement[] ready for canvas drawing.
 */
export function useDestinationImages(destino: string, count: number = 3) {
  const [imageEls, setImageEls] = useState<(HTMLImageElement | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageEls([]);

    const ctx = getDestinationContext(destino);

    fetchDestinationImages(ctx.imageKeyword, count)
      .then((urls) => {
        if (cancelled) return;
        const loadPromises = urls.map((url) => loadImageNoTaint(url));
        Promise.all(loadPromises).then((imgs) => {
          if (!cancelled) {
            setImageEls(imgs);
            setLoading(false);
          }
        });
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destino, count]);

  return { imageEls, loading };
}
