"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingCart, User, LayoutGrid } from "lucide-react";
import { useSession } from "next-auth/react";
import { getGuestCartCount } from "@/lib/cart-local";

const items = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/products", icon: LayoutGrid, label: "Categories" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/cart", icon: ShoppingCart, label: "Cart", isCart: true },
  { href: "/profile", icon: User, label: "Profile", isProfile: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.image) {
        setUserAvatar((session.user as any).image);
      }
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.image) setUserAvatar(d.image);
        })
        .catch(() => {});
    } else {
      setUserAvatar("");
    }
  }, [status, session]);

  useEffect(() => {
    const handlePhotoUpdate = (e: any) => {
      if (e?.detail?.image) {
        setUserAvatar(e.detail.image);
      }
    };
    window.addEventListener("profile-photo-updated", handlePhotoUpdate);
    return () => window.removeEventListener("profile-photo-updated", handlePhotoUpdate);
  }, []);

  const updateCounts = () => {
    if (status === "authenticated") {
      fetch("/api/cart")
        .then((r) => (r.ok ? r.json() : []))
        .then((c) => {
          setCartCount(Array.isArray(c) ? c.length : 0);
        })
        .catch(() => {});
    } else {
      setCartCount(getGuestCartCount());
    }
  };

  useEffect(() => {
    if (!mounted) return;
    updateCounts();
    window.addEventListener("guest-cart-change", updateCounts);
    return () => {
      window.removeEventListener("guest-cart-change", updateCounts);
    };
  }, [status, pathname, mounted]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {items.map(({ href, icon: Icon, label, isCart, isProfile }) => {
          const active =
            pathname === href || (href !== "/home" && pathname?.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center py-2.5 gap-1 transition-all ${
                active
                  ? "text-indigo-600 dark:text-sky-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {mounted && isProfile && userAvatar ? (
                  <div
                    className={`h-6 w-6 rounded-full overflow-hidden border-2 transition-all ${
                      active
                        ? "border-indigo-600 dark:border-sky-400 ring-2 ring-indigo-500/30 scale-105"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <Icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
                )}
                {mounted && isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{label}</span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-sky-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
