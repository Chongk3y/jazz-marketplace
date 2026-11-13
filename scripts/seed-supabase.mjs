// Copies the 15 sample listings into your Supabase project.
// Usage: npm run db:seed            (only if the listings table is empty)
//        npm run db:seed -- --force (add them even if listings exist)
//
// Reads SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
import { createClient } from "@supabase/supabase-js";

import { sampleListings } from "../src/lib/data.ts";

const url = process.env.SUPABASE_URL?.trim();
const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !secretKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error: countError } = await db
  .from("listings")
  .select("id", { count: "exact", head: true });
if (countError) {
  console.error(`Could not read listings: ${countError.message}`);
  console.error("Did you run supabase/schema.sql in the SQL Editor?");
  process.exit(1);
}

if (count > 0 && !process.argv.includes("--force")) {
  console.log(`Skipped: listings already has ${count} row(s). Use --force to add samples anyway.`);
  process.exit(0);
}

const rows = sampleListings.map((l) => ({
  title: l.title,
  description: l.description,
  price: l.price,
  category: l.category,
  location: l.location,
  seller_email: l.sellerEmail,
  image_url: l.image,
  created_at: l.createdAt,
}));

const { error } = await db.from("listings").insert(rows);
if (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exit(1);
}
console.log(`Added ${rows.length} sample listings.`);
