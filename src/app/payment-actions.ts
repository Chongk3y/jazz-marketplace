"use server";

import { redirect } from "next/navigation";

import { EMAIL_RE, normalizeEmail } from "@/lib/data";
import {
  CURRENCY,
  createSellerAccount,
  onboardingLink,
  paymentsEnabled,
  platformFeeCents,
  purchaseState,
  siteUrl,
  syncSellerStatus,
  toCents,
} from "@/lib/payments";
import { getListing, getListingsBySeller, getSeller, saveSeller } from "@/lib/store";
import { APP_ID, stripe } from "@/lib/stripe";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

/* ------------------------- Connect with Stripe ------------------------ */

export type ConnectState = {
  error?: string;
  email?: string;
  /** Set when this email's Stripe account is already fully connected. */
  connected?: { listingCount: number };
};

export async function connectStripeAction(
  _prev: ConnectState,
  formData: FormData
): Promise<ConnectState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", email };
  if (!paymentsEnabled) return { error: "Payments aren't set up on this site yet.", email };

  let url: string;
  try {
    let seller = await getSeller(email);

    if (seller?.stripeAccountId) {
      const status = await syncSellerStatus(seller.stripeAccountId);
      // Fully connected accounts don't get a new onboarding link, so someone
      // typing this email can't re-run onboarding and change the payout bank.
      if (status.chargesEnabled) {
        const listings = await getListingsBySeller(email);
        return { email, connected: { listingCount: listings.length } };
      }
    } else {
      const account = await createSellerAccount(email);
      seller = await saveSeller(email, account.id);
    }

    url = await onboardingLink(seller.stripeAccountId!);
  } catch (error) {
    console.error("[payments] connect failed:", error);
    return { error: `Couldn't start Stripe onboarding: ${errorMessage(error)}`, email };
  }

  redirect(url);
}

/* ------------------------------- Buy Now ------------------------------ */

export type BuyState = { error?: string };

export async function buyNowAction(_prev: BuyState, formData: FormData): Promise<BuyState> {
  const listingId = String(formData.get("listingId") ?? "");

  let url: string;
  try {
    // Price and seller always come from the database, never from the browser.
    const listing = await getListing(listingId);
    if (!listing) return { error: "This listing no longer exists." };
    const seller = await getSeller(normalizeEmail(listing.sellerEmail));

    const state = purchaseState(listing, seller);
    if (state.kind === "sold") return { error: "Sorry, this item has already been sold." };
    if (state.kind !== "buy" || !seller?.stripeAccountId) {
      return { error: "This item can't be bought online right now." };
    }

    const amount = toCents(listing.price);
    const fee = platformFeeCents(amount);
    const base = await siteUrl();
    const metadata = {
      app: APP_ID,
      listing_id: listing.id,
      application_fee_amount: String(fee),
    };

    // Direct charge: the session lives on the seller's connected account and
    // the platform keeps `application_fee_amount`.
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: CURRENCY,
              unit_amount: amount,
              product_data: {
                name: listing.title,
                ...(listing.image.startsWith("https://") ? { images: [listing.image] } : {}),
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: fee,
          description: `Marketplace: ${listing.title}`,
          metadata,
        },
        metadata,
        success_url: `${base}/orders/success?session_id={CHECKOUT_SESSION_ID}&listing=${listing.id}`,
        cancel_url: `${base}/item/${listing.id}?checkout=canceled`,
        // Short expiry limits the chance of two buyers paying for one item.
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      },
      { stripeAccount: seller.stripeAccountId }
    );
    if (!session.url) return { error: "Stripe didn't return a checkout page." };
    url = session.url;
  } catch (error) {
    console.error("[payments] checkout failed:", error);
    return { error: `Couldn't start checkout: ${errorMessage(error)}` };
  }

  redirect(url);
}
