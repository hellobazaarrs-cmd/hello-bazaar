"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  User,
  FileText,
  Truck,
  Store,
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DealerLayoutProps {
  children: React.ReactNode;
}

const dealerNavItems = [
  { href: "/dealer", label: "Shop Dashboard", icon: LayoutDashboard },
  { href: "/dealer/products", label: "My Products & Stock", icon: Package },
  { href: "/dealer/categories", label: "Product Categories", icon: Tags },
  { href: "/dealer/orders", label: "Orders & Delivery", icon: ShoppingCart },
  { href: "/dealer/invoices", label: "GST Bills & Invoices", icon: FileText },
  { href: "/delivery-partner", label: "Delivery App", icon: Truck },
  { href: "/dealer/customers", label: "Shop Customers", icon: Users },
  { href: "/dealer/coupons", label: "Shop Coupons", icon: Ticket },
  { href: "/dealer/reviews", label: "Product Reviews", icon: Star },
  { href: "/dealer/support", label: "Customer Support", icon: MessageSquare },
  { href: "/profile", label: "Dealer Profile", icon: User },
];

export function DealerLayout({ children }: DealerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const currentUser = (session as any)?.user;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [dealerStatus, setDealerStatus] = useState<string>(currentUser?.status || "APPROVED");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (currentUser?.status) {
      setDealerStatus(currentUser.status);
    }
  }, [currentUser?.status]);

  const checkCurrentStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok && data?.status) {
        setDealerStatus(data.status);
        if (data.status === "APPROVED") {
          toast.success("🎉 Congratulations! Your dealer account has been approved by Hello Bazaar!");
          if (updateSession) updateSession();
        } else {
          toast.info("Account is still pending Super Admin approval. Please check back shortly.");
        }
      }
    } catch {
      toast.error("Failed to check status");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      const savedTheme = localStorage.getItem("dealer-theme");
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
        localStorage.setItem("dealer-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("dealer-theme", "light");
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const isApproved = dealerStatus === "APPROVED";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-50 shadow-md px-4 py-3 flex items-center justify-between transition-colors ${isDark ? "bg-amber-950 border-b border-amber-900" : "bg-amber-600 text-white"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 overflow-hidden flex-shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-md" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
              <span>{currentUser?.shopName || "Hello Bazaar Authorized Dealer"}</span>
              {isApproved ? (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="bg-amber-800 text-amber-100 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Clock className="w-3 h-3" /> PENDING APPROVAL
                </span>
              )}
            </div>
            <div className="text-xs text-amber-100 hidden sm:block">
              Dealer Admin Panel • Owner: {currentUser?.fullName || currentUser?.name || "Dealer Owner"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
            <span className="hidden sm:inline">{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs font-bold gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)] w-64 ${
            isDark ? "bg-slate-900 border-r border-slate-800 text-slate-200" : "bg-amber-950 text-amber-100 border-r border-amber-900"
          } z-40 transform transition-transform duration-200 ease-in-out flex flex-col justify-between p-3 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-black uppercase text-amber-400 tracking-wider">
              Dealer Controls
            </div>
            {dealerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-amber-600 text-white shadow-md"
                      : isDark
                      ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                      : "text-amber-200/80 hover:bg-amber-900/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-amber-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-amber-900/80 px-2 text-xs text-amber-300/60 text-center font-medium">
            Hello Bazaar Multi-Vendor
          </div>
        </aside>

        {/* Main Content View with Blur Effect if Pending */}
        <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${!isApproved ? "filter blur-md pointer-events-none select-none opacity-30" : ""}`}>
          {children}
        </main>

        {/* Fixed Warning Overlay Modal for Non-GST Unapproved Dealers */}
        {!isApproved && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
                <ShieldAlert className="w-10 h-10 text-amber-500 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  WAITING FOR SUPER ADMIN APPROVAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Warning: You are not approved by Hello Bazaar yet!
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Your dealer account was registered without a GST number and is currently awaiting approval from Super Admin. The dashboard is locked until verification is complete.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={checkCurrentStatus}
                  disabled={checking}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold gap-2 py-3 px-6 rounded-xl shadow-lg"
                >
                  <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                  <span>{checking ? "Checking Status..." : "Check Approval Status"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
