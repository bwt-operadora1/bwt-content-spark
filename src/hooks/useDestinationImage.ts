import { useState, useEffect } from "react";
import { fetchDestinationImage } from "@/lib/imageSearch";
import { getDestinationContext } from "@/lib/destinationContext";

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
      .then((url) => {
        if (cancelled || !url) {
          setLoading(false);
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (!cancelled) {
            setImageEl(img);
            setLoading(false);
          }
        };
        img.onerror = () => {
          if (!cancelled) setLoading(false);
        };
        img.src = url;
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
