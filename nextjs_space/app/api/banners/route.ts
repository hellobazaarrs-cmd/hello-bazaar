import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany();
    const activeBanners = banners.filter((b: any) => b.active !== false);

    // Sort by orderIndex ascending
    activeBanners.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return NextResponse.json(
      { banners: activeBanners },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch active banners" }, { status: 500 });
  }
}

