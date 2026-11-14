import type {
  Listing,
  Message,
  MessageWithListing,
  NewOrder,
  Order,
  RecordOrderResult,
  Seller,
} from "@/lib/data";

/**
 * Everything the app needs from storage. `local.ts` and `supabase.ts` both
 * implement this, and `index.ts` picks one based on environment variables.
 */
export type Store = {
  getListings(filters?: { category?: string; query?: string }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  /** All listings whose seller email matches (email must be normalized). */
  getListingsBySeller(email: string): Promise<Listing[]>;
  createListing(input: Omit<Listing, "id" | "createdAt" | "status">): Promise<Listing>;

  createMessage(input: Omit<Message, "id" | "createdAt">): Promise<Message>;
  /** Newest first, each with its listing's title and seller email. */
  getMessages(): Promise<MessageWithListing[]>;

  /** Saves an uploaded photo and returns the public URL it is served from. */
  savePhoto(file: File): Promise<string>;

  /* Payments (Supabase only) */
  getSeller(email: string): Promise<Seller | undefined>;
  getSellerByAccount(stripeAccountId: string): Promise<Seller | undefined>;
  /** Creates the seller or links a Stripe account to an existing one. */
  saveSeller(email: string, stripeAccountId: string): Promise<Seller>;
  updateSellerStatus(
    stripeAccountId: string,
    status: { chargesEnabled: boolean; detailsSubmitted: boolean }
  ): Promise<void>;
  /** Idempotent: recording the same Checkout Session twice is a no-op. */
  recordOrder(order: NewOrder): Promise<RecordOrderResult>;
  getOrderBySession(checkoutSessionId: string): Promise<Order | undefined>;
};
