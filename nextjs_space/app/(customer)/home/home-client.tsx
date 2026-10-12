"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sparkles,
  Flame,
  TrendingUp,
  Smartphone,
  Laptop,
  Tv,
  Watch,
  Refrigerator,
  ChevronRight,
  Lock,
  Camera,
  Upload,
  User,
  X,
} from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, any> = {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Watch,
  Refrigerator,
};

// Dynamic count formatting rule:
// 0 products -> "0 products"
// 1 to 98 -> "N products"
// 99 to 998 -> "99+ products"
// 999+ -> "999+ products"
export function formatProductCount(count: number = 0): string {
  if (!count || count <= 0) return "0 products";
  if (count < 99) return `${count} products`;
  if (count < 999) return "99+ products";
  return "999+ products";
}

const quickCategoryCircles = [
  {
    name: "Mobiles",
    slug: "smartphones",
    altSlugs: ["smartphones", "mobiles", "mobile", "phones"],
    icon: Smartphone,
    bgLight: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  },
  {
    name: "Laptops",
    slug: "laptops",
    altSlugs: ["laptops", "computers", "laptop"],
    icon: Laptop,
    bgLight: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400",
  },
  {
    name: "TV & Audio",
    slug: "televisions",
    altSlugs: ["televisions", "tv", "television"],
    icon: Tv,
    bgLight: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
  },
  {
    name: "Home Appliances",
    slug: "appliances",
    altSlugs: ["appliances", "home-appliances", "home"],
    icon: Refrigerator,
    bgLight: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  },
  {
    name: "Audio",
    slug: "audio",
    altSlugs: ["audio", "headphones", "sound"],
    icon: Headphones,
    bgLight: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
  },
  {
    name: "Smart Gadgets",
    slug: "wearables",
    altSlugs: ["wearables", "smartwatches", "gadgets"],
    icon: Watch,
    bgLight: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
  },
];

export function HomeClient({
  categories = [],
  featured = [],
  trending = [],
  initialBrands = [],
  initialBanners = [],
}: {
  categories: any[];
  featured: any[];
  trending: any[];
  initialBrands?: any[];
  initialBanners?: any[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [brands, setBrands] = useState<any[]>(initialBrands);
  const [banners, setBanners] = useState<any[]>(initialBanners);

  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession() || {};
  const [dealerProfile, setDealerProfile] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const homeFileInputRef = useRef<HTMLInputElement>(null);
  const homeCameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) setDealerProfile(d);
        })
        .catch(() => {});
    } else {
      setDealerProfile(null);
    }
  }, [status]);

  useEffect(() => {
    const handlePhotoUpdate = (e: any) => {
      if (e?.detail?.image) {
        setDealerProfile((prev: any) =>
          prev ? { ...prev, image: e.detail.image } : { image: e.detail.image }
        );
      }
    };
    window.addEventListener("profile-photo-updated", handlePhotoUpdate);
    return () => window.removeEventListener("profile-photo-updated", handlePhotoUpdate);
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be smaller than 2MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (res.ok) {
          setDealerProfile((prev: any) => ({ ...prev, image: base64 }));
          toast.success("Profile photo updated successfully!");
          setShowUploadModal(false);
          window.dispatchEvent(
            new CustomEvent("profile-photo-updated", { detail: { image: base64 } })
          );
        } else {
          toast.error("Failed to update profile photo");
        }
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error updating profile photo");
      setUploadingPhoto(false);
    }
  };

  // Fetch real-time active banners & brands
  useEffect(() => {
    Promise.all([
      fetch("/api/banners").then((r) => (r.ok ? r.json() : { banners: [] })),
      fetch("/api/brands").then((r) => (r.ok ? r.json() : { brands: [] })),
    ])
      .then(([bannersData, brandsData]) => {
        if (Array.isArray(bannersData?.banners)) setBanners(bannersData.banners);
        if (Array.isArray(brandsData?.brands)) setBrands(brandsData.brands);
      })
      .catch(() => {});
  }, []);

  const heroBanners = banners.filter((b) => b.placement !== "DEAL");
  const dealBanners = banners.filter((b) => b.placement === "DEAL");

  // Auto cycle hero slides
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const activeHero = heroBanners[currentSlide] || heroBanners[0];

  return (
    <div className="min-h-screen pb-16 md:pb-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ========================================================================= */}
      {/* 1. HERO CAROUSEL BANNER (100% ADMIN CONTROLLED DYNAMIC BANNER) */}
      {/* ========================================================================= */}
      {heroBanners.length > 0 && activeHero && (
        <section className="mx-auto max-w-[1200px] px-3 sm:px-4 pt-4 sm:pt-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-white/10 min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center">
            {/* Background Media (Image or Video) */}
            {activeHero.mediaUrl && (
              <div className="absolute inset-0 opacity-40 z-0 overflow-hidden">
                {activeHero.mediaType === "VIDEO" ? (
                  <video
                    src={activeHero.mediaUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={activeHero.mediaUrl}
                    alt={activeHero.title || "Banner"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 w-full p-6 sm:p-8 md:p-12 flex flex-col justify-between h-full">
              <div className="max-w-xl space-y-3">
                {/* Badge */}
                {activeHero.badgeText && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-sky-300">
                    <Lock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{activeHero.badgeText}</span>
                  </div>
                )}

                {/* Headline */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black font-display tracking-tight leading-tight text-white drop-shadow-md">
                  {activeHero.title || "Latest Electronics At Best Prices"}
                </h1>

                {/* Subtitle */}
                {activeHero.description && (
                  <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-md line-clamp-2">
                    {activeHero.description}
                  </p>
                )}

                {/* Button */}
                <div className="pt-2">
                  <Link href={activeHero.targetUrl || "/products"}>
                    <Button className="bg-white hover:bg-slate-100 text-slate-950 font-bold px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm shadow-lg hover:shadow-white/20 transition-all flex items-center gap-2">
                      <span>{activeHero.buttonText || "Shop Now"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Indicators */}
              {heroBanners.length > 1 && (
                <div className="flex items-center justify-between pt-6 mt-auto">
                  <div className="flex items-center gap-1.5">
                    {heroBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === currentSlide ? "w-6 bg-sky-400" : "w-1.5 bg-white/30 hover:bg-white/60"
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
                    {currentSlide + 1} / {heroBanners.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. QUICK CATEGORY CIRCLES BAR (CLICK TO FILTER PRODUCTS) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
        <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
          {/* Dealer Profile & Photo Upload Circle */}
          {mounted && status === "authenticated" && (
            <div className="group flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[86px] text-center shrink-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  title={dealerProfile?.image ? "Click to change dealer photo" : "Click to upload dealer photo"}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-0.5 border-2 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 overflow-hidden ${
                    dealerProfile?.image
                      ? "border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20"
                      : "border-indigo-500 border-dashed bg-indigo-50/90 dark:bg-indigo-950/60"
                  }`}
                >
                  {dealerProfile?.image ? (
                    <img
                      src={dealerProfile.image}
                      alt={dealerProfile?.fullName || "Dealer Profile"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-indigo-600 dark:text-sky-400">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-12" />
                    </div>
                  )}
                </button>

                {/* Camera / Edit Badge */}
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                    dealerProfile?.image
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                  title="Upload / Change Photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[76px] sm:max-w-[90px] block"
              >
                {dealerProfile?.image
                  ? (dealerProfile?.shopName || dealerProfile?.fullName?.split(" ")[0] || "My Store")
                  : "Upload Photo"}
              </button>
            </div>
          )}

          {(categories && categories.length > 0 ? categories : quickCategoryCircles).map((item: any, idx: number) => {
            const Icon = iconMap[item.icon || ""] || item.icon || Smartphone;
            const targetSlug = item.slug;
            const hasCustomLogo = Boolean(item.image);

            return (
              <Link
                key={item.id || idx}
                href={`/products?category=${targetSlug}`}
                className="group flex flex-col items-center gap-2 min-w-[72px] sm:min-w-[86px] text-center"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 overflow-hidden ${
                    hasCustomLogo
                      ? "bg-white dark:bg-white"
                      : (item.bgLight || "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400")
                  }`}
                >
                  {hasCustomLogo ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:rotate-6" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors truncate max-w-[80px]">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TRUST BADGES BAR */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          {[
            {
              icon: Truck,
              t: "Free Shipping",
              s: "On orders over ₹10,000",
              color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
            },
            {
              icon: ShieldCheck,
              t: "Genuine Products",
              s: "100% authentic guarantee",
              color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
            },
            {
              icon: RotateCcw,
              t: "Easy Returns",
              s: "7-day replacement policy",
              color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50",
            },
            {
              icon: Headphones,
              t: "24/7 Support",
              s: "Expert assistance anytime",
              color: "text-purple-500 bg-purple-50 dark:bg-purple-950/50",
            },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
              <div
                className={`h-10 w-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{f.t}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{f.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LIMITED TIME DEALS BANNER (100% ADMIN CONTROLLED DYNAMIC DEALS) */}
      {/* ========================================================================= */}
      {dealBanners.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-5 space-y-4">
          {dealBanners.map((deal) => (
            <div
              key={deal.id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {deal.mediaUrl && (
                <div className="absolute inset-0 opacity-20 z-0 overflow-hidden">
                  <img src={deal.mediaUrl} alt="Deal" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-2 z-10">
                {deal.badgeText && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{deal.badgeText}</span>
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-white">
                  {deal.title}
                </h3>
                {deal.description && (
                  <p className="text-xs sm:text-sm text-purple-100 max-w-lg">
                    {deal.description}
                  </p>
                )}
              </div>

              <div className="z-10 shrink-0">
                <Link href={deal.targetUrl || "/products"}>
                  <Button className="bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5">
                    <span>{deal.buttonText || "Explore Deals"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Decorative circles */}
              <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
              <div className="absolute top-0 right-1/4 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
            </div>
          ))}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. SHOP BY CATEGORY SECTION (DYNAMIC COUNTS FORMATTED 0 / N / 99+ / 999+) */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Explore our wide range of electronics
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((c: any) => {
            const Icon = iconMap[c.icon] ?? Smartphone;
            const productCount = c._count?.products ?? 0;
            const formattedCount = formatProductCount(productCount);
            const hasCustomLogo = Boolean(c.image);

            return (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-4 text-center border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-sky-500/50 hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-between"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden ${
                    hasCustomLogo
                      ? "bg-slate-50 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-2"
                      : "bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/50 dark:to-sky-950/50 text-indigo-600 dark:text-sky-400"
                  }`}
                >
                  {hasCustomLogo ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  ) : (
                    <Icon className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {formattedCount}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TOP BRANDS SECTION (DYNAMIC ADMIN UPLOADS - BLANK UNTIL ADMIN ADDS) */}
      {/* ========================================================================= */}
      {brands && brands.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                Top Brands
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Official authorized brand partners
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {brands.map((b: any) => (
              <Link
                key={b.id}
                href={`/products?brand=${encodeURIComponent(b.name)}`}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col items-center justify-center text-center h-24"
              >
                {b.logo ? (
                  <div className="w-full h-12 flex items-center justify-center p-1">
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                    {b.name}
                  </span>
                )}
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate max-w-full">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. FEATURED PRODUCTS (WITH BEST SELLER BADGE & PRICING) */}
      {/* ========================================================================= */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-500 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                  Featured Products
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Best sellers hand-picked for quality & performance
                </p>
              </div>
            </div>
            <Link
              href="/products?featured=true"
              className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. TRENDING PRODUCTS */}
      {/* ========================================================================= */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-3 sm:px-4 py-6">
          <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                  Trending Now
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Hot tech gadget deals trending this week
                </p>
              </div>
            </div>
            <Link
              href="/products?trending=true"
              className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {trending.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* DEALER PHOTO UPLOAD MODAL (DIRECT HOME PAGE ACCESS) */}
      {/* ========================================================================= */}
      {mounted && showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Dealer Profile Photo
                </h3>
                <p className="text-xs text-slate-500">
                  {dealerProfile?.shopName ? `${dealerProfile.shopName} (Authorized Dealer)` : "Authorized Dealer"}
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {dealerProfile?.image ? (
                  <img
                    src={dealerProfile.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                {dealerProfile?.fullName || "Authorized Dealer"}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => homeCameraInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingPhoto ? "Processing..." : "Take Photo with Camera"}</span>
              </button>
              <input
                ref={homeCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => homeFileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{uploadingPhoto ? "Processing..." : "Browse from Device / Gallery"}</span>
              </button>
              <input
                ref={homeFileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="pt-2 text-center">
                <Link
                  href="/profile"
                  onClick={() => setShowUploadModal(false)}
                  className="text-xs text-indigo-600 dark:text-sky-400 hover:underline font-semibold"
                >
                  View Full Dealer Profile →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
