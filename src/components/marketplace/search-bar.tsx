import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  query,
  category,
}: {
  query?: string;
  category?: string;
}) {
  return (
    <form action="/" role="search" className="flex gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search listings..."
          aria-label="Search listings"
          className="h-11 rounded-lg bg-card pl-10 text-base shadow-xs md:text-base"
        />
      </div>
      <Button type="submit" size="lg" className="h-11 px-5 text-base">
        Search
      </Button>
    </form>
  );
}
