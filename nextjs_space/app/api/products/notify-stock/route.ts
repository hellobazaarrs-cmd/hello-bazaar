import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { productId, variantId, email } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const userId = session?.user ? (session.user as any).id : null;
    const userEmail = session?.user?.email || email || "customer@example.com";

    // Save stock alert record
    const alert = await prisma.stockAlert.create({
      data: {
        productId,
        variantId: variantId || null,
        userId: userId || null,
        userEmail: userEmail,
        createdAt: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: "You will be notified as soon as stock is back!",
      alert
    });
  } catch (err: any) {
    console.error("Error creating stock alert:", err);
    return NextResponse.json({ error: "Failed to register stock alert" }, { status: 500 });
  }
}
