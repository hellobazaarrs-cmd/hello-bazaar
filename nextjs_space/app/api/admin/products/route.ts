import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-check";
import { sendMulticastNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const products = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const data = await req.json();
  const { name, slug: providedSlug, description, price, originalPrice, stock, brand, color, image, images, categoryId, featured, specs, returnPolicy, hasVariants, variants, bulkPrice, minBulkQty } = data ?? {};
  if (!name || !description || price == null || !image || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  let slug = providedSlug ? slugify(providedSlug) : slugify(name);
  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) slug = slug + "-" + Date.now().toString(36);
  const numPrice = Number(price);
  const numOriginalPrice = originalPrice != null ? Number(originalPrice) : null;
  let computedDiscount = 0;
  if (numOriginalPrice && numOriginalPrice > numPrice) {
    computedDiscount = Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100);
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price: numPrice,
      originalPrice: numOriginalPrice,
      discount: computedDiscount,
      stock: Number(stock ?? 0),
      brand: brand ?? null,
      color: color ?? null,
      image,
      images: Array.isArray(images) ? images : [image],
      categoryId,
      featured: !!featured,
      isActive: true,
      specs: specs ?? {},
      returnPolicy: returnPolicy?.trim() || "7 Days Replacement / Return Policy",
      hasVariants: !!hasVariants,
      bulkPrice: bulkPrice != null && bulkPrice !== "" ? Number(bulkPrice) : null,
      minBulkQty: minBulkQty != null && minBulkQty !== "" ? Number(minBulkQty) : null,
    },
  });

  // Save variants if provided
  if (hasVariants && Array.isArray(variants) && variants.length > 0) {
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const vPrice = Number(v.price ?? numPrice);
      const vOrigPrice = v.originalPrice != null ? Number(v.originalPrice) : null;
      let vDisc = 0;
      if (vOrigPrice && vOrigPrice > vPrice) {
        vDisc = Math.round(((vOrigPrice - vPrice) / vOrigPrice) * 100);
      }
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          ram: v.ram?.trim() || "",
          storage: v.storage?.trim() || "",
          color: v.color?.trim() || "",
          price: vPrice,
          originalPrice: vOrigPrice,
          discount: vDisc,
          stock: Number(v.stock ?? 0),
          sku: v.sku?.trim() || `${slug.substring(0, 8)}-v${i+1}`,
          barcode: v.barcode?.trim() || null,
          image: v.image || image,
          images: Array.isArray(v.images) && v.images.length > 0 ? v.images : (Array.isArray(images) ? images : [image]),
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

  // Trigger broadcast notification in the background
  try {
    sendMulticastNotification(
      "🔥 New Product Added!",
      `${product.name} is now available for ₹${product.price}. Tap to view details!`,
      product.image || undefined,
      `/products/${product.slug}`
    );
  } catch (err) {
    console.error("Error launching product notification trigger:", err);
  }

  const result = await prisma.product.findUnique({
    where: { id: product.id },
    include: { category: true, variants: true }
  });

  return NextResponse.json(result);
}
