/**
 * Supabase store. Runs only on the server: it uses the project's secret key,
 * which must never reach the browser.
 */
import "server-only";

import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  categoryFromSlug,
  type Category,
  type Listing,
  type ListingStatus,
  type Message,
  type Order,
  type Seller,
} from "@/lib/data";

import { supabaseEnv } from "./config";
import { photoExtension } from "./photos";
import type { Store } from "./types";

export const PHOTO_BUCKET = "listing-photos";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let client: SupabaseClient | undefined;
function db() {
  client ??= createClient(supabaseEnv.url!, supabaseEnv.secretKey!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`Supabase: could not ${action}: ${error.message}`);
}

/* -------------------------- Row ↔ app mapping ------------------------- */

type ListingRow = {
  id: string;
  title: string;
  description: string;
  price: number | string; // numeric columns can come back as strings
  category: string;
  location: string;
  seller_email: string;
  image_url: string;
  created_at: string;
  status?: ListingStatus; // missing until the payments SQL has been run
};

const toListing = (row: ListingRow): Listing => ({
  id: row.id,
  title: row.title,
  description: row.description,
  price: Number(row.price),
  category: row.category as Category,
  location: row.location,
  sellerEmail: row.seller_email,
  image: row.image_url,
  createdAt: row.created_at,
  status: row.status ?? "available",
});

type SellerRow = {
  email: string;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  details_submitted: boolean;
};

const toSeller = (row: SellerRow): Seller => ({
  email: row.email,
  stripeAccountId: row.stripe_account_id,
  chargesEnabled: row.charges_enabled,
  detailsSubmitted: row.details_submitted,
});

type OrderRow = {
  id: string;
  listing_id: string | null;
  listing_title: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  stripe_account_id: string;
  amount_total: number;
  application_fee_amount: number;
  currency: string;
  buyer_email: string | null;
  created_at: string;
};

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  listingId: row.listing_id ?? "",
  listingTitle: row.listing_title,
  checkoutSessionId: row.stripe_checkout_session_id,
  paymentIntentId: row.stripe_payment_intent_id,
  stripeAccountId: row.stripe_account_id,
  amountTotal: row.amount_total,
  applicationFeeAmount: row.application_fee_amount,
  currency: row.currency,
  buyerEmail: row.buyer_email,
  createdAt: row.created_at,
});

type MessageRow = {
  id: string;
  listing_id: string;
  buyer_email: string;
  body: string;
  created_at: string;
};

const toMessage = (row: MessageRow): Message => ({
  id: row.id,
  listingId: row.listing_id,
  buyerEmail: row.buyer_email,
  body: row.body,
  createdAt: row.created_at,
});

// A message row with its listing embedded via the listing_id foreign key.
type MessageWithListingRow = MessageRow & {
  listings: { title: string; seller_email: string } | null;
};

/* ------------------------------- Store -------------------------------- */

export const supabaseStore: Store = {
  async getListings({ category, query } = {}) {
    const categoryName = categoryFromSlug(category);
    if (category && !categoryName) return []; // unknown category slug
    const { data, error } = await db().rpc("search_listings", {
      search: query?.trim() || null,
      category_filter: categoryName ?? null,
    });
    if (error) fail("load listings", error);
    return (data as ListingRow[]).map(toListing);
  },

  async getListing(id) {
    if (!UUID_RE.test(id)) return undefined; // ids are UUIDs; skip a failing query
    const { data, error } = await db()
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle<ListingRow>();
    if (error) fail("load listing", error);
    return data ? toListing(data) : undefined;
  },

  async getListingsBySeller(email) {
    // Case-insensitive exact match (older listings may have mixed-case
    // emails). Escape LIKE wildcards so "_" in an email matches literally.
    const pattern = email.replace(/[\\%_]/g, "\\$&");
    const { data, error } = await db()
      .from("listings")
      .select("*")
      .ilike("seller_email", pattern)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) fail("load seller listings", error);
    return (data as ListingRow[]).map(toListing);
  },

  async createListing(input) {
    const { data, error } = await db()
      .from("listings")
      .insert({
        title: input.title,
        description: input.description,
        price: input.price,
        category: input.category,
        location: input.location,
        seller_email: input.sellerEmail,
        image_url: input.image,
      })
      .select("*")
      .single<ListingRow>();
    if (error) fail("create listing", error);
    return toListing(data);
  },

  async createMessage(input) {
    const { data, error } = await db()
      .from("messages")
      .insert({
        listing_id: input.listingId,
        buyer_email: input.buyerEmail,
        body: input.body,
      })
      .select("*")
      .single<MessageRow>();
    if (error) fail("save message", error);
    return toMessage(data);
  },

  async getMessages() {
    const { data, error } = await db()
      .from("messages")
      .select("*, listings(title, seller_email)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) fail("load messages", error);
    return (data as MessageWithListingRow[]).flatMap((row) =>
      row.listings
        ? [
            {
              ...toMessage(row),
              listingTitle: row.listings.title,
              sellerEmail: row.listings.seller_email,
            },
          ]
        : []
    );
  },

  async savePhoto(file) {
    const name = `${randomUUID()}.${photoExtension(file)}`;
    const bucket = db().storage.from(PHOTO_BUCKET);
    const { error } = await bucket.upload(name, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) fail("upload photo", error);
    return bucket.getPublicUrl(name).data.publicUrl;
  },

  /* ----------------------------- Payments ----------------------------- */

  async getSeller(email) {
    const { data, error } = await db()
      .from("sellers")
      .select("*")
      .eq("email", email)
      .maybeSingle<SellerRow>();
    if (error) fail("load seller", error);
    return data ? toSeller(data) : undefined;
  },

  async getSellerByAccount(stripeAccountId) {
    const { data, error } = await db()
      .from("sellers")
      .select("*")
      .eq("stripe_account_id", stripeAccountId)
      .maybeSingle<SellerRow>();
    if (error) fail("load seller", error);
    return data ? toSeller(data) : undefined;
  },

  async saveSeller(email, stripeAccountId) {
    const { data, error } = await db()
      .from("sellers")
      .upsert(
        {
          email,
          stripe_account_id: stripeAccountId,
          charges_enabled: false,
          details_submitted: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("*")
      .single<SellerRow>();
    if (error) fail("save seller", error);
    return toSeller(data);
  },

  async updateSellerStatus(stripeAccountId, status) {
    const { error } = await db()
      .from("sellers")
      .update({
        charges_enabled: status.chargesEnabled,
        details_submitted: status.detailsSubmitted,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_account_id", stripeAccountId);
    if (error) fail("update seller", error);
  },

  async recordOrder(order) {
    const { data, error } = await db().rpc("record_order", {
      p_listing_id: order.listingId,
      p_checkout_session_id: order.checkoutSessionId,
      p_payment_intent_id: order.paymentIntentId,
      p_stripe_account_id: order.stripeAccountId,
      p_amount_total: order.amountTotal,
      p_application_fee_amount: order.applicationFeeAmount,
      p_currency: order.currency,
      p_buyer_email: order.buyerEmail,
    });
    if (error) fail("record order", error);
    const row = (data as {
      order_id: string | null;
      already_recorded: boolean;
      listing_marked_sold: boolean;
    }[])[0];
    return {
      orderId: row?.order_id ?? null,
      alreadyRecorded: row?.already_recorded ?? false,
      listingMarkedSold: row?.listing_marked_sold ?? false,
    };
  },

  async getOrderBySession(checkoutSessionId) {
    const { data, error } = await db()
      .from("orders")
      .select("*")
      .eq("stripe_checkout_session_id", checkoutSessionId)
      .maybeSingle<OrderRow>();
    if (error) fail("load order", error);
    return data ? toOrder(data) : undefined;
  },
};
