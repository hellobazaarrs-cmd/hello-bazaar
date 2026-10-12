"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw, Minus, Plus, ChevronRight, ChevronLeft, Share2, ZoomIn, X, Bell, Store, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/product-card";
import { formatRupees } from "@/lib/format";
import { useSession } from "next-auth/react";
import { addToGuestCart } from "@/lib/cart-local";
import { triggerFlyToCart } from "@/components/site/fly-to-cart";

export function ProductDetail({ product, related }: { product: any; related: any[] }) {
  const { status } = useSession() || {};
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishing, setWishing] = useState(false);
  const [inWish, setInWish] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleNotifyMe = async () => {
    try {
      setNotifying(true);
      await fetch("/api/products/notify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id || null,
        }),
      });
      setNotified(true);
      toast.success("Notification Set! We will alert you as soon as stock is back! 🔔");
    } catch (err) {
      setNotified(true);
      toast.success("Notification registered! You will be alerted when stock arrives. 🔔");
    } finally {
      setNotifying(false);
    }
  };

  useEffect(() => {
    fetch("/api/wishlist").then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setInWish(d.some((w: any) => w.productId === product.id));
    }).catch(() => {});
  }, [product.id]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localRating, setLocalRating] = useState(product.rating ?? 0);
  const [localReviewCount, setLocalReviewCount] = useState(product.reviewCount ?? 0);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setCanWriteReview(data.canReview || false);
        setHasReviewed(data.hasReviewed || false);
      }
    } catch (e) {
      console.error("Error loading reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.slug, status]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: userRating, comment: userComment })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }
      toast.success("Review submitted successfully!");
      setUserComment("");
      setUserRating(0);
      
      await fetchReviews();
      
      const newActualCount = reviews.length + 1;
      const newActualSum = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) + userRating;
      const finalRating = newActualCount > 0 ? newActualSum / newActualCount : 0;
      
      setLocalRating(Number(finalRating.toFixed(1)));
      setLocalReviewCount(newActualCount);
      
    } catch (e) {
      toast.error("Failed to connect to server");
    } finally {
      setSubmittingReview(false);
    }
  };

  const add = async (e?: React.MouseEvent) => {
    if (e) {
      const activeImg = galleryImages && galleryImages[activeIdx] ? galleryImages[activeIdx] : product.image;
      triggerFlyToCart(e, activeImg);
    }
    const variantId = selectedVariant?.id || null;
    const variantName = selectedVariant ? `${selectedRam} ${selectedStorage}${selectedColor ? ` (${selectedColor})` : ''}`.trim() : null;
    if (status !== "authenticated") {
      addToGuestCart(product.id, qty, { variantId, variantName, sku: activeSku, price: activePrice, color: selectedColor, ram: selectedRam, storage: selectedStorage });
      toast.success("Added to cart");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: qty, variantId, variantName, sku: activeSku, price: activePrice, color: selectedColor, ram: selectedRam, storage: selectedStorage })
      });
      if (res.ok) toast.success("Added to cart"); else toast.error("Failed to add to cart");
    } finally { setAdding(false); }
  };
  const buyNow = async (e?: React.MouseEvent) => {
    if (e) {
      const activeImg = galleryImages && galleryImages[activeIdx] ? galleryImages[activeIdx] : product.image;
      triggerFlyToCart(e, activeImg);
    }
    if (status !== "authenticated") {
      const variantId = selectedVariant?.id || null;
      const variantName = selectedVariant ? `${selectedRam} ${selectedStorage}${selectedColor ? ` (${selectedColor})` : ''}`.trim() : null;
      addToGuestCart(product.id, qty, { variantId, variantName, sku: activeSku, price: activePrice, color: selectedColor, ram: selectedRam, storage: selectedStorage });
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    await add();
    router.push("/checkout");
  };
  const toggleWish = async () => {
    if (wishing) return; setWishing(true);
    try {
      const res = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      const data = await res.json();
      if (data?.added) { setInWish(true); toast.success("Added to wishlist"); }
      else if (data?.removed) { setInWish(false); toast.success("Removed from wishlist"); }
    } finally { setWishing(false); }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/products/${product.slug}`;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Hello Bazaar!`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Product link copied to clipboard!");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error sharing:", err);
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Product link copied to clipboard!");
        } catch (_) {}
      }
    }
  };

  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const rawImages = Array.isArray(product.images) ? product.images : [product.image];
  const allImages = rawImages.filter(Boolean).map((img: any) => String(img).trim()).filter((img: string) => img.length > 0);
  if (allImages.length === 0) {
    allImages.push("https://placehold.co/600x600/e2e8f0/0f172a?text=No+Image+Available");
  }

  // Variant Selection State & Logic
  const [variantsList, setVariantsList] = useState<any[]>(Array.isArray(product.variants) ? product.variants : []);

  useEffect(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantsList(product.variants);
    } else {
      fetch(`/api/products/${product.slug}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.variants) && data.variants.length > 0) {
            setVariantsList(data.variants);
          }
        })
        .catch(() => {});
    }
  }, [product.id, product.slug, product.variants]);

  // Combine base product info as a variant option if not already in variantsList
  const allVariants = useMemo(() => {
    const list = [...variantsList];

    // Extract base RAM and Storage from specs if available
    const baseRam = product.specs?.RAM || product.specs?.ram || "";
    const baseStorage = product.specs?.Storage || product.specs?.storage || "";
    const baseColor = product.color || "";

    if (baseColor || baseRam || baseStorage || list.length > 0) {
      const hasBaseInList = list.some(
        (v: any) =>
          (!baseColor || (v.color || "").toLowerCase().trim() === baseColor.toLowerCase().trim()) &&
          (!baseRam || (v.ram || "").toLowerCase().trim() === baseRam.toLowerCase().trim()) &&
          (!baseStorage || (v.storage || "").toLowerCase().trim() === baseStorage.toLowerCase().trim())
      );

      if (!hasBaseInList) {
        const baseVar = {
          id: "base_product",
          ram: baseRam || (list[0]?.ram || ""),
          storage: baseStorage || (list[0]?.storage || ""),
          color: baseColor || "Standard",
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          stock: product.stock,
          sku: product.sku || `${product.slug}-base`,
          image: product.image,
          images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
          isDefault: !list.some((v: any) => v.isDefault),
        };
        list.unshift(baseVar);
      }
    }

    return list;
  }, [variantsList, product]);

  const hasVariants = product.hasVariants || allVariants.length > 0;

  const [selectedRam, setSelectedRam] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const updateUrlVariant = (sku: string) => {
    if (typeof window !== "undefined" && sku) {
      const url = new URL(window.location.href);
      url.searchParams.set("variant", sku);
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  };

  useEffect(() => {
    if (!hasVariants || allVariants.length === 0) return;
    let urlSku: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      urlSku = params.get("variant");
    }

    let match = urlSku ? allVariants.find((v: any) => v.sku === urlSku) : null;
    if (!match) match = allVariants.find((v: any) => v.isDefault);
    if (!match) match = allVariants[0];

    if (match) {
      setSelectedVariant(match);
      setSelectedRam(match.ram || "");
      setSelectedStorage(match.storage || "");
      setSelectedColor(match.color || "");
    }
  }, [product.id, hasVariants, allVariants]);

  const handleSelectRam = (ram: string) => {
    setSelectedRam(ram);
    let match = allVariants.find((v: any) => v.ram === ram && v.storage === selectedStorage && v.color === selectedColor);
    if (!match) match = allVariants.find((v: any) => v.ram === ram && v.storage === selectedStorage);
    if (!match) match = allVariants.find((v: any) => v.ram === ram && v.color === selectedColor);
    if (!match) match = allVariants.find((v: any) => v.ram === ram);
    if (match) {
      setSelectedVariant(match);
      if (match.storage) setSelectedStorage(match.storage);
      if (match.color) setSelectedColor(match.color);
      updateUrlVariant(match.sku);
    }
  };

  const handleSelectStorage = (storage: string) => {
    setSelectedStorage(storage);
    let match = allVariants.find((v: any) => v.ram === selectedRam && v.storage === storage && v.color === selectedColor);
    if (!match) match = allVariants.find((v: any) => v.storage === storage && v.color === selectedColor);
    if (!match) match = allVariants.find((v: any) => v.ram === selectedRam && v.storage === storage);
    if (!match) match = allVariants.find((v: any) => v.storage === storage);
    if (match) {
      setSelectedVariant(match);
      if (match.ram) setSelectedRam(match.ram);
      if (match.color) setSelectedColor(match.color);
      updateUrlVariant(match.sku);
    }
  };

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    let match = allVariants.find((v: any) => v.ram === selectedRam && v.storage === selectedStorage && v.color === color);
    if (!match) match = allVariants.find((v: any) => v.color === color && v.ram === selectedRam);
    if (!match) match = allVariants.find((v: any) => v.color === color && v.storage === selectedStorage);
    if (!match) match = allVariants.find((v: any) => v.color === color);
    if (match) {
      setSelectedVariant(match);
      if (match.ram) setSelectedRam(match.ram);
      if (match.storage) setSelectedStorage(match.storage);
      updateUrlVariant(match.sku);
    }
  };

  const availableRams = Array.from(new Set(allVariants.map((v: any) => v.ram).filter(Boolean)));
  const availableStorages = Array.from(new Set(allVariants.map((v: any) => v.storage).filter(Boolean)));
  const availableColors = Array.from(new Set(allVariants.map((v: any) => v.color).filter(Boolean)));

  const uniqueConfigs = useMemo(() => {
    if (!hasVariants || allVariants.length === 0) return [];
    const map = new Map<string, { key: string; label: string; storage: string; ram: string; variants: any[] }>();
    for (const v of allVariants) {
      const storageStr = v.storage?.trim() || "";
      const ramStr = v.ram?.trim() || "";
      const label = [storageStr, ramStr].filter(Boolean).join(" + ") || v.name || "Standard";
      const key = label.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, label, storage: storageStr, ram: ramStr, variants: [v] });
      } else {
        map.get(key)!.variants.push(v);
      }
    }
    return Array.from(map.values());
  }, [hasVariants, allVariants]);

  const baseActivePrice = selectedVariant ? Number(selectedVariant.price) : product.price;
  const isBulkEligible = Boolean(product.bulkPrice && qty >= (product.minBulkQty || 10));
  const activePrice = isBulkEligible ? Number(product.bulkPrice) : baseActivePrice;
  const activeOriginalPrice = selectedVariant ? (selectedVariant.originalPrice != null ? Number(selectedVariant.originalPrice) : product.originalPrice) : product.originalPrice;
  const activeDiscount = activeOriginalPrice && activeOriginalPrice > activePrice
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : (selectedVariant ? (selectedVariant.discount ?? product.discount) : product.discount);
  const activeStock = selectedVariant ? Number(selectedVariant.stock) : product.stock;
  const activeSku = selectedVariant?.sku || product.sku || "";

  const activeVariantImages = selectedVariant?.images && selectedVariant.images.length > 0 ? selectedVariant.images : (selectedVariant?.image ? [selectedVariant.image] : null);
  const galleryImages = (activeVariantImages && activeVariantImages.length > 0 && activeVariantImages[0]) ? activeVariantImages : allImages;

  useEffect(() => {
    setActiveIdx(0);
    setDirection(0);
  }, [selectedVariant?.id, product.image]);

  const selectImage = (img: string, index: number) => {
    const dir = index > activeIdx ? 1 : -1;
    setDirection(dir);
    setActiveIdx(index);
  };

  const paginate = (newDirection: number) => {
    const nextIdx = activeIdx + newDirection;
    if (nextIdx >= 0 && nextIdx < galleryImages.length) {
      setDirection(newDirection);
      setActiveIdx(nextIdx);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        paginate(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        paginate(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIdx, galleryImages.length]);

  const [showMobileZoomModal, setShowMobileZoomModal] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, isHovered: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y, isHovered: true });
  };

  const handleMouseLeave = () => {
    setZoomPos((prev) => ({ ...prev, isHovered: false }));
  };

  const baseSpecs = (product.specs ?? {}) as Record<string, string>;

  // Build active specs merging variant specs with selected RAM/Storage/Color
  const activeSpecs = useMemo(() => {
    const combined: Record<string, string> = { ...baseSpecs };

    // Overwrite with variant custom specs if present
    if (selectedVariant?.specs && typeof selectedVariant.specs === "object") {
      Object.assign(combined, selectedVariant.specs);
    }

    // Always update RAM, Storage, Colour keys dynamically to match selected variant!
    if (selectedRam) combined["RAM"] = selectedRam;
    if (selectedStorage) combined["Storage"] = selectedStorage;
    if (selectedColor) combined["Colour"] = selectedColor;

    return combined;
  }, [baseSpecs, selectedVariant, selectedRam, selectedStorage, selectedColor]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-32 sm:pb-6 w-full overflow-hidden lg:overflow-visible">
      <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1 flex-wrap">
        <Link href="/home" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/products?category=${product.category?.slug}`} className="hover:text-foreground">{product.category?.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-12 w-full min-w-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 w-full min-w-0">
          <div className="relative rounded-2xl overflow-hidden border dark:border-slate-800 bg-white dark:bg-slate-800/40 w-full max-w-full group">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setShowMobileZoomModal(true);
                }
              }}
              className={`relative h-[340px] sm:h-[420px] lg:h-[490px] w-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-900/10 ${
                zoomPos.isHovered ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing lg:cursor-zoom-in"
              }`}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={activeIdx}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? "100%" : "-100%",
                      opacity: 0
                    }),
                    center: {
                      x: 0,
                      opacity: 1
                    },
                    exit: (dir: number) => ({
                      x: dir < 0 ? "100%" : "-100%",
                      opacity: 0
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag={galleryImages.length > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e: any, { offset }: any) => {
                    const swipeThreshold = 50;
                    if (offset.x < -swipeThreshold && activeIdx < galleryImages.length - 1) {
                      paginate(1);
                    } else if (offset.x > swipeThreshold && activeIdx > 0) {
                      paginate(-1);
                    }
                  }}
                  className="absolute w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8 select-none"
                >
                  <img
                    src={galleryImages[activeIdx] || galleryImages[0]}
                    alt={`${product.name} - View ${activeIdx + 1}`}
                    className={`max-w-full max-h-full object-contain pointer-events-none transition-transform duration-100 ease-out ${
                      zoomPos.isHovered ? "lg:scale-[2.4]" : "scale-100"
                    }`}
                    style={
                      zoomPos.isHovered
                        ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                        : undefined
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => paginate(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-900 border dark:border-slate-800 flex items-center justify-center shadow-md text-slate-700 dark:text-slate-200 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex z-20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => paginate(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-900 border dark:border-slate-800 flex items-center justify-center shadow-md text-slate-700 dark:text-slate-200 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex z-20"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          
          {/* Image Thumbnail Navigation Bar */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin w-full max-w-full">
              {galleryImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => selectImage(img, i)}
                  type="button"
                  className={`w-20 h-20 rounded-xl bg-white dark:bg-slate-800/40 border-2 overflow-hidden flex-shrink-0 transition-all flex items-center justify-center p-1.5 ${
                    activeIdx === i ? "border-sky-500 scale-95" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 w-full min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            {product.brand && <span>{product.brand}</span>}
            {product.brand && product.category?.name && <span className="text-slate-300 dark:text-slate-700">|</span>}
            {product.category?.name && <span>{product.category.name}</span>}
            {(selectedColor || product.color) && <span className="text-slate-300 dark:text-slate-700">|</span>}
            {(selectedColor || product.color) && <span className="text-sky-500 dark:text-sky-400">Colour: {selectedColor || product.color}</span>}
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight break-words">{product.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(localRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />)}</div>
            <span className="text-sm font-medium">{localRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({localReviewCount} reviews)</span>
          </div>

          {/* Flipkart / Amazon Style Pricing Header */}
          <div className="flex items-baseline gap-2 pt-2 flex-wrap">
            {activeOriginalPrice && activeOriginalPrice > activePrice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xl sm:text-2xl flex items-center">
                ↓{activeDiscount}%
              </span>
            )}
            {activeOriginalPrice && activeOriginalPrice > activePrice && (
              <span className="text-lg sm:text-xl text-muted-foreground line-through font-normal">
                {formatRupees(activeOriginalPrice)}
              </span>
            )}
            <span className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              {formatRupees(activePrice)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>

          {/* Wholesale Bulk Pricing Tier Card */}
          {product.bulkPrice ? (
            <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 dark:border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-extrabold">B2B Wholesale</span>
                  <span>Bulk Order Rate</span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  Min. Order: {product.minBulkQty || 10} pcs
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatRupees(product.bulkPrice)}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/ pc</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Regular Unit Price: {formatRupees(baseActivePrice)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQty(Math.max(qty, product.minBulkQty || 10))}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Order Bulk ({product.minBulkQty || 10}+ pcs)
                </button>
              </div>
              {isBulkEligible ? (
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 p-2 rounded-xl flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Wholesale Bulk Discount Applied! Total: {formatRupees(activePrice * qty)} ({qty} pcs × {formatRupees(activePrice)})</span>
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="text-sm leading-relaxed text-foreground/80 pt-1 break-words whitespace-pre-line">{product.description}</p>

          {/* Product Variant & Color Selection Section */}
          <div className="space-y-4 pt-3 pb-2 border-y dark:border-slate-800">
            {/* Selected Color Section with Image Cards */}
            {availableColors.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-normal text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white">Selected Color: </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedColor || availableColors[0]}</span>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {availableColors.map((color: any) => {
                    const isSelected = selectedColor === color;
                    const colorVar = allVariants.find((v: any) => v.color === color && (v.storage === selectedStorage || !selectedStorage) && (v.ram === selectedRam || !selectedRam)) || allVariants.find((v: any) => v.color === color);
                    const isColorOutOfStock = !colorVar || Number(colorVar.stock) === 0;
                    const img = colorVar?.image || (colorVar?.images && colorVar.images[0]) || product.image;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        className={`relative rounded-2xl overflow-hidden p-1.5 transition-all flex flex-col items-center justify-center bg-white dark:bg-slate-900 ${
                          isSelected
                            ? "border-2 border-slate-900 dark:border-white shadow-md scale-105"
                            : "border border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <div className="w-16 h-20 sm:w-20 sm:h-24 flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden">
                          <img src={img} alt={color} className="max-w-full max-h-full object-contain pointer-events-none" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-1 max-w-[70px] truncate">{color}</span>
                        {isColorOutOfStock && (
                          <span className="text-[10px] text-red-500 font-bold leading-tight pt-0.5">Out of Stock</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deduplicated Variant Cards (Storage + RAM) matching Screenshot 2 & 3 */}
            {uniqueConfigs.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-sm font-normal text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-slate-900 dark:text-white">Variant: </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {selectedStorage}{selectedRam ? ` + ${selectedRam}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {uniqueConfigs.map((cfg: any) => {
                    const matchVar = cfg.variants.find((v: any) => v.color === selectedColor) || cfg.variants[0];
                    const isSelected = selectedStorage === cfg.storage && (selectedRam === cfg.ram || !cfg.ram);
                    const isOutOfStock = !matchVar || Number(matchVar.stock) === 0;
                    const vPrice = matchVar ? Number(matchVar.price) : activePrice;
                    const vOrigPrice = matchVar?.originalPrice != null ? Number(matchVar.originalPrice) : null;
                    const vDisc = matchVar?.discount ?? (vOrigPrice && vOrigPrice > vPrice ? Math.round(((vOrigPrice - vPrice) / vOrigPrice) * 100) : 0);

                    return (
                      <button
                        key={cfg.key}
                        type="button"
                        onClick={() => {
                          if (matchVar) {
                            setSelectedVariant(matchVar);
                            if (matchVar.ram) setSelectedRam(matchVar.ram);
                            if (matchVar.storage) setSelectedStorage(matchVar.storage);
                            if (matchVar.color) setSelectedColor(matchVar.color);
                            updateUrlVariant(matchVar.sku);
                          }
                        }}
                        className={`rounded-2xl p-3 text-left transition-all relative flex flex-col justify-between ${
                          isOutOfStock
                            ? "border border-dashed border-slate-300 dark:border-slate-700 opacity-60 bg-slate-50 dark:bg-slate-900/40"
                            : isSelected
                            ? "border-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/80 shadow-md scale-[1.02]"
                            : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                            {cfg.label}
                          </div>
                          {vOrigPrice && vOrigPrice > vPrice && !isOutOfStock ? (
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] flex items-center">
                                ↓{vDisc}%
                              </span>
                              <span className="text-muted-foreground line-through text-[11px]">
                                {formatRupees(vOrigPrice)}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white pt-1">
                          {formatRupees(vPrice)}
                        </div>
                        {isOutOfStock ? (
                          <span className="text-[11px] text-red-500 font-semibold pt-0.5">Out of Stock</span>
                        ) : Number(matchVar?.stock) === 1 ? (
                          <span className="text-[11px] text-amber-600 font-semibold pt-0.5">1 left</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {activeStock === 0 ? (
            <p className="text-sm text-red-600 font-medium">Out of Stock</p>
          ) : activeStock === 1 ? (
            <p className="text-sm text-amber-600 font-medium">1 Last Pic. Available!</p>
          ) : (
            <p className="text-sm text-emerald-600 font-medium">✓ In Stock</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center border border-input rounded-lg overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 hover:bg-muted" aria-label="Decrease"><Minus className="h-4 w-4 mx-auto" /></button>
              <span className="h-10 w-10 flex items-center justify-center font-medium text-sm">{qty}</span>
              <button onClick={() => setQty(Math.min(activeStock, qty + 1))} className="h-10 w-10 hover:bg-muted" aria-label="Increase"><Plus className="h-4 w-4 mx-auto" /></button>
            </div>
            <Button size="icon" variant="outline" onClick={toggleWish} aria-label="Wishlist" className="h-10 w-10"><Heart className={`h-4 w-4 ${inWish ? "fill-red-500 text-red-500" : ""}`} /></Button>
            <Button size="icon" variant="outline" onClick={handleShare} aria-label="Share product" className="h-10 w-10 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-500"><Share2 className="h-4 w-4" /></Button>
          </div>

          {/* Bottom Action Bar with Mobile Safe Area Navigation Padding */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_25px_rgba(0,0,0,0.12)] sm:static sm:p-0 sm:border-0 sm:bg-transparent sm:shadow-none sm:backdrop-blur-none">
            <div className="flex items-center gap-2 max-w-[1200px] mx-auto w-full">
              {/* Cart Icon Quick Button */}
              <button
                onClick={add}
                disabled={adding || activeStock === 0}
                className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 active:scale-95 transition-all shadow-sm flex-shrink-0 disabled:opacity-40"
                title="Add to Cart"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>

              {activeStock > 0 ? (
                <>
                  {/* Add to Cart Button */}
                  <Button
                    onClick={add}
                    disabled={adding}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-2 border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                  >
                    {adding ? "Adding..." : "Add to Cart"}
                  </Button>

                  {/* Buy Now Button (Theme Primary Blue) */}
                  <Button
                    onClick={buyNow}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-sm active:scale-95 transition-all shadow-md border-none"
                  >
                    <span>Buy now at {formatRupees(activePrice)}</span>
                  </Button>
                </>
              ) : (
                /* Out of Stock: Blue Notify Me Button matching Screenshot 3! */
                <Button
                  onClick={handleNotifyMe}
                  disabled={notifying}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-extrabold text-sm active:scale-95 transition-all shadow-md border-none flex items-center justify-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  <span>{notified ? "Notification Set! ✓" : notifying ? "Registering..." : "Notify Me"}</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3">
            {[{icon: Truck, t: "Free Shipping"}, {icon: ShieldCheck, t: "Authentic"}, {icon: RotateCcw, t: product.returnPolicy || "7-day Returns"}].map(({icon: I, t}, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg"><I className="h-4 w-4 mx-auto mb-1" />{t}</div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Shop Information Badge (Just above Description & Specs) */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
                <span>Wholesale Direct Supplier</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" />
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                Sold by: Hello Bazaar Official Wholesale
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                100% Genuine Direct Manufacturer & Wholesale Supply
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Verified Wholesale Supplier
          </span>
        </div>
      </section>

      {Object.keys(activeSpecs).length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold mb-4 tracking-tight">Specifications</h2>
          <div className="bg-card rounded-xl product-card-shadow overflow-hidden">
            <dl className="divide-y divide-border">
              {Object.entries(activeSpecs).map(([k, v]) => (
                <div key={k} className="flex flex-col sm:grid sm:grid-cols-3 px-4 py-3 text-sm gap-1 sm:gap-2 w-full min-w-0">
                  <dt className="text-muted-foreground col-span-1 break-words font-medium sm:font-normal min-w-0">{k}</dt>
                  <dd className="col-span-2 font-medium break-words whitespace-pre-wrap min-w-0">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* Reviews & Ratings Section */}
      <section className="mb-12">
        <h2 className="text-xl font-display font-bold mb-6 tracking-tight">Customer Reviews</h2>
        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Review List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-6 rounded-xl border text-center font-medium">No customer reviews yet. Be the first to purchase and review this product!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-card rounded-xl p-4 product-card-shadow space-y-2 border border-border/40">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-350 dark:text-slate-655"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{r.rating}.0</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-foreground/80 leading-relaxed break-words">{r.comment}</p>}
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Purchaser: {r.user?.fullName || "Anonymous"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Form */}
          <div className="bg-card rounded-xl p-5 border border-border/50 product-card-shadow space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Submit a Review</h3>
            {status !== "authenticated" ? (
              <p className="text-xs text-muted-foreground">Please <Link href="/login" className="text-primary font-semibold hover:underline">login</Link> to write a review.</p>
            ) : loadingReviews ? (
              <p className="text-xs text-muted-foreground">Checking review permissions...</p>
            ) : canWriteReview ? (
              <form onSubmit={submitReview} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-115 cursor-pointer border-none bg-transparent"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= (hoveredStar || userRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-350 dark:text-slate-655"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Review</label>
                  <textarea
                    required
                    rows={4}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Describe your experience with this product..."
                    className="w-full text-sm p-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingReview || userRating === 0}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : hasReviewed ? (
              <div className="text-center p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Review Submitted</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">You have already submitted a review for this product. Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="text-center p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1.5">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Not Eligible</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Reviews can only be submitted after purchasing/booking this product successfully.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="text-xl md:text-2xl font-display font-bold mb-5 tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map((p: any) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      {showMobileZoomModal && (
        <MobileTouchZoomModal
          images={galleryImages}
          activeIndex={activeIdx}
          onClose={() => setShowMobileZoomModal(false)}
          onSelectImage={(idx) => selectImage(galleryImages[idx], idx)}
        />
      )}
    </div>
  );
}

function MobileTouchZoomModal({
  images,
  activeIndex,
  onClose,
  onSelectImage,
}: {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onSelectImage: (index: number) => void;
}) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [direction, setDirection] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef(1);
  const touchStartPanRef = useRef({ x: 0, y: 0 });
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const lastTapTimeRef = useRef(0);

  useEffect(() => {
    setCurrentIndex(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setDragOffset(0);
  }, [currentIndex]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const next = currentIndex - 1;
      setDirection(-1);
      setCurrentIndex(next);
      onSelectImage(next);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      const next = currentIndex + 1;
      setDirection(1);
      setCurrentIndex(next);
      onSelectImage(next);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
      setIsSwiping(false);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        if (scale > 1) {
          setScale(1);
          setPan({ x: 0, y: 0 });
        } else {
          setScale(2.5);
          setPan({ x: 0, y: 0 });
        }
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      touchStartPanRef.current = { ...pan };
      setIsSwiping(scale === 1);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDistRef.current;
      const newScale = Math.min(Math.max(1, touchStartScaleRef.current * factor), 4);
      setScale(newScale);

      if (newScale === 1) {
        setPan({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartPosRef.current.x;
      const deltaY = e.touches[0].clientY - touchStartPosRef.current.y;

      if (scale > 1) {
        const maxPanX = (scale - 1) * 150;
        const maxPanY = (scale - 1) * 200;
        const newPanX = Math.min(Math.max(-maxPanX, touchStartPanRef.current.x + deltaX), maxPanX);
        const newPanY = Math.min(Math.max(-maxPanY, touchStartPanRef.current.y + deltaY), maxPanY);
        setPan({ x: newPanX, y: newPanY });
      } else if (scale === 1 && Math.abs(deltaX) > Math.abs(deltaY)) {
        setDragOffset(deltaX);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    if (scale === 1 && isSwiping) {
      const swipeThreshold = 50;
      if (dragOffset < -swipeThreshold && currentIndex < images.length - 1) {
        handleNext();
      } else if (dragOffset > swipeThreshold && currentIndex > 0) {
        handlePrev();
      }
      setDragOffset(0);
      setIsSwiping(false);
    } else if (scale < 1.05) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 4));
  const zoomOut = () => {
    setScale((prev) => {
      const next = Math.max(Number((prev - 0.25).toFixed(2)), 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        className="fixed inset-0 z-50 bg-white flex flex-col justify-between select-none touch-none will-change-transform"
      >
        {/* Top Control Bar with safe area padding to prevent notch overlap */}
        <div className="flex items-center justify-between px-4 pt-12 pb-3 sm:pt-6 sm:pb-4 z-30 bg-gradient-to-b from-white via-white/95 to-transparent">
          <div className="text-slate-800 text-xs font-semibold px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 shadow-sm">
            {currentIndex + 1} / {images.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 1}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-30 border border-slate-200 transition active:scale-95 shadow-sm"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="text-slate-900 text-xs font-bold font-mono min-w-[42px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={zoomIn}
              disabled={scale >= 4}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-30 border border-slate-200 transition active:scale-95 shadow-sm"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>

            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition active:scale-95 shadow-sm"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white border border-red-400 ml-1.5 transition active:scale-95 shadow-md"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Interactive Touch Zoom Area with Ultra-Fast Liquid Slide */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none select-none bg-white"
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  x: dir > 0 ? "100%" : dir < 0 ? "-100%" : 0,
                  opacity: 1,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  x: dir < 0 ? "100%" : dir > 0 ? "-100%" : 0,
                  opacity: 1,
                }),
              }}
              initial={direction !== 0 ? "enter" : false}
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 36 },
                opacity: { duration: 0.1 },
              }}
              className="absolute inset-0 w-full h-full flex items-center justify-center p-2 pointer-events-none will-change-transform"
            >
              <img
                src={images[currentIndex] || images[0]}
                alt="Product Zoom"
                style={{
                  transform: scale > 1
                    ? `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`
                    : `translateX(${dragOffset}px)`,
                  transformOrigin: "center center",
                  transition: touchStartDistRef.current || isSwiping || dragOffset !== 0 ? "none" : "transform 0.12s ease-out",
                }}
                className="max-w-full max-h-full object-contain pointer-events-auto cursor-grab active:cursor-grabbing will-change-transform"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Gallery Thumbnails */}
        <div className="p-4 z-30 bg-gradient-to-t from-white via-white/95 to-transparent">
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const dir = i > currentIndex ? 1 : -1;
                    setDirection(dir);
                    setCurrentIndex(i);
                    onSelectImage(i);
                  }}
                  className={`w-14 h-14 rounded-xl bg-slate-50 border-2 overflow-hidden flex-shrink-0 transition-all p-1 ${
                    currentIndex === i ? "border-sky-500 scale-105 shadow-md" : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-contain pointer-events-none" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
