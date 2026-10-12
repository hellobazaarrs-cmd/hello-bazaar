import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Environment variables for Meta WhatsApp Cloud API
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "electro_bazaar_whatsapp_secret_2026";
const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

// Helper to send WhatsApp messages using Meta Graph API
async function sendWhatsAppMessage(to: string, payload: any) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log("⚠️ WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing in env vars.");
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        ...payload,
      }),
    });

    const data = await res.json();
    console.log("📲 WhatsApp API Response:", data);
    return res.ok;
  } catch (err) {
    console.error("❌ WhatsApp send error:", err);
    return false;
  }
}

// 1. GET Method: Webhook Verification for Meta Developers Portal
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("🔍 Meta Webhook Verification Request:", { mode, token, challenge });

    if (challenge) {
      console.log("✅ Returning Meta Webhook Challenge:", challenge);
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export async function OPTIONS() {
  return new Response("OK", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

// 2. POST Method: Complete E-Commerce WhatsApp Automation Bot
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ status: "ignored" });
    }

    const fromNumber = message.from; // Customer WhatsApp Phone Number (e.g. 919876543210)
    const msgType = message.type;
    let userText = "";
    let buttonId = "";

    if (msgType === "text") {
      userText = (message.text?.body || "").trim();
    } else if (msgType === "interactive") {
      buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || "";
      userText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || "";
    }

    const cleanText = userText.toLowerCase();
    const cleanButtonId = buttonId.toUpperCase();

    console.log(`📩 WhatsApp Msg from ${fromNumber} | Text: "${userText}" | ButtonID: "${buttonId}"`);

    // =========================================================================
    // STEP 1: INITIAL GREETING & MENU (When user sends 'Hi' or first message)
    // =========================================================================
    if (
      cleanText === "hi" ||
      cleanText === "hello" ||
      cleanText === "namaste" ||
      cleanText === "start" ||
      cleanText === "menu" ||
      cleanText === "hey" ||
      cleanButtonId === "RESET_MENU"
    ) {
      await sendWhatsAppMessage(fromNumber, {
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "text",
            text: "🛍️ Hello Bazaar Official",
          },
          body: {
            text: "Welcome to Hello Bazaar B2B Wholesale Portal!\n\nHow can we assist you today? Please choose an option from below:",
          },
          footer: {
            text: "Hello Bazaar Wholesale Support",
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "OPT_TRACK_EN",
                  title: "📦 Track My Order",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "OPT_OFFERS_EN",
                  title: "🔥 Today's Offers",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "OPT_DEALER_EN",
                  title: "🏪 Dealer Portal",
                },
              },
            ],
          },
        },
      });
      return NextResponse.json({ status: "greeting_sent" });
    }

    // =========================================================================
    // STEP 2: AUTOMATED ACTIONS (Order Tracking, Offers, Dealer Register, Support)
    // =========================================================================

    // 1. ORDER TRACKING ACTION
    if (
      cleanButtonId.includes("OPT_TRACK") ||
      cleanText.includes("track") ||
      cleanText.includes("order")
    ) {
      const last10 = fromNumber.slice(-10);
      const latestOrder = await prisma.order.findFirst({
        where: {
          customerPhone: {
            endsWith: last10,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (latestOrder) {
        const statusText =
          latestOrder.status === "DELIVERED"
            ? "✅ Delivered"
            : latestOrder.status === "SHIPPED"
            ? "🚚 On The Way (Shipped)"
            : "⏳ Processing";

        await sendWhatsAppMessage(fromNumber, {
          type: "text",
          text: `📦 *Your Recent Order Details:*

🆔 *Order ID:* #${latestOrder.id.slice(-6).toUpperCase()}
📊 *Status:* ${statusText}
💰 *Total Amount:* ₹${latestOrder.totalAmount?.toLocaleString("en-IN")}
💳 *Payment Mode:* ${latestOrder.paymentMethod}

🌐 View complete tracking details online:
https://HelloBazaar.in/orders/${latestOrder.id}`,
        });
      } else {
        await sendWhatsAppMessage(fromNumber, {
          type: "text",
          text: `❌ No active order found for phone number (${fromNumber}).

If you placed an order with a different phone number, please reply with your Order ID or contact support.`,
        });
      }
      return NextResponse.json({ status: "order_tracked" });
    }

    // 2. TODAY'S HOT DEALS ACTION
    if (
      cleanButtonId.includes("OPT_OFFERS") ||
      cleanText.includes("offer") ||
      cleanText.includes("deal")
    ) {
      await sendWhatsAppMessage(fromNumber, {
        type: "text",
        text: `🔥 *Hello Bazaar Wholesale Offers:*

1️⃣ *4K Smart TVs:* Instant bulk discount on multi-unit orders
2️⃣ *Laptops:* Intel Core i7 & M-Series available at dealer rates
3️⃣ *5G Smartphones:* Starting at bulk wholesale rates
4️⃣ *Extra Coupon Code:* Apply *DISCOUNT2000* at checkout for ₹2,000 off!

🛒 Shop Wholesale: https://HelloBazaar.in/offers`,
      });
      return NextResponse.json({ status: "offers_sent" });
    }

    // 3. DEALER PORTAL ACTION
    if (
      cleanButtonId.includes("OPT_DEALER") ||
      cleanText.includes("dealer") ||
      cleanText.includes("wholesale") ||
      cleanText.includes("shop")
    ) {
      await sendWhatsAppMessage(fromNumber, {
        type: "text",
        text: `🏪 *Hello Bazaar B2B Wholesale Portal:*

Direct B2B purchasing for Authorized Dealers from Super Admin!

✅ Instant Dealer Account Access
✅ Special Wholesale Bulk Discounts
✅ Fast Shipping & Order Tracking

🔗 Register Shop: https://HelloBazaar.in/register`,
      });
      return NextResponse.json({ status: "dealer_info_sent" });
    }

    // 4. CUSTOMER SUPPORT / STORE LOCATION ACTION
    if (
      cleanText.includes("support") ||
      cleanText.includes("help") ||
      cleanText.includes("address") ||
      cleanText.includes("location")
    ) {
      await sendWhatsAppMessage(fromNumber, {
        type: "text",
        text: `📍 *Hello Bazaar Main Official Store & Customer Care:*

🏪 *Store Name:* Hello Bazaar Official Store
📍 *Address:* Main Commercial Hub, Basantpur, Siwan, Bihar - 841406
📞 *Helpline Number:* +91 9876543210
📧 *Email:* support@HelloBazaar.in
⏰ *Opening Hours:* 09:00 AM - 09:00 PM (Monday to Saturday)

Our support team is happy to assist you!`,
      });
      return NextResponse.json({ status: "support_sent" });
    }

    // =========================================================================
    // FALLBACK RESPONSE
    // =========================================================================
    await sendWhatsAppMessage(fromNumber, {
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: "🤖 Hello Bazaar WhatsApp Assistant:\n\nTo view options or get help, please select below:",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "RESET_MENU",
                title: "🔄 Main Menu",
              },
            },
          ],
        },
      },
    });

    return NextResponse.json({ status: "fallback_sent" });
  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}
