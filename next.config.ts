import type { NextConfig } from "next";
import path from "path";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true";

const nextConfig: NextConfig = {
  // Use static export for GitHub Pages, standalone for local/server deploy
  output: isGitHubPages ? "export" : "standalone",
  // Required for static export — images must be unoptimized
  images: isGitHubPages ? { unoptimized: true } : undefined,
  // GitHub Pages serves from /lapia-ai-agent/ — set base path
  basePath: isGitHubPages ? "/lapia-ai-agent" : "",
  // Skip TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Trailing slash for static hosting
  trailingSlash: isGitHubPages,
  // Webpack config to ensure @ alias resolves (Turbopack doesn't in CI)
  webpack: (config, { dir }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(dir, "src"),
    };
    return config;
  },
};

export default nextConfig;
