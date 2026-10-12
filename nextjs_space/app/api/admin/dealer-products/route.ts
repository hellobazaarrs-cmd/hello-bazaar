import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const allProducts = await prisma.product.findMany();
    const dealerProducts = allProducts.filter((p: any) => Boolean(p.dealerId));

    // Sort: PENDING_APPROVAL first, then LIVE, then DECLINED
    dealerProducts.sort((a: any, b: any) => {
      if (a.status === "PENDING_APPROVAL" && b.status !== "PENDING_APPROVAL") return -1;
      if (a.status !== "PENDING_APPROVAL" && b.status === "PENDING_APPROVAL") return 1;
      return 0;
    });

    return NextResponse.json({ products: dealerProducts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch dealer products" }, { status: 500 });
  }
}
