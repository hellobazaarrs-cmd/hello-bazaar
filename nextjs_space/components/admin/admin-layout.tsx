"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  X,
  Ticket,
  Sun,
  Moon,
  User,
  FileText,
  Truck,
  Store,
  PackageCheck,
  Film,
  Activity,
  Layers,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dealers", label: "Authorized Dealers", icon: Store },
  { href: "/admin/products", label: "Products & Wholesale Pricing", icon: Package },
  { href: "/admin/orders", label: "Wholesale Orders", icon: ShoppingCart },
  { href: "/admin/invoices", label: "Billing & Custom Invoices", icon: FileText },
  { href: "/admin/activities", label: "Activity Audit Logs", icon: Activity },
  { href: "/admin/banners", label: "Hero Banners & Videos", icon: Film },
  { href: "/admin/brands", label: "Top Brands", icon: Layers },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/delivery-partner", label: "Delivery Partner App", icon: Truck },
  { href: "/admin/coupons", label: "Offers & Coupons", icon: Ticket },
  { href: "/profile", label: "My Profile", icon: User },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("admin-theme");
      if (savedTheme === "dark") {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("admin-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("admin-theme", "light");
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const bg = isDark ? "#0f172a" : "#f1f5f9";
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const headerBg = isDark ? "#020617" : "#1e40af";
  const sidebarBg = isDark ? "#090d16" : "#1e3a8a";

  return (
    <div className="w-full max-w-full overflow-x-hidden" style={{ minHeight: "100vh", background: bg, color: textColor, transition: "background 0.3s, color 0.3s" }}>
      {/* ===== STICKY TOP HEADER ===== */}
      <header
        style={{
          background: headerBg,
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        }}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/10 max-w-full overflow-x-hidden"
      >
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: 8, cursor: "pointer" }}
            className="lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0 }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }} className="truncate max-w-[140px] sm:max-w-none">Hello Bazaar</div>
            <div style={{ fontSize: 11, color: "#93c5fd" }} className="hidden sm:block">Super Admin Panel</div>
          </div>
        </div>

        {/* Right: Light/Dark Mode Toggle + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
            }}
            title="Toggle Light / Dark Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
            <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: "rgba(239,68,68,0.2)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ===== BODY: SIDEBAR + MAIN ===== */}
      <div className="w-full max-w-full overflow-x-hidden flex relative" style={{ display: "flex", position: "relative" }}>
        {/* MOBILE BACKDROP */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 40,
              backdropFilter: "blur(4px)",
            }}
            className="lg:hidden"
          />
        )}

        {/* SIDEBAR */}
        <aside
          style={{
            width: 240,
            background: sidebarBg,
            borderRight: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
            flexShrink: 0,
            zIndex: 45,
            minHeight: "calc(100dvh - 52px)",
          }}
          className={[
            "fixed top-[52px] left-0 h-[calc(100dvh-52px)]",
            "lg:static lg:h-auto lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div style={{ padding: "16px 12px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: "#93c5fd", textTransform: "uppercase", padding: "0 8px 8px" }}>
              Admin Controls
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                      background: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                      color: isActive ? "#ffffff" : "#93c5fd",
                      boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                    }}
                  >
                    <Icon style={{ width: 18, height: 18, flexShrink: 0, color: isActive ? "#ffffff" : "#93c5fd" }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* MAIN VIEW */}
        <main style={{ flex: 1, minWidth: 0 }} className="p-3 sm:p-5 lg:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
