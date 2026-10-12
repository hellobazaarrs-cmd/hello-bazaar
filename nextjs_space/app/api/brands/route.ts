import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany();
    const activeBrands = (Array.isArray(brands) ? brands : []).filter((b: any) => b.isActive !== false);
    activeBrands.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json(
      { brands: activeBrands },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ brands: [] }, { status: 200 });
  }
}
