import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.redirect(new URL("/orders", req.url));
  }
  return NextResponse.redirect(new URL(`/orders/${orderId}?just=1`, req.url));
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  let orderId = searchParams.get("orderId");

  if (!orderId) {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        orderId = formData.get("client_txn_id") as string;
      } else if (contentType.includes("application/json")) {
        const body = await req.json();
        orderId = body.client_txn_id;
      }
    } catch (e) {
      console.error("Failed to parse body in redirect:", e);
    }
  }

  if (orderId && orderId.includes("_")) {
    orderId = orderId.split("_")[0];
  }

  const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://HelloBazaars.com";

  if (!orderId) {
    return NextResponse.redirect(new URL("/orders", siteUrl));
  }

  return NextResponse.redirect(new URL(`/orders/${orderId}?just=1`, siteUrl));
}
