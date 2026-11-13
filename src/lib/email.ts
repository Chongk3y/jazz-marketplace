import "server-only";

import { addToOutbox } from "@/lib/store";

type Email = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  messageId: string;
  listingId: string;
};

const resend = {
  apiKey: process.env.RESEND_API_KEY?.trim() || undefined,
  from: process.env.EMAIL_FROM?.trim() || undefined,
};

/** Real emails go out only when both Resend settings are present. */
export const emailMode: "resend" | "local" =
  resend.apiKey && resend.from ? "resend" : "local";

async function sendWithResend(email: Email) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resend.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resend.from,
      to: [email.to],
      reply_to: email.replyTo,
      subject: email.subject,
      text: email.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend ${response.status}: ${await response.text()}`);
  }
}

/**
 * Emails a seller and records it in the outbox (shown at /messages).
 *
 * Without Resend configured, nothing leaves the server: the email is only
 * recorded and printed to the console. Returns the outbox entry, whose
 * `delivery` says what happened.
 */
export async function sendEmail(email: Email) {
  let delivery: "local" | "sent" | "failed" = "local";

  if (emailMode === "resend") {
    try {
      await sendWithResend(email);
      delivery = "sent";
    } catch (error) {
      delivery = "failed";
      console.error("[email] Sending failed:", error);
    }
  } else {
    console.log(
      `\n[email] (not sent — no email service) To: ${email.to}\n[email] Reply-To: ${email.replyTo}\n[email] Subject: ${email.subject}\n${email.text}\n`
    );
  }

  return addToOutbox({ ...email, delivery });
}
