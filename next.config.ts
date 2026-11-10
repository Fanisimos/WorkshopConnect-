import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is deliberately OFF: almost every page is per-user and
  // RLS-filtered, so request-time rendering is simpler and avoids any risk of
  // caching one user's data for another. See docs/decisions.md.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
