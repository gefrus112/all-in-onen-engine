import { NextResponse } from "next/server";

// Force static — this route will be pre-rendered at build time
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({ message: "All In One Engine API", version: "1.0.0" });
}
