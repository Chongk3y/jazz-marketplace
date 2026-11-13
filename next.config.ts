import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Listing photos in Supabase Storage (any project).
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // Room for a 5 MB photo plus the other form fields.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
