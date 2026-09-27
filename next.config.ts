import type { NextConfig } from "next";
import path from "path";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : "standalone",
  images: isGitHubPages ? { unoptimized: true } : undefined,
  basePath: isGitHubPages ? "/all-in-onen-engine" : "",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  trailingSlash: isGitHubPages,
  webpack: (config, ctx) => {
    const srcPath = path.resolve(process.cwd(), "src");
    // Set the @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": srcPath,
    };
    // Ensure .ts/.tsx extensions are resolved
    if (!config.resolve.extensions.includes(".ts")) {
      config.resolve.extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ...config.resolve.extensions];
    }
    return config;
  },
};

export default nextConfig;
