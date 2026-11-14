/**
 * Marketplace payments with Stripe Connect.
 *
 * - Sellers have no login: a seller is identified by the email on their
 *   listings. "Connect with Stripe" creates a Stripe account for that email.
 * - Buy Now uses a direct charge: the Checkout Session is created on the
 *   seller's connected account, and the platform takes an application fee.
 * - Orders are recorded by the webhook (and, as a fallback, by the success
 *   page). Recording is idempotent, keyed by the Checkout Session id.
 */
import "server-only";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";
import type Stripe from "stripe";

import type { Listing, Seller } from "@/lib/data";
import { getSellerByAccount, recordOrder, storeMode, updateSellerStatus } from "@/lib/store";
import { APP_ID, stripe, stripeConfigured, stripeSandbox } from "@/lib/stripe";

/* ------------------------------ Money ------------------------------- */

export const PLATFORM_FEE_PERCENT = 10;
export const CURRENCY = "usd";
/** Stripe's minimum and maximum charge for USD. */
const MIN_CHARGE_CENTS = 50;
const MAX_CHARGE_CENTS = 99_999_999;

export const toCents = (price: number) => Math.round(price * 100);
export const platformFeeCents = (amountCents: number) =>
  Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);

/** True when both Supabase and Stripe are configured. */
export const paymentsEnabled = storeMode === "supabase" && stripeConfigured;

/* ------------------------ Can this be bought? ------------------------ */

export type PurchaseState =
  | { kind: "buy" }
  | { kind: "sold" }
  | { kind: "seller-not-connected" }
  | { kind: "price-not-supported" }
  | { kind: "payments-off" };

export function purchaseState(listing: Listing, seller: Seller | undefined): PurchaseState {
  if (listing.status === "sold") return { kind: "sold" };
  if (!paymentsEnabled) return { kind: "payments-off" };
  const cents = toCents(listing.price);
  if (cents < MIN_CHARGE_CENTS || cents > MAX_CHARGE_CENTS) return { kind: "price-not-supported" };
  if (!seller?.stripeAccountId || !seller.chargesEnabled) return { kind: "seller-not-connected" };
  return { kind: "buy" };
}

/* ------------------------------ URLs -------------------------------- */

/** Base URL for links Stripe sends people back to. */
export async function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/* ------------------------- Seller onboarding ------------------------- */

export const ACCOUNT_ID_RE = /^acct_[A-Za-z0-9]+$/;

/**
 * Creates a Stripe account for a seller: a Standard-type account (seller gets
 * their own Stripe dashboard and pays Stripe's fees), which suits direct
 * charges. US so onboarding uses familiar US test data and USD.
 *
 * The account's email becomes the seller's Stripe *login* and is pre-filled on
 * Stripe's sign-up screen. Stripe logins are shared between sandbox and live,
 * so a real address (e.g. a common gmail) can hit someone else's real Stripe
 * login. In the sandbox we therefore give Stripe a unique made-up address;
 * the listing email stays in our database (and in the account's metadata).
 */
export function createSellerAccount(email: string) {
  const loginEmail = stripeSandbox
    ? `seller-${randomBytes(4).toString("hex")}@example.com`
    : email;
  return stripe().accounts.create({
    country: "US",
    email: loginEmail,
    controller: {
      stripe_dashboard: { type: "full" },
      fees: { payer: "account" },
      losses: { payments: "stripe" },
      requirement_collection: "stripe",
    },
    metadata: { app: APP_ID, seller_email: email },
  });
}

/** A one-time link into Stripe's hosted onboarding for this account. */
export async function onboardingLink(stripeAccountId: string) {
  const base = await siteUrl();
  const link = await stripe().accountLinks.create({
    account: stripeAccountId,
    type: "account_onboarding",
    refresh_url: `${base}/seller/refresh?account=${stripeAccountId}`,
    return_url: `${base}/seller/return?account=${stripeAccountId}`,
  });
  return link.url;
}

/** Reads the account's status from Stripe and saves it. */
export async function syncSellerStatus(stripeAccountId: string) {
  const account = await stripe().accounts.retrieve(stripeAccountId);
  const status = {
    chargesEnabled: account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
  await updateSellerStatus(stripeAccountId, status);
  return status;
}

/* ---------------------------- Fulfillment ---------------------------- */

export type FulfillResult =
  | { status: "ignored"; reason: string }
  | { status: "unpaid" }
  | {
      status: "recorded";
      orderId: string;
      alreadyRecorded: boolean;
      listingMarkedSold: boolean;
    };

/**
 * Records the order for a completed Checkout Session and marks the listing
 * sold. Called by the webhook (primary) and the success page (fallback);
 * safe to call any number of times.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  stripeAccountId: string
): Promise<FulfillResult> {
  if (session.metadata?.app !== APP_ID) return { status: "ignored", reason: "not from this app" };
  const listingId = session.metadata.listing_id;
  if (!listingId) return { status: "ignored", reason: "no listing id" };
  if (session.payment_status !== "paid") return { status: "unpaid" };

  // Only accept sessions from a seller account this app created.
  if (!(await getSellerByAccount(stripeAccountId))) {
    return { status: "ignored", reason: "unknown seller account" };
  }

  const result = await recordOrder({
    listingId,
    checkoutSessionId: session.id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    stripeAccountId,
    amountTotal: session.amount_total ?? 0,
    applicationFeeAmount: Number(session.metadata.application_fee_amount ?? 0),
    currency: session.currency ?? CURRENCY,
    buyerEmail: session.customer_details?.email ?? null,
  });

  if (!result.orderId) return { status: "ignored", reason: "listing no longer exists" };
  if (!result.alreadyRecorded && !result.listingMarkedSold) {
    console.warn(
      `[payments] Listing ${listingId} was already sold; order ${result.orderId} may need a refund.`
    );
  }
  return {
    status: "recorded",
    orderId: result.orderId,
    alreadyRecorded: result.alreadyRecorded,
    listingMarkedSold: result.listingMarkedSold,
  };
}
