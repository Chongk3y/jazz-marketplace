"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { categories, slugify } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Horizontal, swipeable category chips for small screens. */
export function CategoryChips({ active }: { active?: string }) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the selected chip visible: center it in the row. Only the row
  // scrolls sideways — the page itself doesn't jump.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !chip) return;
    list.scrollLeft = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2;
  }, [active]);

  return (
    <ul
      ref={listRef}
      className="relative -mx-4 flex gap-2 overflow-x-auto scroll-smooth px-4 pb-1"
    >
      {[undefined, ...categories].map((category) => {
        const slug = category ? slugify(category) : undefined;
        const isActive = slug === active;
        return (
          <li key={category ?? "all"} className="shrink-0">
            <Link
              href={slug ? `/?category=${slug}` : "/"}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border bg-card px-3 text-sm",
                isActive && "border-brand bg-brand text-brand-foreground"
              )}
            >
              {category ?? "All"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
