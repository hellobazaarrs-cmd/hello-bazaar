import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = (session as any)?.user;

    if (!session || currentUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access. Super Admin only." }, { status: 401 });
    }

    const productId = params.id;
    const body = await req.json();
    const { status, name, price, originalPrice, description, images, brand, stockCount, variants } = body ?? {};

    const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (originalPrice !== undefined) updateData.originalPrice = Number(originalPrice);
    if (description !== undefined) updateData.description = description;
    if (images && Array.isArray(images) && images.length > 0) updateData.images = images;
    if (brand !== undefined) updateData.brand = brand;
    if (stockCount !== undefined) updateData.stockCount = Number(stockCount);
    if (variants !== undefined) updateData.variants = variants;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({
      message: `Product ${status === "LIVE" ? "Approved & Published Live!" : "Updated Successfully!"}`,
      product: updated,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update product status" }, { status: 500 });
  }
}
