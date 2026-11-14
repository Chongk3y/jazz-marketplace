import { cn } from "@/lib/utils";

/** "Sold" label placed over a listing photo (parent must be `relative`). */
export function SoldBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "absolute top-2 left-2 rounded-full bg-foreground px-2.5 py-1 text-xs font-bold tracking-wide text-background uppercase shadow",
        className
      )}
    >
      Sold
    </span>
  );
}
