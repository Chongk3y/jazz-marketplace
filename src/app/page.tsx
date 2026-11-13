import { CategoryList } from "@/components/marketplace/category-list";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Logo } from "@/components/marketplace/logo";
import { listings } from "@/lib/data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  return (
    <div className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 md:px-10 md:py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)] md:gap-x-6">
        <aside className="min-w-0 md:sticky md:top-8 md:self-start">
          <Logo />
          <div className="mt-8 md:mt-64">
            <CategoryList active={category} />
          </div>
        </aside>

        <main className="min-w-0 md:pt-24">
          <h1 className="mb-5 text-2xl font-extrabold">Today&apos;s picks</h1>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-10">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
