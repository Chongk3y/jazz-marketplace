import Image from "next/image";
import Link from "next/link";

import { SoldBadge } from "@/components/marketplace/sold-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, isLocalImage, listedAgo, type Listing } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const sold = listing.status === "sold";
  return (
    <Link
      href={`/item/${listing.id}`}
      className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-0 py-0 shadow-sm ring-foreground/5 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            unoptimized={isLocalImage(listing.image)}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              sold && "opacity-60 grayscale"
            )}
          />
          {sold && <SoldBadge />}
        </div>
        <CardContent className="space-y-0.5 p-3 sm:space-y-1 sm:p-4">
          <p
            className={cn(
              "text-base font-bold sm:text-lg",
              sold && "text-muted-foreground line-through"
            )}
          >
            {formatPrice(listing.price)}
          </p>
          <p className="truncate text-sm text-foreground/80 sm:text-[0.95rem]">
            {listing.title}
          </p>
          <div className="pt-1 text-xs leading-5 text-muted-foreground">
            <p className="truncate">{listedAgo(listing.createdAt)}</p>
            <p className="truncate">{listing.location}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
