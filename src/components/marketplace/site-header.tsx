import { Bell, Mail, Plus, User, Wallet } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 rounded-lg sm:gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-full bg-brand text-base font-bold text-brand-foreground sm:size-10 sm:text-lg"
      >
        M
      </span>
      <span className="text-xl font-bold tracking-tight sm:text-2xl">
        Marketplace
      </span>
    </Link>
  );
}

const iconButton = "rounded-full text-foreground/80";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:h-16 md:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/create"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mr-1 rounded-full bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:mr-2 sm:px-4"
            )}
          >
            <Plus className="size-4" />
            Sell
          </Link>
          <Link
            href="/seller"
            aria-label="Get paid with Stripe"
            title="Get paid with Stripe"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), iconButton)}
          >
            <Wallet className="size-5" />
          </Link>
          <Link
            href="/messages"
            aria-label="Messages"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              iconButton,
              "hidden sm:inline-flex"
            )}
          >
            <Mail className="size-5" />
          </Link>
          {/* Placeholders until accounts and notifications exist */}
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Notifications"
            className={cn(iconButton, "hidden sm:inline-flex")}
          >
            <Bell className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Account"
            className={cn(iconButton, "hidden sm:inline-flex")}
          >
            <User className="size-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
