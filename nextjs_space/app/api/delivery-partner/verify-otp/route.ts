import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPersonalNotification } from "@/lib/notifications";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, otp } = body ?? {};

    if (!orderId || !otp) {
      return NextResponse.json({ error: "Order ID and 4-digit OTP are required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const cleanOtp = String(otp).trim();
    const targetOtp = String(order.deliveryOtp || "").trim();

    if (!targetOtp) {
      return NextResponse.json({ error: "No OTP was generated for this order yet. Please ask admin or refresh order page." }, { status: 400 });
    }

    if (cleanOtp !== targetOtp) {
      return NextResponse.json({ error: "Incorrect 4-digit OTP. Please ask customer to check their order page or notification." }, { status: 400 });
    }

    const isReturn = order.status?.includes("RETURN") || order.status?.includes("REFUND");
    const newStatus = isReturn ? "RETURN_SUCCESS" : "DELIVERED";
    const updateData: any = {
      status: newStatus,
      paymentStatus: isReturn ? order.paymentStatus : "PAID",
    };

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Create tracking log entry
    const note = isReturn
      ? "Return item picked up successfully by Hello Bazaar Delivery Executive via 4-digit OTP verification."
      : "Order delivered successfully to customer by Hello Bazaar Delivery Executive via 4-digit OTP verification.";

    await prisma.orderTracking.create({
      data: {
        orderId,
        status: newStatus,
        note,
      },
    });

    // Trigger push notification to customer
    try {
      const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
      const title = isReturn ? `🔄 Return Picked Up - #${orderNum}` : `🎉 Order Delivered - #${orderNum}`;
      const msg = isReturn
        ? `Your return package has been picked up by our delivery executive.`
        : `Your order #${orderNum} has been delivered successfully! Thank you for shopping with Hello Bazaar.`;

      sendPersonalNotification(order.userId, title, msg, undefined, `/orders/${order.id}`);

      // Send Super Admin Discord alert
      sendDiscordNotification({
        title: isReturn ? `🔄 Return Picked Up: #${orderNum}` : `🚚 Order Delivered Successfully: #${orderNum}`,
        description: isReturn
          ? `Return package for order #${orderNum} has been picked up by Delivery Partner with 4-digit OTP verification.`
          : `Order #${orderNum} has been delivered to customer by Delivery Partner with 4-digit OTP verification.`,
        color: isReturn ? 10181046 : 5763719,
        fields: [
          { name: "Order ID", value: `#${orderNum}`, inline: true },
          { name: "Status", value: newStatus, inline: true },
          { name: "Total Amount", value: `₹${(order.total || 0).toLocaleString("en-IN")}`, inline: true },
        ],
      });
    } catch (e) {
      console.error("Notification error on delivery OTP verify:", e);
    }

    return NextResponse.json({
      success: true,
      message: isReturn ? "Return pickup verified successfully!" : "Order delivery verified & marked as DELIVERED!",
    });
  } catch (err: any) {
    console.error("Delivery OTP verify POST error:", err);
    return NextResponse.json({ error: "Failed to verify OTP: " + err.message }, { status: 500 });
  }
}
