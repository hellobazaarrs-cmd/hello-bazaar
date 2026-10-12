import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { productId, quantity = 1, variantId, variantName, sku, price, color, ram, storage } = await req.json();
  if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let variant: any = null;
  if (variantId) {
    try {
      variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    } catch (_) {}
  }

  const effectiveStock = variant ? Number(variant.stock) : Number(product.stock ?? 0);

  const items = await prisma.cartItem.findMany({ where: { userId, productId } });
  const existing = items.find((i: any) => (i.variantId || null) === (variantId || null));
  const totalQuantity = (existing?.quantity ?? 0) + quantity;

  if (totalQuantity > effectiveStock) {
    return NextResponse.json({ error: `Cannot add more items. Only ${effectiveStock} items available in stock.` }, { status: 400 });
  }

  let unitPrice = price != null ? Number(price) : (variant ? Number(variant.price) : Number(product.price));
  if ((product as any).bulkPrice && (product as any).minBulkQty && totalQuantity >= (product as any).minBulkQty) {
    unitPrice = Number((product as any).bulkPrice);
  }

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: totalQuantity,
        variantId: variantId || existing.variantId || null,
        variantName: variantName || existing.variantName || null,
        sku: sku || existing.sku || null,
        price: unitPrice,
      },
      include: { product: true },
    });
  } else {
    const singlePrice = ((product as any).bulkPrice && (product as any).minBulkQty && quantity >= (product as any).minBulkQty)
      ? Number((product as any).bulkPrice)
      : unitPrice;

    item = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
        variantId: variantId || null,
        variantName: variantName || null,
        sku: sku || variant?.sku || null,
        price: singlePrice,
        color: color || variant?.color || null,
        ram: ram || variant?.ram || null,
        storage: storage || variant?.storage || null,
      },
      include: { product: true },
    });
  }
  return NextResponse.json(item);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { itemId, quantity } = await req.json();
  if (!itemId || quantity < 1) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, userId }, include: { product: true } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (quantity > (item.product?.stock ?? 0)) {
    return NextResponse.json({ error: `Only ${item.product?.stock ?? 0} items available in stock.` }, { status: 400 });
  }

  const updateData: any = { quantity };
  const prod = item.product as any;
  if (prod && prod.bulkPrice && prod.minBulkQty) {
    if (quantity >= prod.minBulkQty) {
      updateData.price = Number(prod.bulkPrice);
    } else {
      updateData.price = Number(prod.price);
    }
  }

  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: updateData });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const clearAll = searchParams.get("clearAll");
  if (clearAll === "true") {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true });
  }
  if (!itemId) return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, userId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.cartItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
