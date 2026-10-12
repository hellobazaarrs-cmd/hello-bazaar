import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { address: true, items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.paymentMethod !== "UPI") {
      return NextResponse.json({ error: "Payment method is not UPI" }, { status: 400 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    const upiKey = process.env.UPIGATEWAY_API_KEY || "deb6f1b4-55ce-40b0-b69a-bf7b66a56f47";
    const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://HelloBazaars.com";
    const redirectUrl = `${siteUrl}/api/checkout/upigateway/redirect?orderId=${order.id}`;
    const pInfo = order.items.map((ci: any) => ci.name).join(", ").slice(0, 90) || "Hello Bazaar Order";

    const payload = {
      key: upiKey,
      client_txn_id: `${order.id}_${Date.now()}`,
      amount: String(order.total),
      p_info: pInfo,
      customer_name: order.address?.fullName || "Customer",
      customer_email: session?.user?.email || "customer@HelloBazaars.com",

      customer_mobile: order.address?.phone || "9999999999",
      redirect_url: redirectUrl,
    };

    console.log("Re-creating UPIGateway order for existing order with payload:", payload);

    const upiRes = await fetch("https://merchant.upigateway.com/api/create_order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!upiRes.ok) {
      console.error("UPIGateway HTTP error:", upiRes.status, await upiRes.text());
      return NextResponse.json({ error: "Failed to regenerate payment link from gateway" }, { status: 500 });
    }

    const upiData = await upiRes.json();
    console.log("UPIGateway create_order response:", upiData);

    if (upiData.status && upiData.data && upiData.data.payment_url) {
      return NextResponse.json({ paymentUrl: upiData.data.payment_url });
    } else {
      console.error("UPIGateway returned error status:", upiData);
      return NextResponse.json({ error: upiData.msg || "Failed to initialize payment gateway" }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Error regenerating payment link:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
