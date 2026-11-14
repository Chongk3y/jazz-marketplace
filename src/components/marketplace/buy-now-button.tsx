"use client";

import { Loader2, Lock } from "lucide-react";
import { useActionState } from "react";

import { buyNowAction, type BuyState } from "@/app/payment-actions";
import { Button } from "@/components/ui/button";

export function BuyNowButton({ listingId, label }: { listingId: string; label: string }) {
  const [state, formAction, pending] = useActionState<BuyState, FormData>(buyNowAction, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="listingId" value={listingId} />
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Lock className="size-4" />}
        {pending ? "Opening checkout…" : label}
      </Button>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
