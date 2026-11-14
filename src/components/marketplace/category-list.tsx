import { Mail, Tag, Wallet } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { categories, slugify } from "@/lib/data";
import { cn } from "@/lib/utils";

const sellerLinks = [
  { label: "Create listing", href: "/create", icon: Tag },
  { label: "Get paid with Stripe", href: "/seller", icon: Wallet },
  { label: "Messages", href: "/messages", icon: Mail },
];

const itemClass =
  "h-10 w-full justify-start gap-3 rounded-lg px-3 text-[0.95rem] font-normal text-foreground/80";

export function Sidebar({ active }: { active?: string }) {
  return (
    <Card className="gap-6 p-5 shadow-sm ring-foreground/5">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Create new listing</h2>
        <ul className="space-y-0.5">
          {sellerLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className={cn(buttonVariants({ variant: "ghost" }), itemClass)}
              >
                <Icon className="size-4.5 text-muted-foreground" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-2 text-lg font-semibold">
          Categories
        </h2>
        <ul className="space-y-0.5">
          {categories.map((category) => {
            const slug = slugify(category);
            const isActive = slug === active;
            return (
              <li key={category}>
                <Link
                  href={isActive ? "/" : `/?category=${slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    itemClass,
                    isActive &&
                      "bg-brand/12 font-medium text-brand hover:bg-brand/18 hover:text-brand"
                  )}
                >
                  {category}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </Card>
  );
}
