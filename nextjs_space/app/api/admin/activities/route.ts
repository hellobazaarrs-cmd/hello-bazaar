import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type") || "ALL"; // ALL, DEALER, CUSTOMER

    const [users, products, orders] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    const activities: any[] = [];

    // Process Dealer & User Registrations
    users.forEach((u: any) => {
      if (u.role === "DEALER") {
        activities.push({
          id: `act-usr-${u.id}`,
          type: "DEALER",
          category: "Registration / Profile",
          title: `Dealer Registration: ${u.shopName || u.name}`,
          description: `Registered shop "${u.shopName || u.name}" (${u.phone}). GST: ${u.gstNumber || "No GST (Pending Verification)"}. Status: ${u.status || "PENDING"}.`,
          timestamp: u.createdAt || new Date(),
          user: { name: u.name, email: u.email, role: u.role, shopName: u.shopName },
          badgeColor: "amber",
        });
      } else {
        activities.push({
          id: `act-usr-${u.id}`,
          type: "CUSTOMER",
          category: "User Signup",
          title: `Customer Account Created: ${u.name}`,
          description: `New customer registered with email ${u.email} and phone ${u.phone || "N/A"}.`,
          timestamp: u.createdAt || new Date(),
          user: { name: u.name, email: u.email, role: u.role },
          badgeColor: "sky",
        });
      }
    });

    // Process Dealer Product Uploads
    products.forEach((p: any) => {
      const isDealerProduct = !!p.dealerId || p.shopName;
      activities.push({
        id: `act-prd-${p.id}`,
        type: isDealerProduct ? "DEALER" : "ADMIN",
        category: "Product Upload",
        title: `${isDealerProduct ? "Dealer Product Uploaded" : "Super Admin Product Added"}: ${p.name}`,
        description: `Product "${p.name}" listed under price ₹${p.price}. Status: ${p.status || "LIVE"}. Shop: ${p.shopName || "Hello Bazaar Official Store"}.`,
        timestamp: p.createdAt || new Date(),
        user: { name: p.shopName || "Admin", shopName: p.shopName },
        badgeColor: isDealerProduct ? "amber" : "purple",
      });
    });

    // Process Customer Orders
    orders.forEach((o: any) => {
      const isDealerOrder = Array.isArray(o.items) && o.items.some((item: any) => item.dealerId || item.shopName);
      activities.push({
        id: `act-ord-${o.id}`,
        type: "CUSTOMER",
        category: "Customer Purchase",
        title: `New Order Placed #${o.id.slice(-8).toUpperCase()}`,
        description: `Order worth ₹${o.total || o.totalAmount || 0} placed via ${o.paymentMethod || "COD"}. Delivery to ${o.shippingAddress?.fullName || o.customerName || "Customer"}.`,
        timestamp: o.createdAt || new Date(),
        user: { name: o.customerName || o.userId, phone: o.phone },
        badgeColor: "emerald",
      });
    });

    // Sort all activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let filtered = activities;
    if (filterType === "DEALER") {
      filtered = activities.filter((a) => a.type === "DEALER");
    } else if (filterType === "CUSTOMER") {
      filtered = activities.filter((a) => a.type === "CUSTOMER");
    }

    return NextResponse.json({
      activities: filtered,
      counts: {
        total: activities.length,
        dealers: activities.filter((a) => a.type === "DEALER").length,
        customers: activities.filter((a) => a.type === "CUSTOMER").length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load audit activities" }, { status: 500 });
  }
}
