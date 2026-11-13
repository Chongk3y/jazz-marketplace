import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CreateListingForm } from "@/components/marketplace/create-listing-form";

export const metadata: Metadata = { title: "Create listing · Marketplace" };

export default function CreateListingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:py-6 md:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>
      <h1 className="mt-4 mb-5 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">
        Create new listing
      </h1>
      <CreateListingForm />
    </main>
  );
}
