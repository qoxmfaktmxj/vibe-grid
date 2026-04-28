import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    externalDir: true,
  },
  transpilePackages: [
    "@vibe-grid/clipboard",
    "@vibe-grid/core",
    "@vibe-grid/excel",
    "@vibe-grid/i18n",
    "@vibe-grid/persistence",
    "@vibe-grid/react",
    "@vibe-grid/tanstack-adapter",
    "@vibe-grid/testing",
    "@vibe-grid/theme-shadcn",
    "@vibe-grid/virtualization",
  ],
};

export default nextConfig;
