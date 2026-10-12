"use client";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/lib/format";
import { optimizeImageUrl } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { addToGuestCart } from "@/lib/cart-local";
import { triggerFlyToCart } from "@/components/site/fly-to-cart";

export function ProductCard({ product, onAdd, onWish, inWishlist = false }: { product: any; onAdd?: (id: string) => void; onWish?: (id: string) => void; inWishlist?: boolean }) {
  const { status } = useSession() || {};
  const [imgErr, setImgErr] = useState(false);
  const [wishing, setWishing] = useState(inWishlist);
  const [adding, setAdding] = useState(false);

  const productVariants = Array.isArray(product.variants) ? product.variants : [];
  const defaultVar = productVariants.find((v: any) => v.isDefault) || productVariants[0];
  const displayPrice = defaultVar ? Number(defaultVar.price) : product.price;
  const displayOriginalPrice = defaultVar ? (defaultVar.originalPrice != null ? Number(defaultVar.originalPrice) : product.originalPrice) : product.originalPrice;
  const hasVariantsBadge = product.hasVariants || productVariants.length > 1;

  const addToCart = async (e?: React.MouseEvent) => {
    if (adding) return;
    if (e) {
      triggerFlyToCart(e, defaultVar?.image || product.image);
    }
    const variantId = defaultVar?.id || null;
    const variantName = defaultVar ? `${defaultVar.ram || ""} ${defaultVar.storage || ""}`.trim() : null;
    if (status !== "authenticated") {
      addToGuestCart(product.id, 1, { variantId, variantName, sku: defaultVar?.sku, price: displayPrice });
      toast.success("Added to cart");
      onAdd?.(product.id);
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1, variantId, variantName, sku: defaultVar?.sku, price: displayPrice })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j?.error ?? "Failed to add to cart");
      } else {
        toast.success("Added to cart");
        onAdd?.(product.id);
      }
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const toggleWish = async () => {
    try {
      const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      const data = await res.json();
      if (data?.added) { setWishing(true); toast.success("Added to wishlist"); }
      else if (data?.removed) { setWishing(false); toast.success("Removed from wishlist"); }
      onWish?.(product.id);
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <div className="group bg-card rounded-xl overflow-hidden product-card-shadow hover:-translate-y-1 transition-all duration-300">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-white dark:bg-slate-800/40 border-b dark:border-slate-800 overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {!imgErr && (defaultVar?.image || product.image) ? (
            <img
              src={optimizeImageUrl(defaultVar?.image || product.image, 400)}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
          )}
          {product.discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">-{product.discount}%</div>
          )}
          {hasVariantsBadge && (
            <div className="absolute bottom-2 left-2 bg-cyan-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">Variants</div>
          )}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(); }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition"
            aria-label="Add to wishlist"
          >
            <Heart className={`h-4 w-4 ${wishing ? "fill-red-500 text-red-500" : "text-slate-600 dark:text-slate-300"}`} />
          </button>
        </div>
      </Link>
      <div className="p-2 sm:p-3 space-y-1.5">
        {product.brand && <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{product.brand}</p>}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] hover:text-primary transition">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-medium">{(product.rating ?? 0).toFixed(1)}</span>
          <span className="text-muted-foreground">({product.reviewCount ?? 0})</span>
        </div>
        {product.bulkPrice ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
            <span>Bulk: {formatRupees(product.bulkPrice)}</span>
            <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">({product.minBulkQty || 10}+ pcs)</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
            <span className="font-display text-sm sm:text-base font-bold truncate">{formatRupees(displayPrice)}</span>
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-[9px] sm:text-[10px] text-muted-foreground line-through whitespace-nowrap truncate">{formatRupees(displayOriginalPrice)}</span>
            )}
          </div>
          <Button 
            onClick={addToCart} 
            disabled={adding || product.stock === 0} 
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-full sm:rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sm"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-xs font-semibold">
              {product.stock === 0 ? "Out" : adding ? "..." : "Add"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
