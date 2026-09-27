import type { NextConfig } from "next";

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
  // Webpack config to ensure @ alias resolves (Turbopack has issues with tsconfig paths in CI)
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "./src",
    };
    return config;
  },
};

export default nextConfig;
