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

export type Listing = {
  id: number;
  price: number;
  title: string;
  location: string;
};

// Placeholder listings — swap for real data when a backend is wired up.
export const listings: Listing[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  price: 2300,
  title: "Lorem ipsum dolor sit",
  location: "Palo Alto, CA",
}));

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
