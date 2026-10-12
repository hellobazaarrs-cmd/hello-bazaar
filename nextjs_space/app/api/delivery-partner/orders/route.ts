import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        address: true,
        user: { select: { fullName: true, email: true, phone: true } },
      },
    });

    // Filter active delivery or return pickup tasks
    const activeTasks = orders.filter((o: any) => {
      const s = o.status;
      return (
        s === "OUT_FOR_DELIVERY" ||
        s === "DISPATCHED" ||
        s === "READY_FOR_DISPATCH" ||
        s === "RETURN_REQUESTED" ||
        s === "RETURN_ACCEPTED" ||
        s === "RETURN_PROCESSING" ||
        s === "DELIVERED"
      );
    });

    // Transform for Delivery Partner UI
    const formatted = activeTasks.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      type: o.status.includes("RETURN") ? "RETURN_PICKUP" : "DELIVERY",
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      deliveryOtp: o.deliveryOtp || null,
      createdAt: o.createdAt,
      customer: {
        name: o.address?.fullName || o.user?.fullName || "Customer",
        phone: o.address?.phone || o.user?.phone || "",
        email: o.user?.email || "",
      },
      address: o.address
        ? `${o.address.addressLine1}${o.address.addressLine2 ? ", " + o.address.addressLine2 : ""}, ${o.address.city}, ${o.address.state} - ${o.address.pincode}`
        : "Address Not Specified",
      city: o.address?.city || "Siwan",
      pincode: o.address?.pincode || "",
      items: (o.items || []).map((it: any) => ({
        id: it.id,
        name: it.productName || "Item",
        quantity: it.quantity || 1,
        price: it.price || 0,
        color: it.color || "",
      })),
    }));

    return NextResponse.json({ tasks: formatted });
  } catch (err: any) {
    console.error("Delivery partner orders GET error:", err);
    return NextResponse.json({ error: "Failed to load delivery tasks: " + err.message }, { status: 500 });
  }
}
