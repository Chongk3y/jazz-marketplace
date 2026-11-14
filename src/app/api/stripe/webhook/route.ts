import type Stripe from "stripe";

import { fulfillCheckoutSession } from "@/lib/payments";
import { updateSellerStatus } from "@/lib/store";
import { stripe } from "@/lib/stripe";

/**
 * Stripe webhook (registered as a Connect endpoint, so it receives events
 * from sellers' connected accounts — where direct charges happen).
 *
 * - checkout.session.completed / async_payment_succeeded → record the order
 *   and mark the listing sold
 * - account.updated → keep the seller's "can accept payments" flag current
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  // The signature covers the exact raw body, so read it as text.
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.warn("[webhook] Signature check failed:", (error as Error).message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        if (!event.account) break; // direct charges always come from a connected account
        const result = await fulfillCheckoutSession(event.data.object, event.account);
        console.log(`[webhook] ${event.type} ${event.data.object.id}:`, JSON.stringify(result));
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        // No-op for accounts that aren't one of our sellers.
        await updateSellerStatus(account.id, {
          chargesEnabled: account.charges_enabled ?? false,
          detailsSubmitted: account.details_submitted ?? false,
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry the event later.
    console.error(`[webhook] Failed to handle ${event.type} ${event.id}:`, error);
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
