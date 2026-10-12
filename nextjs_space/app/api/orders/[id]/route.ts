import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      address: true,
      tracking: { orderBy: { createdAt: "asc" } },
      user: { select: { fullName: true, email: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && order.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Auto-generate 4-digit OTP if order is in packaging or delivery stages
  const otpEligibleStatuses = [
    "PACKAGING_STARTED",
    "PACKAGING_COMPLETED",
    "READY_FOR_DISPATCH",
    "DISPATCHED",
    "OUT_FOR_DELIVERY",
    "RETURN_REQUESTED",
    "RETURN_ACCEPTED",
    "RETURN_PROCESSING",
  ];

  if (otpEligibleStatuses.includes(order.status) && !order.deliveryOtp) {
    try {
      const activeOrders = await prisma.order.findMany({ select: { deliveryOtp: true } });
      const usedOtps = new Set(activeOrders.map((o: any) => o.deliveryOtp).filter(Boolean));
      let newOtp = "";
      for (let i = 0; i < 1000; i++) {
        newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        if (!usedOtps.has(newOtp)) break;
      }
      await prisma.order.update({
        where: { id: params.id },
        data: { deliveryOtp: newOtp },
      });
      order.deliveryOtp = newOtp;

      // Send push notification with OTP
      try {
        const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
        const { sendPersonalNotification } = await import("@/lib/notifications");
        sendPersonalNotification(
          order.userId,
          `📦 Delivery OTP - #${orderNum}`,
          `Your 4-digit delivery verification OTP is ${newOtp}. Please share this with your delivery executive.`,
          undefined,
          `/orders/${order.id}`
        );
      } catch (e) {
        console.error("Push notification error:", e);
      }
    } catch (err) {
      console.error("Failed to auto-generate delivery OTP:", err);
    }
  }

  return NextResponse.json(order);
}
