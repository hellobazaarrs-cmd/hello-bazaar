import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = request.headers.get("host") || "HelloBazaars.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;

  return NextResponse.json({
    version: "2.1.4",
    minVersion: "2.0.0",
    apkUrl: `${baseUrl}/HelloBazaar.apk`,
    releaseNotes: "Performance optimizations, clean edge-to-edge layout, dynamic banners, and zero-gap UI update.",
    forceUpdate: false,
  });
}
