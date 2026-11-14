/**
 * Local store: a JSON file plus an uploads folder under `.data/`.
 * Used when Supabase isn't configured. Data persists across restarts;
 * delete `.data/` to start over with the sample listings.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  sampleListings,
  slugify,
  type Listing,
  type Message,
} from "@/lib/data";

import { photoExtension } from "./photos";
import type { Store } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type Db = {
  listings: Listing[];
  messages: Message[];
};

async function readDb(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(DB_FILE, "utf8"));
    // Older files may still have an "outbox" array (ignored, dropped on the
    // next write) and listings without a status.
    return {
      listings: (db.listings ?? []).map((listing: Listing) => ({
        ...listing,
        status: listing.status ?? "available",
      })),
      messages: db.messages ?? [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seeded: Db = { listings: sampleListings, messages: [] };
    await writeDb(seeded);
    return seeded;
  }
}

async function writeDb(db: Db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

// Serialize writes so two requests can't overwrite each other's changes.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = fn(db);
    await writeDb(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

const stamp = () => ({ id: randomUUID(), createdAt: new Date().toISOString() });

function paymentsNeedSupabase(): never {
  throw new Error("Payments need Supabase: set SUPABASE_URL and SUPABASE_SECRET_KEY.");
}

export const localStore: Store = {
  async getListings({ category, query } = {}) {
    const { listings } = await readDb();
    const q = query?.trim().toLowerCase();
    return listings
      .filter((listing) => {
        if (category && slugify(listing.category) !== category) return false;
        if (!q) return true;
        return [listing.title, listing.description, listing.location, listing.category]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getListing(id) {
    const { listings } = await readDb();
    return listings.find((listing) => listing.id === id);
  },

  async getListingsBySeller(email) {
    const { listings } = await readDb();
    return listings
      .filter((listing) => listing.sellerEmail.toLowerCase() === email)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createListing(input) {
    return mutate((db) => {
      const listing: Listing = { ...input, ...stamp(), status: "available" };
      db.listings.push(listing);
      return listing;
    });
  },

  createMessage(input) {
    return mutate((db) => {
      const message: Message = { ...input, ...stamp() };
      db.messages.push(message);
      return message;
    });
  },

  async getMessages() {
    const { listings, messages } = await readDb();
    const byId = new Map(listings.map((listing) => [listing.id, listing]));
    return messages
      .flatMap((message) => {
        const listing = byId.get(message.listingId);
        return listing
          ? [{ ...message, listingTitle: listing.title, sellerEmail: listing.sellerEmail }]
          : [];
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async savePhoto(file) {
    const name = `${randomUUID()}.${photoExtension(file)}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return `/api/uploads/${name}`;
  },

  // Payments are only implemented for Supabase. Locally no seller is ever
  // onboarded, so nothing shows a Buy Now button.
  async getSeller() {
    return undefined;
  },
  async getSellerByAccount() {
    return undefined;
  },
  async saveSeller() {
    paymentsNeedSupabase();
  },
  async updateSellerStatus() {},
  async recordOrder() {
    paymentsNeedSupabase();
  },
  async getOrderBySession() {
    return undefined;
  },
};
