/**
 * Compresses an image File / data URL into a smaller JPEG data URL so it can
 * safely be persisted in localStorage and passed around without blowing up
 * memory or the 5MB quota.
 *
 * - Resizes so the longest edge is at most `maxEdge` px (default 1600).
 * - Re-encodes as JPEG at `quality` (default 0.82).
 * - Returns the original input if compression fails.
 */
export async function compressImageToDataUrl(
  source: File | Blob | string,
  maxEdge = 1600,
  quality = 0.82,
): Promise<string> {
  const srcUrl =
    typeof source === "string" ? source : URL.createObjectURL(source);

  try {
    const img = await loadImage(srcUrl);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxEdge);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return typeof source === "string" ? source : await blobToDataUrl(source);

    ctx.drawImage(img, 0, 0, width, height);

    // Try JPEG first (much smaller than PNG for photos).
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    return dataUrl;
  } catch {
    return typeof source === "string" ? source : await blobToDataUrl(source);
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(srcUrl);
  }
}

function fitWithin(w: number, h: number, maxEdge: number) {
  if (w <= maxEdge && h <= maxEdge) return { width: w, height: h };
  const scale = w >= h ? maxEdge / w : maxEdge / h;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}