// Keep in sync with the category check in supabase/schema.sql.
export const categories = [
  "Vehicles",
  "Property Rentals",
  "Apparel",
  "Classifieds",
  "Electronics",
  "Entertainment",
  "Family",
  "Free Stuff",
  "Garden & Outdoor",
  "Hobbies",
  "Home Goods",
  "Home Improvement",
  "Home Sales",
  "Musical Instruments",
  "Office Supplies",
  "Pet Supplies",
  "Sporting Goods",
  "Toys & Games",
  "Buy and sell groups",
] as const;

export type Category = (typeof categories)[number];

export type Listing = {
  id: string;
  title: string;
  price: number;
  description: string;
  category: Category;
  location: string;
  sellerEmail: string;
  image: string;
  createdAt: string;
  status: ListingStatus;
};

export type ListingStatus = "available" | "sold";

/** A seller, identified by the email on their listings (there is no login). */
export type Seller = {
  email: string;
  stripeAccountId: string | null;
  /** Stripe says the account can accept payments. */
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
};

/** Amounts are in the smallest currency unit (cents). */
export type NewOrder = {
  listingId: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  stripeAccountId: string;
  amountTotal: number;
  applicationFeeAmount: number;
  currency: string;
  buyerEmail: string | null;
};

export type Order = NewOrder & {
  id: string;
  listingTitle: string;
  createdAt: string;
};

export type RecordOrderResult = {
  orderId: string | null;
  alreadyRecorded: boolean;
  listingMarkedSold: boolean;
};

export type Message = {
  id: string;
  listingId: string;
  buyerEmail: string;
  body: string;
  createdAt: string;
};

/** A buyer message together with the listing it's about. */
export type MessageWithListing = Message & {
  listingTitle: string;
  sellerEmail: string;
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Emails are stored lowercased so a seller matches all their listings. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const HOUR = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

// Seed data: copied into the local store on first run, or into Supabase by
// `npm run db:seed`.
const sampleListingData: Omit<Listing, "status">[] = [
  {
    id: "vintage-road-bike",
    title: "Vintage road bike",
    price: 120,
    description:
      "Good condition, recently tuned up. New brake pads and chain. Pick up on campus!",
    category: "Sporting Goods",
    location: "Palo Alto, CA",
    sellerEmail: "alex.seller@example.com",
    image: photo("1485965120184-e220f721d03e"),
    createdAt: ago(0.1),
  },
  {
    id: "wireless-headphones",
    title: "Wireless over-ear headphones",
    price: 85,
    description:
      "Noise cancelling, about 30 hours of battery. Comes with case and charging cable.",
    category: "Electronics",
    location: "Menlo Park, CA",
    sellerEmail: "jordan.k@example.com",
    image: photo("1505740420928-5e560c06d30e"),
    createdAt: ago(2),
  },
  {
    id: "silver-watch",
    title: "Silver watch, white band",
    price: 60,
    description: "Worn a handful of times. Comfortable band, keeps perfect time.",
    category: "Apparel",
    location: "Stanford, CA",
    sellerEmail: "sam.r@example.com",
    image: photo("1523275335684-37898b6baf30"),
    createdAt: ago(5),
  },
  {
    id: "red-running-shoes",
    title: "Red running shoes, size 10",
    price: 45,
    description: "Lightly used, lots of tread left. Too small for me.",
    category: "Apparel",
    location: "Mountain View, CA",
    sellerEmail: "casey.t@example.com",
    image: photo("1542291026-7eec264c27ff"),
    createdAt: ago(8),
  },
  {
    id: "laptop-13-inch",
    title: '13" laptop, 16GB RAM',
    price: 650,
    description:
      "Great for school. Battery health 91%. Includes charger. Wiped and ready to go.",
    category: "Electronics",
    location: "Palo Alto, CA",
    sellerEmail: "riley.m@example.com",
    image: photo("1517336714731-489689fd1ca8"),
    createdAt: ago(12),
  },
  {
    id: "green-velvet-sofa",
    title: "Green velvet sofa",
    price: 300,
    description:
      "Comfy, no stains or tears, from a smoke-free and pet-free home. You pick up.",
    category: "Home Goods",
    location: "Redwood City, CA",
    sellerEmail: "morgan.l@example.com",
    image: photo("1555041469-a586c61ea9bc"),
    createdAt: ago(20),
  },
  {
    id: "smartphone",
    title: "Unlocked smartphone, 128GB",
    price: 280,
    description: "Screen protector since day one, no scratches. Unlocked for any carrier.",
    category: "Electronics",
    location: "Sunnyvale, CA",
    sellerEmail: "taylor.b@example.com",
    image: photo("1511707171634-5f897ff02aa9"),
    createdAt: ago(26),
  },
  {
    id: "film-camera",
    title: "Camera with 50mm lens",
    price: 400,
    description: "Body and lens in great shape. Includes strap, battery and charger.",
    category: "Hobbies",
    location: "Palo Alto, CA",
    sellerEmail: "jamie.p@example.com",
    image: photo("1516035069371-29a1b244cc32"),
    createdAt: ago(30),
  },
  {
    id: "studio-apartment",
    title: "Sunny studio near downtown",
    price: 2300,
    description:
      "Monthly rent. Furnished studio, in-unit laundry, 10 minutes walk to Caltrain. Available Dec 1.",
    category: "Property Rentals",
    location: "Palo Alto, CA",
    sellerEmail: "landlord.pa@example.com",
    image: photo("1560448204-e02f11c3d0e2"),
    createdAt: ago(40),
  },
  {
    id: "blue-coupe",
    title: "2016 blue coupe",
    price: 9800,
    description: "72k miles, clean title, regular maintenance records available.",
    category: "Vehicles",
    location: "San Jose, CA",
    sellerEmail: "drew.c@example.com",
    image: photo("1502877338535-766e1452684a"),
    createdAt: ago(52),
  },
  {
    id: "acoustic-guitar",
    title: "Acoustic guitar",
    price: 150,
    description: "Plays well, new strings. Soft case included.",
    category: "Musical Instruments",
    location: "Los Altos, CA",
    sellerEmail: "quinn.d@example.com",
    image: photo("1510915361894-db8b60106cb1"),
    createdAt: ago(60),
  },
  {
    id: "white-wooden-stool",
    title: "White wooden stool",
    price: 75,
    description: "Solid wood, sturdy. Great as a bar stool or plant stand.",
    category: "Home Goods",
    location: "Palo Alto, CA",
    sellerEmail: "avery.h@example.com",
    image: photo("1503602642458-232111445657"),
    createdAt: ago(72),
  },
  {
    id: "sunglasses",
    title: "Polarized sunglasses",
    price: 35,
    description: "Like new, with case and cleaning cloth.",
    category: "Apparel",
    location: "Stanford, CA",
    sellerEmail: "parker.j@example.com",
    image: photo("1572635196237-14b3f281503f"),
    createdAt: ago(90),
  },
  {
    id: "smart-watch",
    title: "Smartwatch with sport band",
    price: 140,
    description: "Fitness tracking and notifications. Battery lasts all day.",
    category: "Electronics",
    location: "Mountain View, CA",
    sellerEmail: "rowan.s@example.com",
    image: photo("1546868871-7041f2a55e12"),
    createdAt: ago(110),
  },
  {
    id: "accent-armchair",
    title: "Accent armchair",
    price: 120,
    description: "Comfortable reading chair. Moving out, must go this week.",
    category: "Home Goods",
    location: "Menlo Park, CA",
    sellerEmail: "emerson.f@example.com",
    image: photo("1586023492125-27b2c045efd7"),
    createdAt: ago(130),
  },
];

export const sampleListings: Listing[] = sampleListingData.map((listing) => ({
  ...listing,
  status: "available",
}));

/** Formats an amount in cents, e.g. 4550 → "$45.50". */
export function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatPrice(price: number) {
  if (price === 0) return "Free";
  // Whole dollars: "$120". With cents: always two digits, "$45.50".
  const digits = Number.isInteger(price) ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(price);
}

/** Uploaded photos are served by our own route and skip the image optimizer. */
export function isLocalImage(src: string) {
  return src.startsWith("/api/uploads/");
}

export function listedAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 15) return "Listed just now";
  if (minutes < 60) return `Listed ${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Listed ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Listed ${days} day${days === 1 ? "" : "s"} ago`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug?: string) {
  return categories.find((c) => slugify(c) === slug);
}
