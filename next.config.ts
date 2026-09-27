import type { NextConfig } from "next";
import path from "path";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true";

console.log("[next.config] GITHUB_ACTIONS:", isGitHubPages, "| cwd:", process.cwd());

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  images: isGitHubPages ? { unoptimized: true } : undefined,
  basePath: isGitHubPages ? "/lapia-ai-agent" : "",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  trailingSlash: isGitHubPages,
  webpack: (config, ctx) => {
    const srcPath = path.resolve(process.cwd(), "src");
    console.log("[next.config] webpack config called! Setting @ →", srcPath);
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": srcPath,
    };
    return config;
  },
};

export default nextConfig;
