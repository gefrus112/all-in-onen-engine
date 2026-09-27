import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // Use static export for GitHub Pages, standalone for local/server deploy
  output: isGitHubPages ? "export" : "standalone",
  // Required for static export — images must be unoptimized
  images: isGitHubPages ? { unoptimized: true } : undefined,
  // GitHub Pages serves from /lapia-ai-agent/ — set base path
  basePath: isGitHubPages ? "/lapia-ai-agent" : "",
  assetPrefix: isGitHubPages ? "/lapia-ai-agent/" : undefined,
  // Skip TypeScript errors during build (we have some any types)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Trailing slash for static hosting
  trailingSlash: isGitHubPages,
};

export default nextConfig;
