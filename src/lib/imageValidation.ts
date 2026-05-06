export const ACCEPTED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const ACCEPTED_IMAGE_ACCEPT_ATTR = ACCEPTED_IMAGE_MIME.join(",");
export const ACCEPTED_IMAGE_LABEL = "JPG, PNG ou WEBP";

/**
 * Returns null if the file is an accepted image format, otherwise an error message.
 * Blocks formats like AVIF, HEIC, GIF, SVG, BMP, TIFF, etc.
 */
export function validateImageFile(file: File): string | null {
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const extOk = ACCEPTED_IMAGE_EXT.some((ext) => name.endsWith(ext));
  const mimeOk = (ACCEPTED_IMAGE_MIME as readonly string[]).includes(mime);
  if (!mimeOk && !extOk) {
    return `Formato não suportado. Use ${ACCEPTED_IMAGE_LABEL}.`;
  }
  return null;
}