// Registers this app's Stripe webhook (a Connect endpoint) and prints its
// signing secret. Run it yourself so the secret only appears in your terminal:
//
//   npm run stripe:webhook -- https://your-app.vercel.app
//
// Add --replace to delete and recreate an existing endpoint for the same URL
// (Stripe only shows a signing secret once, when the endpoint is created).
//
// Reads STRIPE_SECRET_KEY from .env.local.
import Stripe from "stripe";

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const site = args.find((a) => !a.startsWith("--"));

const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error("This script only runs with a sandbox (sk_test_) key.");
  process.exit(1);
}
if (!site || !/^https:\/\/[^/]+/.test(site)) {
  console.error("Usage: npm run stripe:webhook -- https://your-app.vercel.app [--replace]");
  console.error("(Stripe can only reach a public https address, not localhost.)");
  process.exit(1);
}

const url = `${site.replace(/\/+$/, "")}/api/stripe/webhook`;
const stripe = new Stripe(key);

const existing = [];
for await (const endpoint of stripe.webhookEndpoints.list({ limit: 100 })) {
  if (endpoint.url === url) existing.push(endpoint);
}

if (existing.length && !replace) {
  console.log(`A webhook for ${url} already exists (${existing.map((e) => e.id).join(", ")}).`);
  console.log("Its secret can't be shown again. If you've lost it, re-run with --replace.");
  process.exit(0);
}
for (const endpoint of existing) {
  await stripe.webhookEndpoints.del(endpoint.id);
  console.log(`Deleted old endpoint ${endpoint.id}`);
}

const endpoint = await stripe.webhookEndpoints.create({
  url,
  connect: true, // direct charges happen on sellers' connected accounts
  enabled_events: [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "account.updated",
  ],
  description: "jazz-marketplace: orders + seller onboarding status",
  metadata: { app: "jazz-marketplace" },
});

console.log(`\nWebhook created: ${endpoint.id}`);
console.log(`URL: ${url}\n`);
console.log("Add this to Vercel → Settings → Environment Variables as STRIPE_WEBHOOK_SECRET,");
console.log("then redeploy. Keep it private.\n");
console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}\n`);
