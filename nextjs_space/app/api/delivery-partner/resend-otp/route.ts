import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPersonalNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body ?? {};

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let otp = order.deliveryOtp;

    // Generate if missing
    if (!otp) {
      const activeOrders = await prisma.order.findMany({ select: { deliveryOtp: true } });
      const usedOtps = new Set(activeOrders.map((o: any) => o.deliveryOtp).filter(Boolean));
      for (let i = 0; i < 1000; i++) {
        otp = Math.floor(1000 + Math.random() * 9000).toString();
        if (!usedOtps.has(otp)) break;
      }
      await prisma.order.update({
        where: { id: orderId },
        data: { deliveryOtp: otp },
      });
    }

    const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
    sendPersonalNotification(
      order.userId,
      `📦 Delivery OTP - #${orderNum}`,
      `Your 4-digit delivery verification OTP is ${otp}. Please share this with your delivery executive.`,
      undefined,
      `/orders/${order.id}`
    );

    return NextResponse.json({
      success: true,
      message: `OTP (${otp}) push notification sent to customer successfully!`,
      otp,
    });
  } catch (err: any) {
    console.error("Resend OTP POST error:", err);
    return NextResponse.json({ error: "Failed to resend OTP: " + err.message }, { status: 500 });
  }
}
