"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { connectStripeAction, type ConnectState } from "@/app/payment-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ConnectStripeForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState<ConnectState, FormData>(
    connectStripeAction,
    {}
  );

  if (state.connected) {
    const n = state.connected.listingCount;
    return (
      <div role="status" className="space-y-3 rounded-lg bg-brand/8 p-4">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5 text-brand" />
          Already connected
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium break-all text-foreground">{state.email}</span> is
          connected to Stripe.{" "}
          {n === 0
            ? "Post a listing with this email and it will get a Buy Now button."
            : `${n} listing${n === 1 ? "" : "s"} with this email show${n === 1 ? "s" : ""} a Buy Now button.`}
        </p>
        <Link href={n === 0 ? "/create" : "/"} className={buttonVariants({ variant: "outline" })}>
          {n === 0 ? "Post a listing" : "Browse listings"}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seller-email">Seller email</Label>
        <Input
          id="seller-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          placeholder="The email on your listings"
          className="h-11 text-base md:text-sm"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "connect-error" : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Every listing posted with this email gets a Buy Now button once you finish.
        </p>
      </div>
      {state.error && (
        <p id="connect-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending || disabled}
        className="h-11 w-full bg-[#635bff] text-base text-white hover:bg-[#635bff]/90"
      >
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Opening Stripe…" : "Connect with Stripe"}
      </Button>
    </form>
  );
}
