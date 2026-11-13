import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { categories, slugify } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CategoryList({ active }: { active?: string }) {
  return (
    <nav aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="mb-3 text-xl font-extrabold">
        Categories
      </h2>
      {/* Horizontal chips on small screens, vertical list from md up */}
      <ul className="-mx-2 flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
        {categories.map((category) => {
          const slug = slugify(category);
          const isActive = slug === active;
          return (
          <li key={category}>
            <Link
              href={`/?category=${slug}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-7 justify-start px-2 text-[0.95rem] font-normal md:w-full",
                isActive && "bg-foreground/10 font-semibold"
              )}
            >
              {category}
            </Link>
          </li>
          );
        })}
      </ul>
    </nav>
  );
}
