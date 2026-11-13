export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Validates an upload and returns its file extension. */
export function photoExtension(file: File) {
  const ext = PHOTO_TYPES[file.type];
  if (!ext) throw new Error("Unsupported image type");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Image too large");
  return ext;
}
