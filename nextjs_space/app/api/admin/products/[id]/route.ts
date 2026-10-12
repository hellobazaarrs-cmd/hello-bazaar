import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-check";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const data = await req.json();
  const allowed: any = {};
  const fields = ["name", "description", "price", "originalPrice", "discount", "stock", "brand", "color", "image", "images", "categoryId", "featured", "trending", "isActive", "specs", "returnPolicy", "hasVariants", "bulkPrice", "minBulkQty"];
  for (const f of fields) {
    if (data[f] !== undefined) {
      if (["price", "originalPrice", "discount", "stock", "bulkPrice", "minBulkQty"].includes(f)) {
        allowed[f] = data[f] !== null && data[f] !== "" ? Number(data[f]) : null;
      } else {
        allowed[f] = data[f];
      }
    }
  }
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Recalculate discount based on update
  if (allowed.price !== undefined || allowed.originalPrice !== undefined) {
    const finalPrice = allowed.price !== undefined ? allowed.price : Number(product.price || 0);
    const finalOriginalPrice = allowed.originalPrice !== undefined ? allowed.originalPrice : product.originalPrice;
    if (finalOriginalPrice && finalOriginalPrice > finalPrice) {
      allowed.discount = Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100);
    } else {
      allowed.discount = 0;
    }
  }

  const updatedProduct = await prisma.product.update({ where: { id: params.id }, data: allowed });

  // Handle variants update if passed
  if (data.variants !== undefined) {
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });
    if (allowed.hasVariants && Array.isArray(data.variants) && data.variants.length > 0) {
      const slug = updatedProduct.slug || "prod";
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i];
        const vPrice = Number(v.price ?? updatedProduct.price);
        const vOrigPrice = v.originalPrice != null ? Number(v.originalPrice) : null;
        let vDisc = 0;
        if (vOrigPrice && vOrigPrice > vPrice) {
          vDisc = Math.round(((vOrigPrice - vPrice) / vOrigPrice) * 100);
        }
        await prisma.productVariant.create({
          data: {
            productId: params.id,
            ram: v.ram?.trim() || "",
            storage: v.storage?.trim() || "",
            color: v.color?.trim() || "",
            price: vPrice,
            originalPrice: vOrigPrice,
            discount: vDisc,
            stock: Number(v.stock ?? 0),
            sku: v.sku?.trim() || `${slug.substring(0, 8)}-v${i+1}`,
            barcode: v.barcode?.trim() || null,
            image: v.image || updatedProduct.image,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (updatedProduct.images || [updatedProduct.image]),
            weight: v.weight?.trim() || null,
            dimensions: v.dimensions?.trim() || null,
            warranty: v.warranty?.trim() || null,
            status: v.status || "ACTIVE",
            lowStockLimit: Number(v.lowStockLimit ?? 5),
            isDefault: i === 0 || !!v.isDefault,
          }
        });
      }
    }
  }

  const fullResult = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, variants: true }
  });

  // Check if stock came back for product or variants
  const newStock = Number(updatedProduct.stock || 0);
  const variantsHasStock = fullResult?.variants && Array.isArray(fullResult.variants) && fullResult.variants.some((v: any) => Number(v.stock) > 0);

  if (newStock > 0 || variantsHasStock) {
    (async () => {
      try {
        const alerts = await prisma.stockAlert.findMany({ where: { productId: params.id } });
        if (alerts && alerts.length > 0) {
          const { sendPersonalNotification, sendMulticastNotification } = await import("@/lib/notifications");
          const title = "Stock Alert: Back in Stock! 🎉";
          const body = `Your saved item "${updatedProduct.name}" is back in stock! Please check it out now before it runs out!`;
          const image = updatedProduct.image;
          const link = `/products/${updatedProduct.slug}`;

          for (const alert of alerts) {
            if (alert.userId) {
              await sendPersonalNotification(alert.userId, title, body, image, link);
            }
          }
          await sendMulticastNotification(title, body, image, link);
          await prisma.stockAlert.deleteMany({ where: { productId: params.id } });
        }
      } catch (err) {
        console.error("Error sending stock alerts:", err);
      }
    })();
  }

  return NextResponse.json(fullResult);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
