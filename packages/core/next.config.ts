import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // App Router with API routes; single deploy unit per ARCHITECTURE.md.
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
