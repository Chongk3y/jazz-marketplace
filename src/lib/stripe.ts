/**
 * Stripe client. Server-only: uses STRIPE_SECRET_KEY, which must never reach
 * the browser.
 */
import "server-only";

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || undefined;

export const stripeConfigured = Boolean(secretKey);

/** True for sandbox keys (sk_test_/rk_test_): no real money can move. */
export const stripeSandbox = Boolean(secretKey && /^(sk|rk)_test_/.test(secretKey));

/**
 * Tags every Stripe object this app creates. The sandbox may be shared with
 * other apps, so webhook events without this tag are ignored.
 */
export const APP_ID = "jazz-marketplace";

let client: Stripe | undefined;

export function stripe() {
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set.");
  client ??= new Stripe(secretKey, {
    appInfo: { name: APP_ID },
  });
  return client;
}
