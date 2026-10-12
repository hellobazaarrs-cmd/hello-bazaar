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

    const allUsers = await prisma.user.findMany();
    const dealers = allUsers.filter((u: any) => u.role === "DEALER");

    const allProducts = await prisma.product.findMany();
    const allOrders = await prisma.order.findMany();

    // Enhance dealers with sales report and product count metrics
    const dealersWithMetrics = dealers.map((dealer: any) => {
      const dealerProducts = allProducts.filter((p: any) => p.dealerId === dealer.id);

      // Find orders that contain products belonging to this dealer
      let totalSalesAmount = 0;
      let totalOrdersCount = 0;

      allOrders.forEach((ord: any) => {
        let matches = false;
        if (Array.isArray(ord.items)) {
          ord.items.forEach((item: any) => {
            const prod = dealerProducts.find((p: any) => p.id === item.productId || p.slug === item.productSlug);
            if (prod) {
              matches = true;
              totalSalesAmount += (Number(item.price) || 0) * (Number(item.quantity) || 1);
            }
          });
        }
        if (matches) {
          totalOrdersCount += 1;
        }
      });

      return {
        id: dealer.id,
        fullName: dealer.fullName,
        email: dealer.email,
        phone: dealer.phone || "N/A",
        shopName: dealer.shopName || "Hello Bazaar Authorized Shop",
        shopAddress: dealer.shopAddress || "N/A",
        gstNumber: dealer.gstNumber || null,
        status: dealer.status || "APPROVED",
        createdAt: dealer.createdAt,
        metrics: {
          totalProducts: dealerProducts.length,
          pendingProducts: dealerProducts.filter((p: any) => p.status === "PENDING_APPROVAL").length,
          liveProducts: dealerProducts.filter((p: any) => p.status === "LIVE" || !p.status).length,
          totalOrders: totalOrdersCount,
          totalSalesRevenue: totalSalesAmount,
        },
      };
    });

    return NextResponse.json({ dealers: dealersWithMetrics });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch dealers" }, { status: 500 });
  }
}
