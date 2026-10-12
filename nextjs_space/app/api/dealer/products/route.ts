import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "DEALER" && currentUser?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const allProducts = await prisma.product.findMany();
    const dealerProducts = allProducts.filter((p: any) => p.dealerId === currentUser.id);

    return NextResponse.json({ products: dealerProducts });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "DEALER" && currentUser?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, price, originalPrice, categoryId, description, images, brand, inStock, stockCount, variants } = body ?? {};

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: "Product Name, Price, and Category are required" }, { status: 400 });
    }

    const slug = String(name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") + "-" + Date.now();

    const isSuperAdmin = currentUser.role === "ADMIN";
    const status = isSuperAdmin ? "LIVE" : "PENDING_APPROVAL";

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : Number(price),
        categoryId,
        description: description || "",
        images: Array.isArray(images) && images.length > 0 ? images : ["/logo.jpg"],
        brand: brand || "Hello Bazaar Authorized",
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        stockCount: stockCount ? Number(stockCount) : 10,
        variants: Array.isArray(variants) ? variants : [],
        dealerId: currentUser.id,
        shopName: currentUser.shopName || "Hello Bazaar Authorized Shop",
        status,
        isActive: true,
      },
    });

    if (!isSuperAdmin) {
      sendDiscordNotification({
        title: "📦 New Dealer Product Pending Approval!",
        description: `Dealer ${currentUser.shopName || currentUser.fullName} uploaded a new product: **${name}**.`,
        color: 15105570,
        fields: [
          { name: "Product Name", value: name, inline: true },
          { name: "Price", value: `₹${price}`, inline: true },
          { name: "Shop Name", value: currentUser.shopName || "Dealer Shop", inline: true },
          { name: "Status", value: "PENDING_APPROVAL", inline: true },
        ],
      });
    }

    return NextResponse.json({
      product,
      message: isSuperAdmin
        ? "Product published successfully!"
        : "Product uploaded successfully! It is now pending review by Super Admin.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create product" }, { status: 500 });
  }
}
