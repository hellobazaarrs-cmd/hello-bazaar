"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  LogOut,
  Package,
  MapPin,
  HelpCircle,
  ChevronDown,
  Store,
  Camera,
  Upload,
  X,
  Smartphone,
  Laptop,
  Download,
  Truck,
} from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeliveryDownloadModal } from "@/components/delivery-download-modal";
import { useTheme } from "next-themes";
import { getGuestCartCount } from "@/lib/cart-local";
import { toast } from "sonner";

type Category = { id: string; name: string; slug: string };

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>("");

  const { data: session, status, update } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const { setTheme } = useTheme();
  const [cartBouncing, setCartBouncing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setTheme("light");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("site-theme", "light");
    }
  }, [setTheme]);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setCategories(d) : null))
      .catch(() => {});
  }, []);

  // Update counts
  const updateCounts = () => {
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/cart").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/wishlist").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]).then(([c, w]) => {
        setCartCount(Array.isArray(c) ? c.length : 0);
        setWishCount(Array.isArray(w) ? w.length : 0);
      });

      if ((session?.user as any)?.image) {
        setUserAvatar((session.user as any).image);
      }
    } else {
      setCartCount(getGuestCartCount());
      setWishCount(0);
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

  useEffect(() => {
    const handleCartBounce = () => {
      setCartBouncing(true);
      setTimeout(() => setCartBouncing(false), 500);
    };
    window.addEventListener("cart-bounce", handleCartBounce);
    return () => window.removeEventListener("cart-bounce", handleCartBounce);
  }, []);

  useEffect(() => {
    const handlePhotoUpdate = (e: any) => {
      if (e?.detail?.image) {
        setUserAvatar(e.detail.image);
      }
    };
    window.addEventListener("profile-photo-updated", handlePhotoUpdate);
    return () => window.removeEventListener("profile-photo-updated", handlePhotoUpdate);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Profile photo must be smaller than 2MB");
      return;
    }

    setUploadingAvatar(true);
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
          setUserAvatar(base64);
          toast.success("Profile photo updated successfully!");
          setShowAvatarModal(false);
          window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: { image: base64 } }));
          if (update) await update();
        } else {
          toast.error("Failed to update profile photo");
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Error updating profile photo");
      setUploadingAvatar(false);
    }
  };

  const navLinks = [
    { href: "/home", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/offers", label: "Offers" },
    { href: "/support", label: "Support" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="mx-auto max-w-[1200px] px-3 sm:px-4">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            {/* Mobile Hamburger & Logo */}
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Open menu" className="text-slate-700 dark:text-slate-200">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] bg-white dark:bg-slate-900 h-full overflow-y-auto p-6">
                    <div className="flex flex-col gap-6 mt-4">
                      <Logo />
                      <div className="flex flex-col gap-1">
                        {navLinks.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </div>

                      {/* DOWNLOAD APPS SECTION (ANDROID & PC) */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs uppercase tracking-wider text-indigo-600 dark:text-sky-400 font-bold mb-2.5 px-3 flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Apps</span>
                        </p>
                        <div className="flex flex-col gap-2">
                          {/* Android Mobile APK Download */}
                          <a
                            href="/HelloBazaar.apk"
                            download="HelloBazaar.apk"
                            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>Android App</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold">APK</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Download Mobile APK (v2.1.1)</p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-y-0.5 transition-transform shrink-0 ml-1" />
                          </a>

                          {/* Windows PC Application Download */}
                          <a
                            href="/HelloBazaar.exe"
                            download="HelloBazaar.exe"
                            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Laptop className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>Windows App</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-bold">EXE</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Download for PC (v2.1.1)</p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-transform shrink-0 ml-1" />
                          </a>

                          {/* Delivery Partner APK Download */}
                          <button
                            type="button"
                            onClick={() => setShowDeliveryModal(true)}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left group transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                <Truck className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white">Delivery Partner App</div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Partner App APK Download</p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-y-0.5 transition-transform shrink-0 ml-1" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 px-3">
                          Categories
                        </p>
                        <div className="flex flex-col gap-1">
                          {categories.map((c) => (
                            <Link
                              key={c.id}
                              href={`/products?category=${c.slug}`}
                              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-700 dark:text-slate-300"
                            >
                              {c.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {mounted && status === "authenticated" ? (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 px-3">
                            Account
                          </p>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => setShowAvatarModal(true)}
                              className="w-full px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" /> Change Profile Photo
                            </button>
                            <Link
                              href="/profile"
                              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
                            >
                              <User className="h-4 w-4 text-slate-500" /> My Profile
                            </Link>
                            <Link
                              href="/orders"
                              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
                            >
                              <Package className="h-4 w-4 text-slate-500" /> My Orders
                            </Link>
                            <Link
                              href="/profile/addresses"
                              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium flex items-center gap-2"
                            >
                              <MapPin className="h-4 w-4 text-slate-500" /> Saved Addresses
                            </Link>
                            <button
                              onClick={() => signOut({ callbackUrl: "/login" })}
                              className="w-full px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 text-left text-sm font-medium flex items-center gap-2"
                            >
                              <LogOut className="h-4 w-4" /> Logout
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3">
                          <Button
                            onClick={() => router.push("/login")}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                          >
                            Login
                          </Button>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Logo Section */}
              <Logo />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    pathname === l.href
                      ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-sky-400 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1">
                    Categories <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  {categories.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={() => router.push(`/products?category=${c.slug}`)}
                      className="cursor-pointer"
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center gap-1.5 transition">
                    <Smartphone className="h-4 w-4" />
                    <span>Download App</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl">
                  <DropdownMenuItem asChild>
                    <a
                      href="/HelloBazaar.apk"
                      download="HelloBazaar.apk"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Android Mobile App</div>
                        <div className="text-[10px] text-slate-500">Direct APK Download (v2.1.1)</div>
                      </div>
                      <Download className="w-4 h-4 text-emerald-600" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href="/HelloBazaar.exe"
                      download="HelloBazaar.exe"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Windows PC App</div>
                        <div className="text-[10px] text-slate-500">Desktop EXE Installer (v2.1.1)</div>
                      </div>
                      <Download className="w-4 h-4 text-blue-600" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeliveryModal(true)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Delivery Partner App</div>
                      <div className="text-[10px] text-slate-500">Partner APK Download</div>
                    </div>
                    <Download className="w-4 h-4 text-indigo-600" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Search Input Bar */}
            <form onSubmit={handleSearch} className="flex-1 hidden md:block max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for mobiles, laptops, TV, accessories..."
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-850 focus:border-indigo-500 transition-all"
                />
              </div>
            </form>

            {/* Right Icons: Wishlist, Cart, Profile */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Wishlist"
                onClick={() => router.push("/wishlist")}
                className="relative text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <Heart className="h-5 w-5" />
                {mounted && wishCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishCount}
                  </span>
                )}
              </Button>

              {/* Cart */}
              <Button
                id="header-cart-icon"
                data-cart-icon="true"
                variant="ghost"
                size="icon"
                aria-label="Cart"
                onClick={() => router.push("/cart")}
                className={`relative text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 ${
                  cartBouncing ? "scale-125 text-indigo-600 ring-4 ring-indigo-400/40 bg-indigo-50" : ""
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Profile Avatar / User Dropdown */}
              {mounted && status === "authenticated" ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="Profile"
                      className="relative p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {userAvatar || (session?.user as any)?.image ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-500 shadow-sm">
                          <img
                            src={userAvatar || (session?.user as any)?.image}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-1.5"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {userAvatar || (session?.user as any)?.image ? (
                            <img
                              src={userAvatar || (session?.user as any)?.image}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <button
                          onClick={() => setShowAvatarModal(true)}
                          title="Change Photo"
                          className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700"
                        >
                          <Camera className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {session?.user?.name ?? "My Account"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Quick Photo Upload Button */}
                    <div className="p-1">
                      <button
                        onClick={() => setShowAvatarModal(true)}
                        className="w-full px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Update Profile Photo</span>
                      </button>
                    </div>

                    <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />


                    {(session?.user as any)?.role === "ADMIN" && (
                      <DropdownMenuItem
                        onClick={() => router.push("/admin")}
                        className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <Store className="h-4 w-4" /> Super Admin Panel
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4 text-slate-400" /> Profile Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/orders")}
                      className="cursor-pointer"
                    >
                      <Package className="mr-2 h-4 w-4 text-slate-400" /> My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/profile/addresses")}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-slate-400" /> Saved Addresses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/support")}
                      className="cursor-pointer"
                    >
                      <HelpCircle className="mr-2 h-4 w-4 text-slate-400" /> Help & Support
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for mobiles, laptops, TV, accessories..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Photo Upload Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Set Profile Photo
              </h3>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-indigo-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {userAvatar || (session?.user as any)?.image ? (
                  <img
                    src={userAvatar || (session?.user as any)?.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {session?.user?.name || "User Photo"}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingAvatar ? "Processing..." : "Take Photo with Camera"}</span>
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleAvatarFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{uploadingAvatar ? "Processing..." : "Browse from Device / Gallery"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      <DeliveryDownloadModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
      />
    </>
  );
}
