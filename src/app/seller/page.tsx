import { ArrowLeft, BadgeCheck, CreditCard, Mail, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ConnectStripeForm } from "@/components/marketplace/connect-stripe-form";
import { Card } from "@/components/ui/card";
import { paymentsEnabled, PLATFORM_FEE_PERCENT } from "@/lib/payments";
import { stripeSandbox } from "@/lib/stripe";

export const metadata: Metadata = { title: "Get paid with Stripe · Marketplace" };

const steps = [
  { icon: Mail, text: "Enter the email you used on your listings." },
  { icon: CreditCard, text: "Finish Stripe's secure sign-up (sandbox: test data is fine)." },
  { icon: BadgeCheck, text: "Your listings get a Buy Now button. Buyers pay by card." },
  {
    icon: Store,
    text: `Stripe pays you the sale price minus a ${PLATFORM_FEE_PERCENT}% marketplace fee.`,
  },
];

export default function SellerPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-5 sm:py-6 md:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">
        Get paid with Stripe
      </h1>
      <p className="mt-2 text-muted-foreground">
        Connect a Stripe account to sell your items online.
      </p>

      <Card className="mt-5 gap-5 p-4 shadow-sm ring-foreground/5 sm:p-5">
        <ol className="space-y-3">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Icon className="size-4" />
              </span>
              <span className="pt-1">
                <span className="sr-only">Step {i + 1}: </span>
                {text}
              </span>
            </li>
          ))}
        </ol>

        {!paymentsEnabled && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            Payments aren&apos;t set up on this site yet (Stripe and Supabase keys are needed).
          </p>
        )}

        <ConnectStripeForm disabled={!paymentsEnabled} />
      </Card>

      {paymentsEnabled && stripeSandbox && (
        <Card className="mt-4 gap-2 p-4 text-sm shadow-sm ring-foreground/5 sm:p-5">
          <p className="font-semibold">Sandbox tips for Stripe&apos;s screens</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              The sign-in email is pre-filled with a made-up address. Keep it (don&apos;t
              use a real email).
            </li>
            <li>
              Phone <code className="text-foreground">000 000 0000</code>, verification code{" "}
              <code className="text-foreground">000000</code>.
            </li>
            <li>If asked for a password, use a new one you don&apos;t use anywhere else.</li>
            <li>
              Use Stripe&apos;s &ldquo;test data&rdquo; options, or: SSN{" "}
              <code className="text-foreground">000-00-0000</code>, address{" "}
              <code className="text-foreground">address_full_match</code>, routing{" "}
              <code className="text-foreground">110000000</code>, account{" "}
              <code className="text-foreground">000123456789</code>.
            </li>
          </ul>
        </Card>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        This demo runs in Stripe&apos;s sandbox: no real money moves. There&apos;s no login, so
        sellers are matched to listings by email.
      </p>
    </main>
  );
}
