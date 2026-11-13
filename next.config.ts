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
    // A 4 MB photo plus the other fields; matches Vercel's 4.5 MB request cap.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
};

export default nextConfig;
