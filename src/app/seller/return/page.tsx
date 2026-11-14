import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ListingCard } from "@/components/marketplace/listing-card";
import { buttonVariants } from "@/components/ui/button";
import { ACCOUNT_ID_RE, syncSellerStatus } from "@/lib/payments";
import { getListingsBySeller, getSellerByAccount } from "@/lib/store";

export const metadata: Metadata = { title: "Stripe connection · Marketplace" };

type Props = { searchParams: Promise<{ account?: string }> };

export default async function SellerReturnPage({ searchParams }: Props) {
  const { account } = await searchParams;
  const seller = account && ACCOUNT_ID_RE.test(account) ? await getSellerByAccount(account) : undefined;

  if (!seller?.stripeAccountId) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold tracking-tight">We couldn&apos;t find that connection</h1>
        <p className="text-muted-foreground">Start again from the Get paid page.</p>
        <Link href="/seller" className={buttonVariants({ className: "w-fit" })}>
          Get paid with Stripe
        </Link>
      </Shell>
    );
  }

  // Stripe sends sellers here whether or not they finished, so check.
  const status = await syncSellerStatus(seller.stripeAccountId);
  const listings = status.chargesEnabled ? await getListingsBySeller(seller.email) : [];

  if (!status.chargesEnabled) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Clock className="size-6 text-muted-foreground" />
          {status.detailsSubmitted ? "Stripe is reviewing your details" : "Onboarding isn't finished"}
        </p>
        <p className="text-muted-foreground">
          {status.detailsSubmitted
            ? "This usually takes a moment in the sandbox. Refresh this page shortly."
            : "Stripe still needs a few details before you can accept payments."}{" "}
          Your listings won&apos;t show Buy Now until then.
        </p>
        <Link
          href={`/seller/refresh?account=${seller.stripeAccountId}`}
          className={buttonVariants({ className: "w-fit bg-[#635bff] text-white hover:bg-[#635bff]/90" })}
        >
          Continue on Stripe
        </Link>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <div role="status" className="space-y-2">
        <p className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <CheckCircle2 className="size-7 text-brand" />
          You&apos;re connected to Stripe
        </p>
        <p className="text-muted-foreground">
          Listings with <span className="font-medium break-all text-foreground">{seller.email}</span>{" "}
          now show a Buy Now button.
        </p>
      </div>

      {listings.length > 0 ? (
        <section className="@container space-y-3">
          <h2 className="font-semibold">
            Your listings ({listings.length})
          </h2>
          <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">
          No listings use this email yet.{" "}
          <Link href="/create" className="font-medium text-brand hover:underline">
            Post one
          </Link>{" "}
          with {seller.email} and it will be buyable right away.
        </p>
      )}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto ${wide ? "max-w-5xl" : "max-w-xl"} px-4 py-5 sm:py-6 md:px-6`}>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </main>
  );
}
