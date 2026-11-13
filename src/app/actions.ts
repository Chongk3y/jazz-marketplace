"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { categories, EMAIL_RE, type Category } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import {
  createListing,
  createMessage,
  getListing,
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  savePhoto,
} from "@/lib/store";

/* -------------------------- Create listing -------------------------- */

export type ListingField =
  | "photo"
  | "title"
  | "description"
  | "price"
  | "email"
  | "category"
  | "location";

export type CreateListingState = {
  errors?: Partial<Record<ListingField, string>>;
  values?: Partial<Record<Exclude<ListingField, "photo">, string>>;
};

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export async function createListingAction(
  _prev: CreateListingState,
  formData: FormData
): Promise<CreateListingState> {
  const values = {
    title: text(formData, "title"),
    description: text(formData, "description"),
    price: text(formData, "price"),
    email: text(formData, "email"),
    category: text(formData, "category"),
    location: text(formData, "location"),
  };
  const photo = formData.get("photo");
  const errors: CreateListingState["errors"] = {};

  if (!(photo instanceof File) || photo.size === 0) {
    errors.photo = "Add a photo of your item.";
  } else if (!PHOTO_TYPES[photo.type]) {
    errors.photo = "Use a JPG, PNG, WebP or GIF image.";
  } else if (photo.size > MAX_PHOTO_BYTES) {
    errors.photo = "Photo must be 5 MB or smaller.";
  }

  if (values.title.length < 3) errors.title = "Title must be at least 3 characters.";
  else if (values.title.length > 100) errors.title = "Keep the title under 100 characters.";

  if (!values.description) errors.description = "Describe your item.";
  else if (values.description.length > 2000)
    errors.description = "Keep the description under 2,000 characters.";

  const price = Number(values.price);
  if (values.price === "" || !Number.isFinite(price) || price < 0)
    errors.price = "Enter a price of 0 or more.";
  else if (price > 10_000_000) errors.price = "That price is too high.";

  if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address.";

  if (!categories.includes(values.category as Category))
    errors.category = "Choose a category.";

  if (!values.location) errors.location = "Enter where buyers can pick it up.";

  if (Object.keys(errors).length > 0) return { errors, values };

  const image = await savePhoto(photo as File);
  const listing = await createListing({
    title: values.title,
    description: values.description,
    price: Math.round(price * 100) / 100,
    sellerEmail: values.email,
    category: values.category as Category,
    location: values.location,
    image,
  });

  revalidatePath("/");
  redirect(`/item/${listing.id}?created=1`);
}

/* -------------------------- Message seller -------------------------- */

export type MessageState = {
  ok?: boolean;
  /** Message was saved, but the email service rejected the notification. */
  emailFailed?: boolean;
  error?: string;
  values?: { email: string; body: string };
};

export async function sendMessageAction(
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const listingId = text(formData, "listingId");
  const email = text(formData, "email");
  const body = text(formData, "body");
  const values = { email, body };

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", values };
  if (!body) return { error: "Write a message to the seller.", values };
  if (body.length > 2000) return { error: "Keep your message under 2,000 characters.", values };

  const listing = await getListing(listingId);
  if (!listing) return { error: "This listing no longer exists.", values };

  const message = await createMessage({ listingId, buyerEmail: email, body });
  const sent = await sendEmail({
    to: listing.sellerEmail,
    replyTo: email,
    subject: `New message about "${listing.title}"`,
    text: `${body}\n\nReply to this buyer at ${email}.`,
    messageId: message.id,
    listingId,
  });

  revalidatePath("/messages");
  return { ok: true, emailFailed: sent.delivery === "failed" };
}
