"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Package,
  Users,
  ShoppingBag,
  IndianRupee,
  Truck,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  ShieldCheck,
  Download,
  Store,
} from "lucide-react";
import { formatRupees } from "@/lib/format";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const COLORS = ["#60B5FF", "#FF9149", "#FF9898", "#FF90BB", "#80D8C3", "#A19AD3"];

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalDealers?: number;
  pendingDealers?: number;
  recentOrders: any[];
  dailyRevenue: { date: string; revenue: number }[];
  categoryStats: { name: string; count: number }[];
  topProducts: any[];
}

import { DeliveryDownloadModal } from "@/components/delivery-download-modal";

export default function DashboardClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [showDeliveryPassword, setShowDeliveryPassword] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to theme changes
  useEffect(() => {
    const checkDark = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("admin-theme") !== "light";
      setIsDark(dark);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Theme-aware colors
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const cardShadow = isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const tableBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const chartTickColor = isDark ? "#94a3b8" : "#64748b";

  if (!mounted || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Page Title skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 rounded" style={{ background: isDark ? "#334155" : "#cbd5e1" }} />
          <div className="h-4 w-64 rounded" style={{ background: isDark ? "#1e293b" : "#e2e8f0" }} />
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-2xl border" style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="w-12 h-12 rounded-xl mb-3" style={{ background: isDark ? "#334155" : "#cbd5e1" }} />
              <div className="h-3 w-16 rounded mb-2" style={{ background: isDark ? "#1e293b" : "#e2e8f0" }} />
              <div className="h-6 w-24 rounded" style={{ background: isDark ? "#334155" : "#cbd5e1" }} />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl border h-80" style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="h-5 w-40 rounded mb-6" style={{ background: isDark ? "#334155" : "#cbd5e1" }} />
              <div className="w-full h-56 rounded" style={{ background: isDark ? "#1e293b" : "#f1f5f9" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Revenue",
      value: formatRupees(stats?.totalRevenue ?? 0),
      icon: IndianRupee,
      color: "from-emerald-400 to-teal-600",
    },
    {
      label: "Total Orders",
      value: String(stats?.totalOrders ?? 0),
      icon: ShoppingBag,
      color: "from-cyan-400 to-blue-600",
    },
    {
      label: "Products",
      value: String(stats?.totalProducts ?? 0),
      icon: Package,
      color: "from-purple-400 to-pink-600",
    },
    {
      label: "B2B Dealers",
      value: String(stats?.totalDealers ?? stats?.totalCustomers ?? 0),
      icon: Store,
      color: "from-amber-400 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: textPrimary }}>Hello Bazaar Super Admin</h1>
        <p style={{ color: textSecondary, marginTop: 4 }}>B2B Wholesale Portal Management & Dealer Oversight</p>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards?.map((card, i) => {
          const Icon = card?.icon;
          return (
            <motion.div
              key={card?.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: cardBg,
                borderRadius: 16,
                padding: 20,
                border: `1px solid ${cardBorder}`,
                boxShadow: cardShadow,
                transition: "background 0.3s, border 0.3s",
              }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card?.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div style={{ fontSize: 11, color: textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>
                {card?.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginTop: 4 }}>
                {card?.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp style={{ width: 18, height: 18, color: "#22d3ee" }} />
            Revenue (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.dailyRevenue ?? []}>
                <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: chartTickColor }} />
                <YAxis tickLine={false} tick={{ fontSize: 10, fill: chartTickColor }} tickFormatter={(v: number) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: textPrimary }}
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#60B5FF" strokeWidth={2.5} dot={{ r: 3, fill: "#60B5FF" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
            <Package style={{ width: 18, height: 18, color: "#22d3ee" }} />
            Products by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11, color: textSecondary }} />
                <Pie data={stats?.categoryStats ?? []} dataKey="count" nameKey="name" cx="50%" cy="55%" outerRadius={70}>
                  {(stats?.categoryStats ?? [])?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS?.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, color: textPrimary }}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${tableBorder}`, boxShadow: cardShadow }}
      >
        <h3 style={{ fontWeight: 700, marginBottom: 16, color: textPrimary, fontSize: 16 }}>Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <th style={{ textAlign: "left", paddingBottom: 12, paddingTop: 4, color: textSecondary, fontWeight: 600, fontSize: 12 }}>Order #</th>
                <th style={{ textAlign: "left", paddingBottom: 12, paddingTop: 4, color: textSecondary, fontWeight: 600, fontSize: 12 }}>Customer</th>
                <th style={{ textAlign: "left", paddingBottom: 12, paddingTop: 4, color: textSecondary, fontWeight: 600, fontSize: 12 }}>Status</th>
                <th style={{ textAlign: "right", paddingBottom: 12, paddingTop: 4, color: textSecondary, fontWeight: 600, fontSize: 12 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders ?? [])?.map((order: any) => (
                <tr key={order?.id} style={{ borderBottom: `1px solid ${tableBorder}` }}>
                  <td style={{ paddingTop: 12, paddingBottom: 12, fontFamily: "monospace", fontSize: 12, color: textPrimary }}>{order?.orderNumber}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, color: textPrimary }}>{order?.user?.name ?? "-"}</td>
                  <td style={{ paddingTop: 12, paddingBottom: 12 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(6,182,212,0.12)", color: "#22d3ee", fontSize: 11, fontWeight: 600 }}>
                      {order?.status?.replace?.(/_/g, " ") ?? "-"}
                    </span>
                  </td>
                  <td style={{ paddingTop: 12, paddingBottom: 12, textAlign: "right", fontWeight: 700, color: textPrimary }}>
                    {formatRupees(order?.total ?? 0)}
                  </td>
                </tr>
              ))}
              {(stats?.recentOrders ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ paddingTop: 24, paddingBottom: 24, textAlign: "center", color: textSecondary }}>
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* DELIVERY PARTNER APP SECURITY PASSWORD CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: cardBg,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${tableBorder}`,
          boxShadow: cardShadow,
        }}
        className="space-y-4"
      >
        <Toaster position="top-right" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: tableBorder }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base" style={{ color: textPrimary }}>
                  Delivery Partner App Download Security
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Password Protected
                </span>
              </div>
              <p className="text-xs" style={{ color: textSecondary }}>
                Restricted APK Download Password for Hello Bazaar Delivery Partner App
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
          >
            <Download className="w-4 h-4" /> Download Delivery APK
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-center">
          <div className="p-4 rounded-2xl border bg-slate-900/50 space-y-2" style={{ borderColor: tableBorder }}>
            <div className="text-xs font-bold flex items-center justify-between" style={{ color: textSecondary }}>
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" /> App Security Password
              </span>
              <button
                onClick={() => setShowDeliveryPassword(!showDeliveryPassword)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg transition-colors"
              >
                {showDeliveryPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDeliveryPassword ? "Hide Password" : "Show Password"}
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="font-mono text-lg font-black text-cyan-300 tracking-wider">
                {showDeliveryPassword ? "HelloBazaar" : "••••••••••••"}
              </span>

              <button
                onClick={() => {
                  navigator.clipboard.writeText("HelloBazaar");
                  toast.success("Password 'HelloBazaar' copied to clipboard!");
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Password"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-cyan-500/5 space-y-1.5" style={{ borderColor: "rgba(6,182,212,0.2)" }}>
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Security Note for Admin
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Delivery executives will be prompted for this security password (<b>HelloBazaar</b>) when downloading the APK from the website. Click <b>Show Password</b> above to view or verify.
            </p>
          </div>
        </div>
      </motion.div>

      <DeliveryDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}
