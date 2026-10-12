import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    } else if (contentType.includes("application/json")) {
      body = await req.json();
    }

    console.log("UPIGateway Webhook callback body received:", body);

    const {
      client_txn_id,
      amount,
      status,
      txnAt,
      upi_txn_id,
      customer_vpa,
    } = body;

    if (!client_txn_id) {
      return NextResponse.json({ error: "Missing client_txn_id" }, { status: 400 });
    }

    // Find the order
    const orderId = client_txn_id.includes("_") ? client_txn_id.split("_")[0] : client_txn_id;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error(`Order not found for client_txn_id: ${client_txn_id} (orderId: ${orderId})`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }


    // Verify with UPIGateway to prevent spoofing
    const upiKey = process.env.UPIGATEWAY_API_KEY || "deb6f1b4-55ce-40b0-b69a-bf7b66a56f47";

    // Format the date to DD-MM-YYYY as required by check_order_status
    const formattedDate = formatToDDMMYYYY(txnAt || new Date().toISOString().split("T")[0]);

    const checkPayload = {
      key: upiKey,
      client_txn_id: client_txn_id,
      txn_date: formattedDate,
    };

    console.log("Verifying UPIGateway order status with payload:", checkPayload);

    const verifyRes = await fetch("https://merchant.upigateway.com/api/check_order_status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkPayload),
    });

    if (!verifyRes.ok) {
      console.error(`Failed to verify payment status with UPIGateway API: ${verifyRes.status}`);
      return NextResponse.json({ error: "Failed to verify transaction with gateway" }, { status: 500 });
    }

    const verifyData = await verifyRes.json();
    console.log("UPIGateway check_order_status verification response:", verifyData);

    if (!verifyData.status) {
      console.error("Transaction not found or error status returned by gateway verification:", verifyData.msg);
      return NextResponse.json({ error: "Transaction verification failed" }, { status: 400 });
    }

    const gatewayTxn = verifyData.data;
    const gatewayStatus = gatewayTxn?.status; // "success" or "failure"

    if (gatewayStatus === "success") {
      // Check if order is already paid to avoid double processing
      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ status: "already_processed" });
      }

      // Update order payment status and activate it
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "ORDER_RECEIVED",
        },
      });

      // Create a tracking record
      await prisma.orderTracking.create({
        data: {
          orderId: order.id,
          status: "ORDER_RECEIVED",
          note: `Payment of ₹${gatewayTxn.amount} verified successfully via UPI. Transaction ID: ${gatewayTxn.upi_txn_id || upi_txn_id || "N/A"}.`,
        },
      });

      // Trigger Discord Notification
      sendDiscordNotification({
        title: "✅ UPI Payment Verified!",
        description: `Order **${order.orderNumber}** has been paid successfully via UPI.`,
        color: 3066993, // Green
        fields: [
          { name: "Order ID", value: order.id, inline: true },
          { name: "Amount Paid", value: `₹${gatewayTxn.amount}`, inline: true },
          { name: "UPI VPA", value: gatewayTxn.customer_vpa || customer_vpa || "N/A", inline: true },
          { name: "UTR / Transaction ID", value: gatewayTxn.upi_txn_id || upi_txn_id || "N/A", inline: true },
          { name: "Remark", value: gatewayTxn.remark || "N/A" },
        ],
      });

      return NextResponse.json({ status: "success" });
    } else {
      console.warn(`Payment verification failed for order ${order.id}. Status: ${gatewayStatus}`);
      return NextResponse.json({ error: `Transaction status is: ${gatewayStatus}` }, { status: 400 });
    }

  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

function formatToDDMMYYYY(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {}
  return dateStr;
}
