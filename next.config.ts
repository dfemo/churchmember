import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(thisDir, "..");

const nextConfig: NextConfig = {
  // Vercel / monorepo: one lockfile at repo root; point Turbopack at it so the app resolves.
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
