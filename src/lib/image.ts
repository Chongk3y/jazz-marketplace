/**
 * Browser-side photo preparation: shrinks large photos before upload so they
 * stay under the server limit (Vercel rejects request bodies over 4.5 MB).
 */

export const UPLOAD_MAX_BYTES = 4 * 1024 * 1024; // keep in sync with MAX_PHOTO_BYTES

const MAX_DIMENSION = 2048; // longest side, in pixels
const RESIZE_ABOVE_BYTES = 1.5 * 1024 * 1024;
const QUALITIES = [0.85, 0.72, 0.6];

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
}

/**
 * Returns a file that is safe to upload. Small photos are returned unchanged;
 * large JPEG/PNG/WebP photos are scaled down and re-encoded as JPEG.
 * GIFs are never re-encoded (that would drop animation).
 */
export async function preparePhoto(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  // Respects EXIF orientation, so phone photos aren't sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_DIMENSION && file.size <= RESIZE_ABOVE_BYTES) return file;

    const scale = Math.min(1, MAX_DIMENSION / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= UPLOAD_MAX_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
      }
    }
    return file; // couldn't get it small enough; the size check will report it
  } finally {
    bitmap.close();
  }
}
