import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next doesn't pick up a parent
  // lockfile (e.g. ~/package-lock.json) when inferring the Turbopack root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
