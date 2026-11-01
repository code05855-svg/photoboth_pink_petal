import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages.
 *
 * NEXT_PUBLIC_BASE_PATH is set by the GitHub Actions workflow to "/<repo-name>"
 * (or "" for a user/organisation site such as <user>.github.io). Locally it is
 * empty, so `npm run dev` and `npm run build && npx serve out` just work.
 */
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true, // /camera/ -> camera/index.html, which GitHub Pages serves on refresh
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
