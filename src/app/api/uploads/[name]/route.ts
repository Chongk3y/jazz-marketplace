import { promises as fs } from "node:fs";
import path from "node:path";

import { UPLOAD_DIR } from "@/lib/store/local";
import { PHOTO_TYPES } from "@/lib/store/photos";

// Serves photos uploaded in local mode. With Supabase, photos are served
// straight from Supabase Storage and this route is unused.

const CONTENT_TYPES = Object.fromEntries(
  Object.entries(PHOTO_TYPES).map(([type, ext]) => [ext, type])
);

// Only names that savePhoto() generates: <uuid>.<ext>. Blocks path traversal.
const NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const match = NAME_RE.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  try {
    const file = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": CONTENT_TYPES[match[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
