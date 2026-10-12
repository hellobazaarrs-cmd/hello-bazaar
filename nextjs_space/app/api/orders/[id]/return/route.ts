import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMulticastNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { reason } = await req.json().catch(() => ({}));

  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "Please provide a reason for return." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { tracking: { orderBy: { createdAt: "asc" } }, items: { include: { product: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "Only delivered orders can be requested for return." }, { status: 400 });
  }

  // Calculate return window days (default 7 days)
  let maxReturnDays = 7;
  if (order.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      const policyStr = item.product?.returnPolicy || "";
      const match = policyStr.match(/(\d+)/);
      if (match) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days < maxReturnDays) {
          maxReturnDays = days;
        }
      }
    });
  }

  // Calculate delivery date from tracking or updatedAt
  const deliveredTrack = (order.tracking || []).find((t: any) => t.status === "DELIVERED");
  const deliveryDateStr = deliveredTrack?.createdAt || order.updatedAt || order.createdAt;
  const deliveryTime = new Date(deliveryDateStr).getTime();
  const now = Date.now();
  const diffDays = (now - deliveryTime) / (1000 * 60 * 60 * 24);

  if (diffDays > maxReturnDays) {
    return NextResponse.json({ error: `The ${maxReturnDays}-day return window for this order has passed.` }, { status: 400 });
  }

  // Update order status to RETURN_REQUESTED
  await prisma.order.update({
    where: { id: params.id },
    data: {
      status: "RETURN_REQUESTED",
    },
  });

  // Create tracking entry
  await prisma.orderTracking.create({
    data: {
      orderId: params.id,
      status: "RETURN_REQUESTED",
      note: `Customer Return Request: ${reason.trim()}`,
    },
  });

  // Trigger admin notification
  try {
    sendMulticastNotification(
      "🔄 Order Return Requested",
      `Customer requested return for Order #${order.id.slice(-6).toUpperCase()}: ${reason.trim()}`,
      undefined,
      `/admin/orders/${order.id}`
    );
  } catch (err) {
    console.error("Failed to send return notification:", err);
  }

  return NextResponse.json({ success: true });
}
