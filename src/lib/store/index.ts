/**
 * The app's single entry point for data. Uses Supabase when SUPABASE_URL and
 * SUPABASE_SECRET_KEY are set, otherwise local files in `.data/`.
 */
import "server-only";

import { isSupabaseConfigured } from "./config";
import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { Store } from "./types";

export const storeMode: "supabase" | "local" = isSupabaseConfigured()
  ? "supabase"
  : "local";

const store: Store = storeMode === "supabase" ? supabaseStore : localStore;

export const {
  getListings,
  getListing,
  createListing,
  createMessage,
  getMessages,
  savePhoto,
} = store;

export { MAX_PHOTO_BYTES, PHOTO_TYPES } from "./photos";
