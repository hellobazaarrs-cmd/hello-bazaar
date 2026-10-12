import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";
import { isDeliveryAvailable, getDeliveryErrorMessage } from "@/lib/pincodes";

export const dynamic = "force-dynamic";

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RK-${ts}-${rand}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { not: "PENDING_PAYMENT" },
    },
    include: { items: true, address: true, tracking: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { addressId, paymentMethod, notes, couponCode } = await req.json();
  if (!addressId || !paymentMethod) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (paymentMethod !== "COD") {
    return NextResponse.json({ error: "Only Cash on Delivery (COD) is supported." }, { status: 400 });
  }

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

  if (!isDeliveryAvailable(address.pincode)) {
    return NextResponse.json({ error: getDeliveryErrorMessage(address.pincode) }, { status: 400 });
  }

  const cartItems = await prisma.cartItem.findMany({ where: { userId }, include: { product: true } });
  if (cartItems.length === 0) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

  // Verify stock availability
  for (const ci of cartItems) {
    if (!ci.product) {
      return NextResponse.json({ error: "One of the products in your cart no longer exists" }, { status: 400 });
    }
    const currentStock = ci.product.stock ?? 0;
    if (ci.quantity > currentStock) {
      return NextResponse.json({ 
        error: `Insufficient stock for product: ${ci.product.name}. Only ${currentStock} available, but you requested ${ci.quantity}.` 
      }, { status: 400 });
    }
  }

  const subtotal = cartItems.reduce((s: number, c: any) => s + c.product.price * c.quantity, 0);
  const shipping = subtotal > 10000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.18);

  let verifiedDiscount = 0;
  let appliedCoupon: any = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode.toUpperCase().trim() },
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const expiry = new Date(coupon.expiresAt);
      const isExpired = now > expiry;
      const usageLimitReached = coupon.maxUses != null && (coupon.usedCount ?? 0) >= coupon.maxUses;
      const minOrderSatisfied = subtotal >= coupon.minOrder;

      if (!isExpired && !usageLimitReached && minOrderSatisfied) {
        appliedCoupon = coupon;
        if (coupon.type === "PERCENT") {
          verifiedDiscount = Math.round((subtotal * coupon.value) / 100);
        } else {
          verifiedDiscount = Math.min(coupon.value, subtotal);
        }
      }
    }
  }

  const total = Math.max(0, subtotal + shipping + tax - verifiedDiscount);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId,
      addressId,
      subtotal, 
      shipping, 
      tax, 
      total,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      couponDiscount: verifiedDiscount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
      status: paymentMethod === "UPI" ? "PENDING_PAYMENT" : "ORDER_RECEIVED",
      notes: notes ?? null,
      items: {
        create: cartItems.map((ci: any) => ({
          productId: ci.productId,
          variantId: ci.variantId || null,
          variantName: ci.variantName || null,
          sku: ci.sku || null,
          ram: ci.ram || null,
          storage: ci.storage || null,
          color: ci.color || null,
          name: ci.variantName ? `${ci.product.name} - ${ci.variantName}` : ci.product.name,
          image: ci.product.image,
          price: ci.price != null ? ci.price : ci.product.price,
          quantity: ci.quantity,
        })),
      },
      tracking: {
        create: {
          status: paymentMethod === "UPI" ? "PENDING_PAYMENT" : "ORDER_RECEIVED",
          note: paymentMethod === "UPI" ? "Waiting for payment verification." : "Your order has been received and is being processed."
        },
      },
    },
    include: { items: true, address: true, tracking: true },
  });

  // Increment coupon usage count
  if (appliedCoupon) {
    await prisma.coupon.update({
      where: { id: appliedCoupon.id },
      data: { usedCount: (appliedCoupon.usedCount ?? 0) + 1 },
    });
  }

  // Decrement product stock
  for (const ci of cartItems) {
    const newStock = Math.max(0, (ci.product.stock ?? 0) - ci.quantity);
    await prisma.product.update({
      where: { id: ci.productId },
      data: { stock: newStock }
    });
  }

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { userId } });

  // Trigger Discord Notification for New Order
  sendDiscordNotification({
    title: "🛍️ New Order Placed!",
    description: `Order **${order.orderNumber}** has been received successfully.`,
    color: 3066993, // Green
    fields: [
      { name: "Total Amount", value: `₹${order.total.toLocaleString("en-IN")}`, inline: true },
      { name: "Payment Method", value: order.paymentMethod, inline: true },
      { name: "Customer", value: `${address.fullName} (${session?.user?.email || 'N/A'})`, inline: true },
      { name: "Phone", value: address.phone || 'N/A', inline: true },
      { name: "Shipping Address", value: `${address.fullName}, ${address.phone}, ${address.addressLine1 || address.street || ""}${address.addressLine2 ? ", " + address.addressLine2 : ""}, ${address.city}, ${address.state} - ${address.pincode || address.postalCode || ""}` },
      {
        name: "Items Purchased",
        value: cartItems
          .map((item: any) => `• ${item.product.name} (x${item.quantity}) - ₹${(item.product.price * item.quantity).toLocaleString("en-IN")}`)
          .join("\n"),
      },
    ],
  });

  // Call UPIGateway API if paymentMethod is UPI
  let paymentUrl = null;
  if (paymentMethod === "UPI") {
    try {
      const upiKey = process.env.UPIGATEWAY_API_KEY || "deb6f1b4-55ce-40b0-b69a-bf7b66a56f47";
      const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://HelloBazaars.com";
      const redirectUrl = `${siteUrl}/api/checkout/upigateway/redirect?orderId=${order.id}`;
      const pInfo = cartItems.map((ci: any) => ci.product.name).join(", ").slice(0, 90) || "Hello Bazaar Order";

      const payload = {
        key: upiKey,
        client_txn_id: `${order.id}_${Date.now()}`,
        amount: String(order.total),
        p_info: pInfo,
        customer_name: address.fullName || "Customer",
        customer_email: session?.user?.email || "customer@HelloBazaars.com",

        customer_mobile: address.phone || "9999999999",
        redirect_url: redirectUrl,
      };

      console.log("Creating UPIGateway order with payload:", payload);

      const upiRes = await fetch("https://merchant.upigateway.com/api/create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (upiRes.ok) {
        const upiData = await upiRes.json();
        console.log("UPIGateway create_order response:", upiData);
        if (upiData.status && upiData.data && upiData.data.payment_url) {
          paymentUrl = upiData.data.payment_url;
        } else {
          console.error("UPIGateway returned error status:", upiData);
        }
      } else {
        console.error("UPIGateway HTTP error:", upiRes.status, await upiRes.text());
      }
    } catch (err) {
      console.error("Error communicating with UPIGateway:", err);
    }

    if (!paymentUrl) {
      console.log("Rolling back order creation due to UPIGateway failure...");
      // Delete the created order and its related records
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
      await prisma.orderTracking.deleteMany({ where: { orderId: order.id } });

      // Restore product stock
      for (const ci of cartItems) {
        const product = await prisma.product.findUnique({ where: { id: ci.productId } });
        if (product) {
          await prisma.product.update({
            where: { id: ci.productId },
            data: { stock: (product.stock ?? 0) + ci.quantity }
          });
        }
      }

      // Restore cart items
      for (const ci of cartItems) {
        await prisma.cartItem.create({
          data: {
            userId,
            productId: ci.productId,
            quantity: ci.quantity,
          }
        });
      }

      return NextResponse.json({ error: "Failed to initialize UPI payment gateway. Please try again." }, { status: 500 });
    }
  }

  if (paymentUrl) {
    return NextResponse.json({ ...order, paymentUrl });
  }

  return NextResponse.json(order);
}
