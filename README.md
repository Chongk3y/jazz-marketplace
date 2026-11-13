# Marketplace

A buy-and-sell marketplace built with Next.js 15, React 19, Tailwind CSS and shadcn/ui.

- **Browse & search**: listings grid with category filters and search
- **Create listing**: photo upload, title, description, price, category, location, email
- **Listing detail**: full info, seller email and a Message Seller form
- **Message seller**: saves the message and emails the seller

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no settings, the app runs **fully locally**:

- Listings and messages are saved in `.data/db.json`, photos in `.data/uploads/`.
  The 15 sample listings are added on first run. Delete `.data/` to start over.
- No emails are sent. Seller emails appear at `/messages` and in the server console.

## Connect Supabase

1. **Create a project** at https://supabase.com/dashboard. Pick a region near your users
   and save the database password somewhere safe.
2. **Create the tables and photo storage.** In the dashboard, open **SQL Editor → New query**,
   paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates:
   - `listings`, `messages` and `email_outbox` tables, with Row Level Security on
   - a `search_listings` function used by the search bar
   - a public `listing-photos` storage bucket (images only, 5 MB max)
3. **Add your keys.** Copy `.env.example` to `.env.local`, then fill in from
   **Project Settings → API Keys** (and the project URL from **Data API** / the Connect button):
   - `SUPABASE_URL` — e.g. `https://abcdefgh.supabase.co`
   - `SUPABASE_SECRET_KEY` — a **secret** key (`sb_secret_…`) or the legacy `service_role` key.
     It stays on the server; never put it in a `NEXT_PUBLIC_` variable or share it.
4. **Restart** the dev server (`npm run dev`).
5. *(Optional)* **Add the sample listings:** `npm run db:seed`

Data in `.data/` is not copied to Supabase.

### How access works

All reads and writes happen on the server with the secret key. RLS is enabled on every
table: the public key can read listings only, and nobody but the server can read buyer
messages or the email log.

## Send real emails (optional, Resend)

1. Create an account at https://resend.com and an API key.
2. Verify a domain you own (Resend → Domains) so you can email any seller.
3. In `.env.local` set `RESEND_API_KEY` and `EMAIL_FROM`
   (e.g. `Marketplace <hello@yourdomain.com>`), then restart.

Emails use Reply-To set to the buyer, so the seller can just hit reply.
If sending fails, the message is still saved and the buyer is told the email didn't go out.

## Deploying

Set the same variables in your host's environment settings (e.g. Vercel → Project →
Settings → Environment Variables). Without Supabase, a deployed site can't keep
uploaded photos, so connect Supabase before deploying.

The `/messages` page lists every message, so it only shows them in development.
It stays hidden on the live site until sign-in is added.

## Project layout

| Path | What it is |
| --- | --- |
| `src/app/` | Pages: home, `/create`, `/item/[id]`, `/messages`; server actions in `actions.ts` |
| `src/lib/store/` | Data layer: `local.ts` (files) and `supabase.ts`, chosen in `index.ts` |
| `src/lib/email.ts` | Seller emails (Resend, or saved locally) |
| `src/lib/data.ts` | Types, categories, sample listings, formatting helpers |
| `supabase/schema.sql` | Database setup to run in Supabase |
| `scripts/seed-supabase.mjs` | Adds the sample listings to Supabase |
