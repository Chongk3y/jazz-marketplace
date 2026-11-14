import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type Stripe from "stripe";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCents, isLocalImage, normalizeEmail } from "@/lib/data";
import { fulfillCheckoutSession, PLATFORM_FEE_PERCENT } from "@/lib/payments";
import { getListing, getOrderBySession, getSeller } from "@/lib/store";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Order confirmation · Marketplace" };

const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]+$/;

type Props = { searchParams: Promise<{ session_id?: string; listing?: string }> };

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { session_id: sessionId = "", listing: listingId = "" } = await searchParams;

  const listing = SESSION_ID_RE.test(sessionId) ? await getListing(listingId) : undefined;
  const seller = listing ? await getSeller(normalizeEmail(listing.sellerEmail)) : undefined;

  let session: Stripe.Checkout.Session | undefined;
  if (listing && seller?.stripeAccountId) {
    try {
      session = await stripe().checkout.sessions.retrieve(
        sessionId,
        {},
        { stripeAccount: seller.stripeAccountId }
      );
    } catch {
      session = undefined;
    }
  }

  if (!listing || !seller?.stripeAccountId || session?.metadata?.listing_id !== listing.id) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <XCircle className="size-6 text-muted-foreground" />
          We couldn&apos;t find that order
        </p>
        <p className="text-muted-foreground">
          If you were charged, the seller still received your payment.
        </p>
      </Shell>
    );
  }

  if (session.payment_status !== "paid") {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Clock className="size-6 text-muted-foreground" />
          Payment processing
        </p>
        <p className="text-muted-foreground">
          Stripe hasn&apos;t confirmed your payment yet. Refresh this page in a moment.
        </p>
      </Shell>
    );
  }

  // The webhook normally records the order first; this is a safe fallback in
  // case the buyer gets here before the webhook arrives (it's idempotent).
  await fulfillCheckoutSession(session, seller.stripeAccountId);
  const order = await getOrderBySession(session.id);

  const amount = order?.amountTotal ?? session.amount_total ?? 0;
  const currency = order?.currency ?? session.currency ?? "usd";
  const fee = order?.applicationFeeAmount ?? Number(session.metadata?.application_fee_amount ?? 0);
  const email = order?.buyerEmail ?? session.customer_details?.email;

  return (
    <Shell>
      <div role="status" className="space-y-1">
        <p className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <CheckCircle2 className="size-7 text-brand" />
          Payment successful
        </p>
        <p className="text-muted-foreground">
          Thanks for your order! The seller will contact you about pickup.
        </p>
      </div>

      <Card className="gap-4 p-4 shadow-sm ring-foreground/5 sm:p-5">
        <div className="flex gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              sizes="80px"
              unoptimized={isLocalImage(listing.image)}
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <Link href={`/item/${listing.id}`} className="font-semibold break-words hover:underline">
              {listing.title}
            </Link>
            <p className="text-lg font-bold">{formatCents(amount, currency)}</p>
            <p className="text-sm text-muted-foreground">Marked as sold</p>
          </div>
        </div>

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-t pt-4 text-sm">
          <dt className="text-muted-foreground">Order</dt>
          <dd className="font-mono text-xs break-all">{order?.id ?? "Recording…"}</dd>
          {email && (
            <>
              <dt className="text-muted-foreground">Receipt to</dt>
              <dd className="break-all">{email}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Seller</dt>
          <dd className="break-all">{listing.sellerEmail}</dd>
        </dl>

        <div className="rounded-lg bg-muted/60 p-3 text-sm">
          <p className="mb-1 font-medium">Payment split (sandbox demo)</p>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-0.5">
            <dt className="text-muted-foreground">Paid</dt>
            <dd className="text-right tabular-nums">{formatCents(amount, currency)}</dd>
            <dt className="text-muted-foreground">Marketplace fee ({PLATFORM_FEE_PERCENT}%)</dt>
            <dd className="text-right tabular-nums">−{formatCents(fee, currency)}</dd>
            <dt className="font-medium">Seller receives</dt>
            <dd className="text-right font-medium tabular-nums">
              {formatCents(amount - fee, currency)}
            </dd>
          </dl>
          <p className="mt-1 text-xs text-muted-foreground">
            Before Stripe&apos;s processing fee, which the seller&apos;s account pays.
          </p>
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5 sm:py-6 md:px-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>
      {children}
      <Link href="/" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
        Keep browsing
      </Link>
    </main>
  );
}
