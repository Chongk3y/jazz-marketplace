-- Marketplace schema for Supabase.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- Access model: the Next.js server talks to Supabase with the project's
-- SECRET key (server-only), which bypasses Row Level Security. RLS is still
-- turned on for every table so the public (anon/publishable) key can only
-- read listings — never buyer messages, sellers' Stripe accounts or orders.

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

-- Payments: a listing is 'available' until a paid order marks it 'sold'.
alter table public.listings
  add column if not exists status  text not null default 'available',
  add column if not exists sold_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_status_check') then
    alter table public.listings
      add constraint listings_status_check check (status in ('available', 'sold'));
  end if;
end $$;

-- Sellers are matched to listings by email, so store emails lowercased.
update public.listings
set seller_email = lower(btrim(seller_email))
where seller_email <> lower(btrim(seller_email));

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_seller_email_idx on public.listings (seller_email);

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

-- ------------------------------------------------------------------- sellers
-- One row per seller email that started "Connect with Stripe". Every listing
-- with this email can be bought once charges_enabled is true.

create table if not exists public.sellers (
  email             text primary key
                    check (email = lower(email) and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  stripe_account_id text unique,
  charges_enabled   boolean not null default false,
  details_submitted boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.sellers enable row level security;

-- -------------------------------------------------------------------- orders
-- One row per paid Stripe Checkout Session (the unique session id stops
-- duplicate orders when Stripe delivers a webhook more than once).

create table if not exists public.orders (
  id                         uuid primary key default gen_random_uuid(),
  listing_id                 uuid references public.listings (id) on delete set null,
  listing_title              text not null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id   text,
  stripe_account_id          text not null,
  amount_total               integer not null check (amount_total >= 0),       -- cents
  application_fee_amount     integer not null check (application_fee_amount >= 0), -- cents
  currency                   text not null,
  buyer_email                text,
  created_at                 timestamptz not null default now()
);

create index if not exists orders_listing_id_idx on public.orders (listing_id);

alter table public.orders enable row level security;

-- Records a paid order and marks its listing sold, in one transaction.
-- Safe to call repeatedly for the same Checkout Session.
create or replace function public.record_order(
  p_listing_id             uuid,
  p_checkout_session_id    text,
  p_payment_intent_id      text,
  p_stripe_account_id      text,
  p_amount_total           integer,
  p_application_fee_amount integer,
  p_currency               text,
  p_buyer_email            text
)
returns table (order_id uuid, already_recorded boolean, listing_marked_sold boolean)
language plpgsql
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_marked   integer;
begin
  insert into public.orders (
    listing_id, listing_title, stripe_checkout_session_id, stripe_payment_intent_id,
    stripe_account_id, amount_total, application_fee_amount, currency, buyer_email
  )
  select l.id, l.title, p_checkout_session_id, p_payment_intent_id,
         p_stripe_account_id, p_amount_total, p_application_fee_amount, p_currency, p_buyer_email
  from public.listings l
  where l.id = p_listing_id
  on conflict (stripe_checkout_session_id) do nothing
  returning id into v_order_id;

  if v_order_id is null then
    -- Already recorded (or the listing no longer exists).
    select o.id into v_order_id
    from public.orders o
    where o.stripe_checkout_session_id = p_checkout_session_id;
    return query select v_order_id, v_order_id is not null, false;
    return;
  end if;

  update public.listings
  set status = 'sold', sold_at = now()
  where id = p_listing_id and status = 'available';
  get diagnostics v_marked = row_count;

  return query select v_order_id, false, v_marked > 0;
end;
$$;

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
  on public.listings, public.messages, public.sellers, public.orders
  to service_role;
grant select on public.listings to anon, authenticated;
revoke all on public.messages, public.sellers, public.orders from anon, authenticated;
grant execute on function public.search_listings(text, text)
  to anon, authenticated, service_role;

-- Only the server may record orders (functions are executable by everyone
-- unless revoked).
revoke all on function public.record_order(uuid, text, text, text, integer, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.record_order(uuid, text, text, text, integer, integer, text, text)
  to service_role;

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
