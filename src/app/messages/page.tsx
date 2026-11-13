import { ArrowLeft, Inbox, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getMessages } from "@/lib/store";

export const metadata: Metadata = { title: "Messages · Marketplace" };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

// There are no accounts yet, so this page would show every buyer's email to
// anyone. Only list messages in development until sign-in exists.
const canShowMessages = process.env.NODE_ENV !== "production";

export default async function MessagesPage() {
  const messages = canShowMessages ? await getMessages() : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:py-6 md:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Marketplace
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:mt-6 sm:text-3xl">
        Messages
      </h1>

      <p className="mt-3 flex gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          {canShowMessages
            ? "Development view of messages buyers have sent. This list is hidden on the live site until sign-in is added."
            : "Message history will be available here once sign-in is added."}
        </span>
      </p>

      {!canShowMessages ? null : messages.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages buyers send from a listing page will show up here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((message) => (
            <li key={message.id}>
              <Card className="gap-3 p-4 shadow-sm ring-foreground/5 sm:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <Link
                    href={`/item/${message.listingId}`}
                    className="font-semibold break-words hover:underline"
                  >
                    {message.listingTitle}
                  </Link>
                  <time
                    dateTime={message.createdAt}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {dateFormat.format(new Date(message.createdAt))}
                  </time>
                </div>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="break-all">{message.buyerEmail}</dd>
                  <dt className="text-muted-foreground">Seller</dt>
                  <dd className="break-all">{message.sellerEmail}</dd>
                </dl>
                <p className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-line break-words">
                  {message.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
