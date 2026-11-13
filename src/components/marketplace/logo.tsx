import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex flex-col items-start gap-2">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-full border-2 border-foreground bg-brand text-2xl font-black text-white"
      >
        M
      </span>
      <span className="text-2xl font-extrabold tracking-tight">
        Marketplace
      </span>
    </Link>
  );
}
