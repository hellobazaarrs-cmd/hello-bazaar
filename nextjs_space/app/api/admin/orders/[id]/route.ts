import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-check";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/format";
import { sendPersonalNotification } from "@/lib/notifications";

async function deleteFromCloudinary(url: string) {
  try {
    if (!url || !url.includes("cloudinary.com")) return;

    const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "ddtdwao8r";
    const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "158197268248366";
    const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "7ml-7Xl0KxIMIxuMKeMQxAlJNAE";

    // Format: https://res.cloudinary.com/[cloud_name]/[resource_type]/upload/v[version]/[public_id]
    const rawMatch = url.match(/\/raw\/upload\/(?:v\d+\/)?([^\s?#]+)/);
    const imageMatch = url.match(/\/image\/upload\/(?:v\d+\/)?([^\s?#]+)/);
    const autoMatch = url.match(/\/auto\/upload\/(?:v\d+\/)?([^\s?#]+)/);

    let publicId = "";
    let resourceType = "raw";

    if (rawMatch) {
      publicId = rawMatch[1];
      resourceType = "raw";
    } else if (imageMatch) {
      publicId = imageMatch[1];
      resourceType = "image";
    } else if (autoMatch) {
      publicId = autoMatch[1];
      resourceType = "auto";
    } else {
      const genericMatch = url.match(/\/upload\/(?:v\d+\/)?([^\s?#]+)/);
      if (genericMatch) {
        publicId = genericMatch[1];
        resourceType = "image";
      }
    }

    if (!publicId) return;

    const crypto = require("crypto");
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", CLOUDINARY_API_KEY);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);

    const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`;
    const response = await fetch(destroyUrl, {
      method: "POST",
      body: form,
    });

    if (response.ok) {
      console.log(`🗑️ Successfully deleted Cloudinary resource: ${publicId} (${resourceType})`);
    } else {
      console.warn("⚠️ Failed to delete Cloudinary resource:", await response.text());
    }
  } catch (err) {
    console.error("Cloudinary deletion failed:", err);
  }
}

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { fullName: true, email: true, phone: true } },
      tracking: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Transform for client
  const transformed = {
    ...order,
    user: order.user
      ? { name: order.user.fullName, email: order.user.email, phone: order.user.phone }
      : null,
    shippingAddress: order.address
      ? {
          fullName: order.address.fullName,
          phone: order.address.phone,
          line1: order.address.addressLine1,
          line2: order.address.addressLine2,
          city: order.address.city,
          state: order.address.state,
          pincode: order.address.pincode,
        }
      : null,
  };
  return NextResponse.json({ order: transformed });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { status, note, invoiceUrl, subtotal, discount, tax, shipping, total } = body;


  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Permanently lock CANCELLED orders from being reversed or updated
  if (order.status === "CANCELLED") {
    return NextResponse.json(
      { error: "This order is permanently CANCELLED and its status cannot be modified or reversed." },
      { status: 400 }
    );
  }

  const updateData: any = {};

  if (invoiceUrl !== undefined) {
    updateData.invoiceUrl = invoiceUrl;
  }

  if (subtotal !== undefined) updateData.subtotal = Number(subtotal);
  if (discount !== undefined) updateData.discount = Number(discount);
  if (tax !== undefined) updateData.tax = Number(tax);
  if (shipping !== undefined) updateData.shipping = Number(shipping);
  if (total !== undefined) updateData.total = Number(total);

  if (status !== undefined) {
    const validExtra = [
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURN_ACCEPTED",
      "RETURN_PROCESSING",
      "RETURN_SUCCESS",
      "REFUND_INITIATED",
      "REFUND_SUCCESS",
      "RETURN_DECLINED",
    ];
    if (!status || (!(ORDER_STATUSES as readonly string[]).includes(status) && !validExtra.includes(status))) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Forward-only validation for main pipeline statuses
    const currentIdx = (ORDER_STATUSES as readonly string[]).indexOf(order.status);
    const targetIdx = (ORDER_STATUSES as readonly string[]).indexOf(status);

    if (currentIdx !== -1 && targetIdx !== -1 && targetIdx < currentIdx) {
      return NextResponse.json({ error: "Order status cannot move backwards to a previous stage." }, { status: 400 });
    }

    updateData.status = status;
    if (status === "DELIVERED") {
      updateData.paymentStatus = "PAID";
    } else if (status === "REFUND_SUCCESS" || status === "PAYMENT_REFUND") {
      updateData.paymentStatus = "PAYMENT_REFUND";
    } else if (status === "REFUND_INITIATED") {
      updateData.paymentStatus = "REFUND_INITIATED";
    } else if (body.paymentStatus) {
      updateData.paymentStatus = body.paymentStatus;
    }

    const otpEligible = [
      "PACKAGING_STARTED",
      "PACKAGING_COMPLETED",
      "READY_FOR_DISPATCH",
      "DISPATCHED",
      "OUT_FOR_DELIVERY",
      "RETURN_REQUESTED",
      "RETURN_ACCEPTED",
      "RETURN_PROCESSING",
    ];

    if (otpEligible.includes(status) && !order.deliveryOtp) {
      const activeOrders = await prisma.order.findMany({ select: { deliveryOtp: true } });
      const usedOtps = new Set(activeOrders.map((o: any) => o.deliveryOtp).filter(Boolean));
      let newOtp = "";
      for (let i = 0; i < 1000; i++) {
        newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        if (!usedOtps.has(newOtp)) break;
      }
      updateData.deliveryOtp = newOtp;

      try {
        const orderNum = order.orderNumber || order.id.slice(-6).toUpperCase();
        sendPersonalNotification(
          order.userId,
          `📦 Delivery OTP - #${orderNum}`,
          `Your 4-digit delivery verification OTP is ${newOtp}. Please share this with your delivery executive upon package arrival.`,
          undefined,
          `/orders/${order.id}`
        );
      } catch (e) {
        console.error("Push notification error:", e);
      }
    }

    if (status === "CANCELLED") {
      if (order.invoiceUrl) {
        await deleteFromCloudinary(order.invoiceUrl);
        updateData.invoiceUrl = null;
      }

      // Restore product stock in database so it becomes available for other customers immediately
      const items = (order as any).items || [];
      for (const item of items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const currentStock = Number(product.stock) || 0;
            const newStock = currentStock + Number(item.quantity || 1);
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: newStock, isActive: true },
            });
            console.log(`📦 Restored stock for ${product.name}: ${currentStock} -> ${newStock}`);
          }
        }
      }
    }

    await prisma.orderTracking.create({
      data: { orderId: params.id, status, note: note ?? ORDER_STATUS_LABELS[status] ?? null },
    });
  }


  // Create tracking entry if billing values change
  if (
    status === undefined &&
    (subtotal !== undefined || discount !== undefined || tax !== undefined || shipping !== undefined || total !== undefined)
  ) {
    await prisma.orderTracking.create({
      data: {
        orderId: params.id,
        status: order.status || "ORDER_RECEIVED",
        note: `Order billing amounts updated by Admin.`,
      },
    });
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });
  }


  // Trigger personal push notification if the status has changed
  if (status !== undefined) {
    try {
      const displayStatus = ORDER_STATUS_LABELS[status] || status;
      sendPersonalNotification(
        order.userId,
        `📦 Order Update - #${order.id.slice(-6).toUpperCase()}`,
        `Your order is now: ${displayStatus}.`,
        undefined,
        `/orders/${order.id}`
      );
    } catch (err) {
      console.error("Error triggering order push notification:", err);
    }
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const { status, paymentStatus, paymentMethod, total, subtotal, discount, tax, shipping, customerName, customerPhone, addressLine1, addressLine2, city, state, pincode, note } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { address: true, user: true, items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Permanently lock CANCELLED orders from being modified
    if (existingOrder.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order is permanently CANCELLED and its status cannot be modified or reversed." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (total !== undefined) updateData.total = Number(total);
    if (subtotal !== undefined) updateData.subtotal = Number(subtotal);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (tax !== undefined) updateData.tax = Number(tax);
    if (shipping !== undefined) updateData.shipping = Number(shipping);

    if (status === "CANCELLED") {
      if (existingOrder.invoiceUrl) {
        await deleteFromCloudinary(existingOrder.invoiceUrl);
        updateData.invoiceUrl = null;
      }

      // Restore product stock in database
      const items = (existingOrder as any).items || [];
      for (const item of items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const currentStock = Number(product.stock) || 0;
            const newStock = currentStock + Number(item.quantity || 1);
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: newStock, isActive: true },
            });
            console.log(`📦 Restored stock for ${product.name}: ${currentStock} -> ${newStock}`);
          }
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update shipping address if provided
    if (existingOrder.addressId && (customerName || customerPhone || addressLine1 || city || state || pincode)) {
      await prisma.address.update({
        where: { id: existingOrder.addressId },
        data: {
          fullName: customerName ?? existingOrder.address?.fullName,
          phone: customerPhone ?? existingOrder.address?.phone,
          addressLine1: addressLine1 ?? existingOrder.address?.addressLine1,
          addressLine2: addressLine2 ?? existingOrder.address?.addressLine2,
          city: city ?? existingOrder.address?.city,
          state: state ?? existingOrder.address?.state,
          pincode: pincode ?? existingOrder.address?.pincode,
        },
      });
    }

    // Record tracking entry
    await prisma.orderTracking.create({
      data: {
        orderId: params.id,
        status: status || existingOrder.status,
        note: note || `Order updated by Admin.`,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error("Order PUT error:", err);
    return NextResponse.json({ error: "Failed to update order: " + err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Delete Cloudinary invoice if present
    if (order.invoiceUrl) {
      await deleteFromCloudinary(order.invoiceUrl);
    }

    // Delete order items & trackings
    await prisma.orderItem.deleteMany({ where: { orderId: params.id } });
    await prisma.orderTracking.deleteMany({ where: { orderId: params.id } });

    // Delete order doc
    await prisma.order.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: `Order #${order.orderNumber || order.id.slice(-6).toUpperCase()} deleted successfully.` });
  } catch (err: any) {
    console.error("Order DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete order: " + err.message }, { status: 500 });
  }
}
