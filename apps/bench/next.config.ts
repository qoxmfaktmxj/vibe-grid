import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@vibe-grid/core"],
};

export default nextConfig;
