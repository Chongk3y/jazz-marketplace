import Link from "next/link";

import { CategoryChips } from "@/components/marketplace/category-chips";
import { Sidebar } from "@/components/marketplace/category-list";
import { ListingCard } from "@/components/marketplace/listing-card";
import { SearchBar } from "@/components/marketplace/search-bar";
import { buttonVariants } from "@/components/ui/button";
import { categoryFromSlug } from "@/lib/data";
import { getListings } from "@/lib/store";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const activeCategory = categoryFromSlug(category);
  const results = await getListings({ category, query: q });

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-5 sm:py-6 md:grid-cols-[240px_minmax(0,1fr)] md:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
      <aside className="hidden md:block">
        <Sidebar active={category} />
      </aside>

      <main className="@container min-w-0 space-y-4 sm:space-y-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {activeCategory ?? "Today's picks"}
        </h1>
        <SearchBar query={q} category={category} />
        <div className="md:hidden">
          <CategoryChips active={category} />
        </div>

        {q && (
          <p className="text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
          </p>
        )}

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 @lg:gap-4 @xl:grid-cols-3 @3xl:grid-cols-4 @4xl:grid-cols-5">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card px-6 py-16 text-center">
            <p className="font-medium">No listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {category || q
                ? "Try a different search or category."
                : "Be the first to list something."}
            </p>
            <Link
              href={category || q ? "/" : "/create"}
              className={buttonVariants({ variant: "outline", className: "mt-4" })}
            >
              {category || q ? "Clear filters" : "Create listing"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
