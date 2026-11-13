"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { startTransition, useActionState, useState } from "react";

import { sendMessageAction, type MessageState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_RE } from "@/lib/data";

const DEFAULT_MESSAGE = "I'm interested in your item!";

export function MessageSellerForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState<MessageState, FormData>(
    sendMessageAction,
    {}
  );
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  // Lets "Send another message" hide the success panel without new server state.
  const [dismissed, setDismissed] = useState<MessageState | null>(null);

  const canSend = EMAIL_RE.test(email.trim()) && message.trim().length > 0;

  if (state.ok && dismissed !== state) {
    return (
      <div role="status" className="space-y-3 rounded-lg bg-brand/8 p-4">
        <p className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-5 text-brand" />
          Message saved
        </p>
        <p className="text-sm text-muted-foreground">
          The seller can reply to you at{" "}
          <span className="font-medium break-all text-foreground">{email}</span>. To
          reach them right away, email them at the address above.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setMessage(DEFAULT_MESSAGE);
            setDismissed(state);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      <div className="space-y-2">
        <Label htmlFor="buyer-email">Your email</Label>
        <Input
          id="buyer-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 bg-card text-base md:text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="buyer-message">Message</Label>
        <Textarea
          id="buyer-message"
          name="body"
          required
          rows={5}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="resize-none bg-card text-base md:text-sm"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button
        type="submit"
        disabled={!canSend || pending}
        className="h-11 w-full bg-brand text-base text-brand-foreground hover:bg-brand/90"
      >
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
