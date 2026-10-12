"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Smartphone, Tv, Laptop, BadgePercent, Play, ShoppingBag } from "lucide-react";

const DEFAULT_SLIDES = [
  {
    id: "slide-tv",
    title: "MEGA MONSOON SALE",
    subtitle: "Up to 50% Off on Smart TVs",
    desc: "Experience cinema at home with 4K UHD TVs from top brands like Samsung, LG, and Sony.",
    color: "from-blue-600 via-sky-500 to-cyan-500",
    link: "/products?category=tv",
    badge: "Limited Offer",
    mediaType: "IMAGE",
    mediaUrl: "",
    buttonText: "Explore Deal",
    durationSeconds: 3,
    icon: Tv,
  },
  {
    id: "slide-laptop",
    title: "UPGRADE YOUR WORKSTATION",
    subtitle: "Best Deals on Premium Laptops",
    desc: "Unleash maximum productivity with high-performance Intel Core & Apple M-series laptops.",
    color: "from-violet-600 via-purple-600 to-indigo-600",
    link: "/products?category=laptop",
    badge: "Student Discounts",
    mediaType: "IMAGE",
    mediaUrl: "",
    buttonText: "Shop Laptops",
    durationSeconds: 2,
    icon: Laptop,
  },
  {
    id: "slide-smartphone",
    title: "UNBEATABLE SMARTPHONE DEALS",
    subtitle: "Latest iPhones & Androids starting at ₹12,999",
    desc: "Grab mega exchange bonuses, no-cost EMI options, and instant bank cashbacks.",
    color: "from-rose-500 via-pink-500 to-violet-600",
    link: "/products?category=smartphone",
    badge: "Best Seller",
    mediaType: "IMAGE",
    mediaUrl: "",
    buttonText: "View Mobiles",
    durationSeconds: 4,
    icon: Smartphone,
  },
  {
    id: "slide-coupons",
    title: "EXTRA DISCOUNT COUPONS",
    subtitle: "Save up to ₹2,000 extra on checkout!",
    desc: "Use promo codes to unlock additional price drops on checkout page. View active coupons.",
    color: "from-amber-500 via-orange-500 to-rose-500",
    link: "/offers",
    badge: "0% UPI Commission",
    mediaType: "IMAGE",
    mediaUrl: "",
    buttonText: "Claim Coupon",
    durationSeconds: 3,
    icon: BadgePercent,
  },
];

// Helper to reliably detect if a URL is a video
function checkIsVideo(url?: string, type?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerType = (type || "").toLowerCase();
  return (
    lowerType === "video" ||
    lowerType.includes("video") ||
    lowerUrl.endsWith(".mp4") ||
    lowerUrl.endsWith(".webm") ||
    lowerUrl.endsWith(".mov") ||
    lowerUrl.endsWith(".avi") ||
    lowerUrl.endsWith(".mkv") ||
    lowerUrl.includes("/video/upload/")
  );
}

export function OfferCarousel() {
  const router = useRouter();
  const [slides, setSlides] = useState<any[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    // Preload slide images in browser background immediately
    slides.forEach((slide) => {
      if (slide.mediaUrl && !checkIsVideo(slide.mediaUrl, slide.mediaType)) {
        const img = new Image();
        img.src = slide.mediaUrl;
      }
    });
  }, [slides]);

  useEffect(() => {
    async function loadDynamicBanners() {
      // 1. Try instant cache from sessionStorage
      try {
        const cached = sessionStorage.getItem("eb_dynamic_banners");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(parsed);
          }
        }
      } catch (e) {}

      try {
        const res = await fetch("/api/banners");
        const data = await res.json();
        if (res.ok && Array.isArray(data.banners) && data.banners.length > 0) {
          const dynamicSlides = data.banners.map((b: any, idx: number) => {
            const isVid = checkIsVideo(b.mediaUrl, b.mediaType);
            return {
              id: b.id || `custom-banner-${idx}`,
              title: b.badgeText || "SPECIAL OFFER",
              subtitle: b.title || "Hello Bazaar Featured Deal",
              desc: b.description || "",
              color: "from-slate-900 via-slate-800 to-indigo-950",
              link: b.targetUrl || "/products",
              badge: b.badgeText || "HOT DEAL",
              mediaType: isVid ? "VIDEO" : "IMAGE",
              mediaUrl: b.mediaUrl || "",
              buttonText: b.buttonText || "Shop Now",
              durationSeconds: Number(b.durationSeconds) || (idx % 2 === 0 ? 3 : 2),
              icon: isVid ? Play : Flame,
            };
          });
          setSlides(dynamicSlides);
          try {
            sessionStorage.setItem("eb_dynamic_banners", JSON.stringify(dynamicSlides));
          } catch (e) {}
        }
      } catch (e) {
        console.log("Using default hero slides fallback");
      }
    }
    loadDynamicBanners();
  }, []);

  const paginate = (newDirection: number) => {
    if (slides.length <= 1) return;
    setDirection(newDirection);
    setCurrent((prev) => {
      let next = prev + newDirection;
      if (next >= slides.length) next = 0;
      if (next < 0) next = slides.length - 1;
      return next;
    });
  };

  const activeSlide = slides[current] || slides[0];
  const slideDuration = (activeSlide?.durationSeconds || 3) * 1000;

  // Dynamic mixed-timing auto-slide timer per slide duration set by Super Admin
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, slideDuration);
    return () => clearTimeout(timer);
  }, [current, slides.length, slideDuration]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      paginate(1);
    } else if (info.offset.x > swipeThreshold) {
      paginate(-1);
    }
  };

  const isVideo = activeSlide ? checkIsVideo(activeSlide.mediaUrl, activeSlide.mediaType) : false;

  return (
    <div className="relative w-full max-w-[1240px] mx-auto overflow-hidden rounded-2xl bg-slate-950 shadow-2xl group h-[230px] sm:h-[290px] md:h-[360px] border border-slate-800">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.25 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          onClick={() => router.push(activeSlide.link || "/products")}
          className={`absolute inset-0 cursor-pointer w-full h-full text-white p-6 sm:p-10 flex items-center justify-between select-none overflow-hidden ${
            !activeSlide.mediaUrl ? `bg-gradient-to-r ${activeSlide.color || "from-blue-600 to-indigo-700"}` : ""
          }`}
        >
          {/* Background Video or Image Poster with Uniform Aspect Ratio Scaling */}
          {activeSlide.mediaUrl && (
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950 flex items-center justify-center">
              {isVideo ? (
                <video
                  ref={(el) => {
                    if (el) el.play().catch(() => {});
                  }}
                  src={activeSlide.mediaUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onEnded={() => paginate(1)}
                  className="w-full h-full object-cover object-center scale-105 pointer-events-none transition-transform duration-500"
                />
              ) : (
                <img
                  src={activeSlide.mediaUrl}
                  alt={activeSlide.subtitle || "Banner Poster"}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-full object-cover object-center scale-105 pointer-events-none transition-transform duration-500"
                />
              )}
              {/* Dark Gradient Overlay for High Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent z-10" />
            </div>
          )}

          {/* Text Content Overlay */}
          <div className="relative z-20 max-w-xl space-y-2 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase text-white shadow">
              <Flame className="h-3.5 w-3.5 text-amber-300 animate-pulse shrink-0" />
              <span>{activeSlide.badge || "SPECIAL DEAL"}</span>
            </div>

            {activeSlide.title && (
              <h3 className="text-[10px] sm:text-xs font-extrabold tracking-widest uppercase opacity-90 text-amber-300 font-display">
                {activeSlide.title}
              </h3>
            )}

            <h2 className="text-xl sm:text-3xl md:text-4xl font-black font-display tracking-tight leading-tight drop-shadow-md">
              {activeSlide.subtitle}
            </h2>

            {activeSlide.desc && (
              <p className="text-white/90 text-xs sm:text-sm max-w-md hidden sm:block font-sans font-medium line-clamp-2 leading-relaxed drop-shadow">
                {activeSlide.desc}
              </p>
            )}

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-xl shadow-lg border border-amber-400/40 transform transition-all group-hover:scale-105">
                <ShoppingBag className="h-4 w-4" />
                <span>{activeSlide.buttonText || "Shop Now"}</span>
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              paginate(-1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 z-30 cursor-pointer border border-white/20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              paginate(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md flex items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 z-30 cursor-pointer border border-white/20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Indicator dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setDirection(idx > current ? 1 : -1);
                setCurrent(idx);
              }}
              className={`h-2 rounded-full transition-all border-none ${
                idx === current ? "w-6 bg-amber-400 shadow" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Hidden pre-rendered images for instant zero-lag slide transitions */}
      <div className="hidden" aria-hidden="true">
        {slides.map((s, idx) => (
          s.mediaUrl && !checkIsVideo(s.mediaUrl, s.mediaType) ? (
            <img key={s.id || idx} src={s.mediaUrl} alt="" loading="eager" decoding="async" />
          ) : null
        ))}
      </div>
    </div>
  );
}
