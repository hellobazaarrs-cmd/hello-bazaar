import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const banners = await prisma.banner.findMany();
    // Sort by orderIndex ascending
    banners.sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return NextResponse.json({ banners });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      mediaType, // "IMAGE" or "VIDEO"
      mediaUrl,
      targetUrl,
      buttonText,
      badgeText,
      placement, // "HERO" or "DEAL"
      orderIndex,
      durationSeconds,
      active,
    } = body ?? {};

    if (!mediaUrl) {
      return NextResponse.json({ error: "Media URL or file is required" }, { status: 400 });
    }

    const newBanner = await prisma.banner.create({
      data: {
        id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title || "",
        description: description || "",
        mediaType: mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
        mediaUrl,
        targetUrl: targetUrl || "/products",
        buttonText: buttonText || "Shop Now",
        badgeText: badgeText || "HOT DEAL",
        placement: placement === "DEAL" ? "DEAL" : "HERO",
        orderIndex: Number(orderIndex) || 0,
        durationSeconds: Number(durationSeconds) || 3,
        active: active !== undefined ? Boolean(active) : true,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ message: "Banner created successfully!", banner: newBanner });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create banner" }, { status: 500 });
  }
}
