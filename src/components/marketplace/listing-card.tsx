import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, type Listing } from "@/lib/data";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="group cursor-pointer gap-3 bg-transparent py-0 shadow-none ring-0">
      {/* Image placeholder — crosshatch like the mockup */}
      <div
        role="img"
        aria-label={listing.title}
        className="listing-placeholder aspect-[28/27] w-full rounded-2xl border-2 border-foreground transition-transform duration-200 group-hover:scale-[1.02]"
      />
      <CardContent className="space-y-0.5 px-1">
        <p className="text-2xl font-semibold tracking-tight">
          {formatPrice(listing.price)}
        </p>
        <p className="truncate text-base">{listing.title}</p>
        <p className="text-base text-muted-foreground">{listing.location}</p>
      </CardContent>
    </Card>
  );
}
