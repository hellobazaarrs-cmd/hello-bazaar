import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "DEALER" && currentUser?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const dealerId = currentUser.id;

    const allProducts = await prisma.product.findMany();
    const dealerProducts = allProducts.filter((p: any) => p.dealerId === dealerId);

    const allOrders = await prisma.order.findMany();
    const dealerOrders: any[] = [];
    const customerIds = new Set<string>();

    let totalRevenue = 0;

    allOrders.forEach((ord: any) => {
      let isDealerOrder = false;
      if (Array.isArray(ord.items)) {
        ord.items.forEach((item: any) => {
          const prod = dealerProducts.find((p: any) => p.id === item.productId || p.slug === item.productSlug);
          if (prod) {
            isDealerOrder = true;
            totalRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
          }
        });
      }

      if (isDealerOrder) {
        dealerOrders.push(ord);
        if (ord.userId) customerIds.add(ord.userId);
      }
    });

    const liveProducts = dealerProducts.filter((p: any) => p.status === "LIVE" || !p.status).length;
    const pendingProducts = dealerProducts.filter((p: any) => p.status === "PENDING_APPROVAL").length;

    return NextResponse.json({
      stats: {
        totalProducts: dealerProducts.length,
        liveProducts,
        pendingProducts,
        totalOrders: dealerOrders.length,
        totalRevenue,
        totalCustomers: customerIds.size,
      },
      recentOrders: dealerOrders.slice(0, 5),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load dealer stats" }, { status: 500 });
  }
}
