import { ArrowLeft, CheckCircle2, Clock, MapPin, Tag } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MessageSellerForm } from "@/components/marketplace/message-seller-form";
import { PurchasePanel } from "@/components/marketplace/purchase-panel";
import { SoldBadge } from "@/components/marketplace/sold-badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, isLocalImage, listedAgo, normalizeEmail, slugify } from "@/lib/data";
import { purchaseState } from "@/lib/payments";
import { getListing, getSeller } from "@/lib/store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; checkout?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListing((await params).id);
  return { title: listing ? `${listing.title} · Marketplace` : "Not found" };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const [{ id }, { created, checkout }] = await Promise.all([params, searchParams]);
  const listing = await getListing(id);
  if (!listing) notFound();
  const seller = await getSeller(normalizeEmail(listing.sellerEmail));
  const purchase = purchaseState(listing, seller);
  const sold = purchase.kind === "sold";

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:py-6 md:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>

      {created && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand/8 px-4 py-3 text-sm"
        >
          <CheckCircle2 className="size-4.5 shrink-0 text-brand" />
          <span>
            Your listing is live. Buyers can now find it on the Marketplace.
            {purchase.kind === "seller-not-connected" && (
              <>
                {" "}
                <Link href="/seller" className="font-medium text-brand hover:underline">
                  Connect with Stripe
                </Link>{" "}
                to let buyers pay online.
              </>
            )}
          </span>
        </p>
      )}

      <div className="mt-4 grid gap-6 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="self-start overflow-hidden p-0 shadow-sm ring-foreground/5">
          <div className="relative aspect-square bg-muted sm:aspect-[4/3]">
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              priority
              unoptimized={isLocalImage(listing.image)}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className={sold ? "object-cover opacity-60 grayscale" : "object-cover"}
            />
            {sold && <SoldBadge className="top-4 left-4 px-4 py-1.5 text-base" />}
          </div>
        </Card>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
              {listing.title}
            </h1>
            <p className="text-2xl font-bold sm:text-3xl">
              {formatPrice(listing.price)}
            </p>
            <ul className="space-y-1.5 pt-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="size-4" />
                {listedAgo(listing.createdAt)}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4" />
                {listing.location}
              </li>
              <li className="flex items-center gap-2">
                <Tag className="size-4" />
                <Link
                  href={`/?category=${slugify(listing.category)}`}
                  className="hover:text-foreground hover:underline"
                >
                  {listing.category}
                </Link>
              </li>
            </ul>
          </div>

          <PurchasePanel listing={listing} state={purchase} canceled={checkout === "canceled"} />

          <Separator />

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Description</h2>
            <p className="leading-relaxed whitespace-pre-line break-words text-foreground/80">
              {listing.description}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Seller information</h2>
            <a
              href={`mailto:${listing.sellerEmail}`}
              className="break-all text-foreground/80 hover:underline"
            >
              {listing.sellerEmail}
            </a>
          </section>

          <Card className="gap-4 p-4 shadow-sm ring-foreground/5 sm:p-5">
            <h2 className="text-lg font-semibold">Message seller</h2>
            <MessageSellerForm listingId={listing.id} />
          </Card>
        </div>
      </div>
    </main>
  );
}
