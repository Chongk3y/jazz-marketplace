-- Marketplace schema for Supabase.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- Access model: the Next.js server talks to Supabase with the project's
-- SECRET key (server-only), which bypasses Row Level Security. RLS is still
-- turned on for every table so the public (anon/publishable) key can only
-- read listings — never buyer messages.

-- ------------------------------------------------------------------ listings

create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 3 and 100),
  description  text not null check (char_length(description) between 1 and 2000),
  price        numeric(12, 2) not null check (price >= 0 and price <= 10000000),
  category     text not null check (category in (
                 'Vehicles', 'Property Rentals', 'Apparel', 'Classifieds',
                 'Electronics', 'Entertainment', 'Family', 'Free Stuff',
                 'Garden & Outdoor', 'Hobbies', 'Home Goods', 'Home Improvement',
                 'Home Sales', 'Musical Instruments', 'Office Supplies',
                 'Pet Supplies', 'Sporting Goods', 'Toys & Games',
                 'Buy and sell groups')),
  location     text not null check (char_length(location) between 1 and 120),
  seller_email text not null check (seller_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  image_url    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category);

alter table public.listings enable row level security;

drop policy if exists "Listings are publicly readable" on public.listings;
create policy "Listings are publicly readable"
  on public.listings for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------------ messages

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings (id) on delete cascade,
  buyer_email text not null check (buyer_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_listing_id_idx on public.messages (listing_id);

-- RLS on with no policies: only the server (secret key) can read or write.
alter table public.messages enable row level security;

-- Earlier versions also had an email_outbox table for seller emails.
-- The app no longer sends email, so remove it if it exists.
drop table if exists public.email_outbox;

-- ------------------------------------------------------------------- search
-- Case-insensitive search across title, description, location and category.
-- Wildcards in the search text are escaped so they match literally.

create or replace function public.search_listings(
  search text default null,
  category_filter text default null
)
returns setof public.listings
language sql
stable
set search_path = ''
as $$
  select l.*
  from public.listings l
  where (category_filter is null or l.category = category_filter)
    and (
      coalesce(search, '') = ''
      or concat_ws(' ', l.title, l.description, l.location, l.category)
         ilike '%' || replace(replace(replace(search, '\', '\\'), '%', '\%'), '_', '\_') || '%'
    )
  order by l.created_at desc
  limit 200;
$$;

-- --------------------------------------------------------------- privileges
-- Explicit grants, in case the project doesn't expose new tables by default.
-- (RLS above still decides which rows anon/authenticated can see.)

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete
  on public.listings, public.messages
  to service_role;
grant select on public.listings to anon, authenticated;
revoke all on public.messages from anon, authenticated;
grant execute on function public.search_listings(text, text)
  to anon, authenticated, service_role;

-- -------------------------------------------------------------------- photos
-- Public bucket: anyone can view photos by URL. Uploads happen on the server
-- with the secret key, so no insert policy is needed (or wanted).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
