import type { Listing, Message, OutboxEmail } from "@/lib/data";

/**
 * Everything the app needs from storage. `local.ts` and `supabase.ts` both
 * implement this, and `index.ts` picks one based on environment variables.
 */
export type Store = {
  getListings(filters?: { category?: string; query?: string }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  createListing(input: Omit<Listing, "id" | "createdAt">): Promise<Listing>;
  createMessage(input: Omit<Message, "id" | "createdAt">): Promise<Message>;
  addToOutbox(email: Omit<OutboxEmail, "id" | "createdAt">): Promise<OutboxEmail>;
  getOutbox(): Promise<OutboxEmail[]>;
  /** Saves an uploaded photo and returns the public URL it is served from. */
  savePhoto(file: File): Promise<string>;
};
