"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0e] text-white">
      <div className="text-center">
        <div className="text-6xl font-bold mb-4">404</div>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-sm font-medium transition-all"
        >
          Back to All In One Engine
        </Link>
      </div>
    </div>
  );
}
