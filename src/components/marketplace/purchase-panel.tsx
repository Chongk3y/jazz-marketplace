import { BadgeCheck, CircleSlash, Info } from "lucide-react";
import Link from "next/link";

import { BuyNowButton } from "@/components/marketplace/buy-now-button";
import { formatPrice, type Listing } from "@/lib/data";
import type { PurchaseState } from "@/lib/payments";

/** Buy Now, or the reason this listing can't be bought online. */
export function PurchasePanel({
  listing,
  state,
  canceled,
}: {
  listing: Listing;
  state: PurchaseState;
  canceled?: boolean;
}) {
  if (state.kind === "sold") {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-muted/60 p-4 font-medium">
        <CircleSlash className="size-5 text-muted-foreground" />
        This item has been sold.
      </div>
    );
  }

  if (state.kind === "buy") {
    return (
      <div className="space-y-2">
        {canceled && (
          <p role="status" className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
            Checkout was canceled. You haven&apos;t been charged.
          </p>
        )}
        <BuyNowButton listingId={listing.id} label={`Buy now · ${formatPrice(listing.price)}`} />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BadgeCheck className="size-3.5" />
          Secure checkout with Stripe (sandbox: use card 4242 4242 4242 4242)
        </p>
      </div>
    );
  }

  const reason =
    state.kind === "seller-not-connected"
      ? "This seller hasn't set up online payments yet."
      : state.kind === "price-not-supported"
        ? "This item can't be paid for online. Contact the seller instead."
        : "Online payments aren't available on this site yet.";

  return (
    <div className="space-y-1 rounded-lg border border-dashed p-4 text-sm">
      <p className="flex items-start gap-2 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        {reason}
      </p>
      {state.kind === "seller-not-connected" && (
        <p className="pl-6">
          Are you the seller?{" "}
          <Link href="/seller" className="font-medium text-brand hover:underline">
            Connect with Stripe
          </Link>
        </p>
      )}
    </div>
  );
}
