import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "DEALER" && currentUser?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const productId = params.id;
    const body = await req.json();
    const { name, price, originalPrice, categoryId, description, images, brand, inStock, stockCount } = body ?? {};

    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isOwner = existingProduct.dealerId === currentUser.id;
    const isSuperAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized to edit this product" }, { status: 403 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (categoryId) updateData.categoryId = categoryId;
    if (description !== undefined) updateData.description = description;
    if (Array.isArray(images) && images.length > 0) updateData.images = images;
    if (brand) updateData.brand = brand;
    if (inStock !== undefined) updateData.inStock = Boolean(inStock);
    if (stockCount !== undefined) updateData.stockCount = Number(stockCount);

    // If edited by Dealer, set status to PENDING_APPROVAL for Super Admin re-verification
    if (!isSuperAdmin) {
      updateData.status = "PENDING_APPROVAL";
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    if (!isSuperAdmin) {
      sendDiscordNotification({
        title: "✏️ Dealer Updated Product - Pending Super Admin Approval!",
        description: `Dealer **${currentUser.shopName || currentUser.fullName}** updated product **${updatedProduct.name}**. It requires re-verification by Super Admin.`,
        color: 15105570,
        fields: [
          { name: "Product Name", value: updatedProduct.name, inline: true },
          { name: "New Price", value: `₹${updatedProduct.price}`, inline: true },
          { name: "Status", value: "PENDING_APPROVAL", inline: true },
        ],
      });
    }

    return NextResponse.json({
      product: updatedProduct,
      message: isSuperAdmin
        ? "Product updated successfully!"
        : "Product changes saved! Submitted to Super Admin for approval.",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || (currentUser?.role !== "DEALER" && currentUser?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const productId = params.id;
    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const isOwner = existingProduct.dealerId === currentUser.id;
    const isSuperAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized to delete this product" }, { status: 403 });
    }

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete product" }, { status: 500 });
  }
}
