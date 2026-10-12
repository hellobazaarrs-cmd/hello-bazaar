"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Phone,
  MapPin,
  Search,
  CheckCircle,
  KeyRound,
  Package,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Navigation,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface Task {
  id: string;
  orderNumber: string;
  status: string;
  type: "DELIVERY" | "RETURN_PICKUP";
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryOtp?: string | null;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  address: string;
  city: string;
  pincode: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    color?: string;
  }[];
}

export default function DeliveryPartnerClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"ALL" | "DELIVERY" | "RETURN_PICKUP">("ALL");

  // OTP Verification state
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("hello_bazaar_delivery_auth");
      if (saved === "true") {
        setIsAuthenticated(true);
        fetchTasks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const clean = passcode.trim();
    if (clean === "12211221" || clean.toLowerCase() === "hellobazaar") {
      try {
        sessionStorage.setItem("hello_bazaar_delivery_auth", "true");
      } catch (e) {}
      setIsAuthenticated(true);
      toast.success("Welcome, Hello Bazaar Delivery Partner!");
      fetchTasks();
    } else {
      setAuthError("Incorrect Security Passcode. Access Denied.");
      toast.error("Incorrect passcode!");
    }
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem("hello_bazaar_delivery_auth");
    } catch (e) {}
    setIsAuthenticated(false);
    setPasscode("");
    toast.success("Portal Locked Successfully");
  };

  const handleResendOtp = async (task: Task) => {
    setResendingId(task.id);
    try {
      const res = await fetch("/api/delivery-partner/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: task.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      toast.success(data.message || "OTP push notification sent to customer!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setResendingId(null);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/delivery-partner/orders");
      if (!res.ok) throw new Error("Failed to fetch delivery tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      toast.error(err.message || "Error loading delivery tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInputChange = (orderId: string, val: string) => {
    // Only allow max 4 digits numeric
    const clean = val.replace(/\D/g, "").slice(0, 4);
    setOtpInputs((prev) => ({ ...prev, [orderId]: clean }));
  };

  const handleVerifyOtp = async (task: Task) => {
    const enteredOtp = otpInputs[task.id];
    if (!enteredOtp || enteredOtp.length !== 4) {
      toast.error("Please enter complete 4-digit OTP provided by customer.");
      return;
    }

    setVerifyingId(task.id);
    try {
      const res = await fetch("/api/delivery-partner/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: task.id, otp: enteredOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "OTP verification failed");
      }

      toast.success(data.message || "OTP Verified Successfully!");
      setOtpInputs((prev) => ({ ...prev, [task.id]: "" }));
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.phone.includes(search) ||
      t.address.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      tabFilter === "ALL" ? true : tabFilter === "DELIVERY" ? t.type === "DELIVERY" : t.type === "RETURN_PICKUP";

    return matchesSearch && matchesTab;
  });

  const forwardCount = tasks.filter((t) => t.type === "DELIVERY" && t.status !== "DELIVERED").length;
  const returnCount = tasks.filter((t) => t.type === "RETURN_PICKUP" && t.status !== "RETURN_PICKED_UP").length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/25 text-white">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Hello Bazaar</h1>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Delivery Partner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Authorized Delivery Partner Security Passcode Gate
              </p>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3.5 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              This portal is restricted to authorized Hello Bazaar delivery partners. Enter the assigned security passcode to access delivery tasks.
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-3.5 flex items-center gap-2 text-red-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Enter Security Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  placeholder="Enter passcode (12211221)"
                  className="w-full bg-slate-950 text-sm font-semibold rounded-2xl pl-4 pr-11 py-3 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-all tracking-wider"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" /> Unlock Delivery Portal
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link
              href="/home"
              className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 font-medium"
            >
              ← Back to Store
            </Link>
            <a
              href="/downloads/hello-bazaar-delivery-partner.apk"
              download="hello-bazaar-delivery-partner.apk"
              className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
            >
              Download APK
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 pt-12 sm:pt-6 pb-24">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="max-w-[1100px] mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">Hello Bazaar</h1>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Delivery Partner App
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">OTP Verified Order Delivery & Return Pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchTasks}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} /> Refresh
            </button>
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 rounded-xl border border-red-500/30 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Lock
            </button>
            <Link
              href="/home"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl border border-slate-700 transition-all hidden sm:inline-flex items-center"
            >
              Store
            </Link>
          </div>
        </div>

        {/* COUNTER CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-400">Out For Delivery</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{forwardCount} Tasks</div>
            </div>
            <div className="p-2 sm:p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-400">Return Pickups</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{returnCount} Pickups</div>
            </div>
            <div className="p-2 sm:p-2.5 bg-purple-500/10 rounded-xl text-purple-400 shrink-0">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & TAB FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Order #, Name, Mobile, Address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 text-xs font-semibold rounded-2xl pl-10 pr-4 py-3 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => setTabFilter("ALL")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tabFilter === "ALL" ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setTabFilter("DELIVERY")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tabFilter === "DELIVERY" ? "bg-cyan-500 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Deliveries ({tasks.filter((t) => t.type === "DELIVERY").length})
            </button>
            <button
              onClick={() => setTabFilter("RETURN_PICKUP")}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tabFilter === "RETURN_PICKUP" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              Returns ({tasks.filter((t) => t.type === "RETURN_PICKUP").length})
            </button>
          </div>
        </div>

        {/* TASK LIST */}
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800/80 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Loading delivery tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800/80 space-y-3 p-6">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-sm font-bold text-white">No Assigned Tasks Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All orders ready for delivery or return pickup will appear here with customer details and OTP verification box.
              </p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isDone = t.status === "DELIVERED" || t.status === "RETURN_ACCEPTED";
              const isReturn = t.type === "RETURN_PICKUP";

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900 rounded-2xl sm:rounded-3xl border p-4 sm:p-5 space-y-4 transition-all shadow-xl ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-950/10 opacity-80"
                      : isReturn
                      ? "border-purple-500/30 hover:border-purple-500/60"
                      : "border-slate-800 hover:border-cyan-500/50"
                  }`}
                >
                  {/* TASK TOP HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] sm:text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20 shrink-0">
                        #{t.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                          isReturn
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        }`}
                      >
                        {isReturn ? "🔄 Return Pickup" : "📦 Forward Delivery"}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] sm:text-xs font-extrabold px-3 py-1 rounded-xl border shrink-0 ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* CUSTOMER DETAILS & QUICK ACTIONS */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Customer Contact</div>
                      <div className="text-sm font-bold text-white">{t.customer.name}</div>
                      <div className="flex items-center gap-2 pt-1">
                        {t.customer.phone && (
                          <a
                            href={`tel:${t.customer.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Customer
                          </a>
                        )}
                        <a
                          href={(t as any).latitude && (t as any).longitude ? `https://www.google.com/maps/search/?api=1&query=${(t as any).latitude},${(t as any).longitude}` : `https://maps.google.com/?q=${encodeURIComponent(t.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-xl border border-cyan-500/30 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Navigate via Google Maps
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                      <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Delivery Address
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">{t.address}</p>
                    </div>
                  </div>

                  {/* ITEMS SUMMARY & PAYMENT INFO */}
                  <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold">
                        Package Content ({t.items.length} items):
                      </div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {t.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(", ")}
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Payment Collection</div>
                      <div className="text-sm font-black text-emerald-400">
                        ₹{t.total.toLocaleString("en-IN")}{" "}
                        <span className="text-[11px] text-slate-300 font-normal">({t.paymentMethod})</span>
                      </div>
                    </div>
                  </div>

                  {/* OTP VERIFICATION SECTION */}
                  {!isDone ? (
                    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" /> Enter Customer 4-Digit OTP to Complete Task
                        </label>
                        <button
                          onClick={() => handleResendOtp(t)}
                          disabled={resendingId === t.id}
                          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          📲 Resend OTP Push
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Enter 4-Digit OTP (e.g. 4927)"
                            value={otpInputs[t.id] || ""}
                            onChange={(e) => handleOtpInputChange(t.id, e.target.value)}
                            className="w-full bg-slate-950 text-base font-mono font-bold rounded-xl pl-9 pr-3 py-2.5 border border-cyan-500/40 text-cyan-300 placeholder-slate-600 outline-none focus:border-cyan-400 tracking-widest text-center"
                          />
                        </div>

                        <button
                          onClick={() => handleVerifyOtp(t)}
                          disabled={verifyingId === t.id || (otpInputs[t.id] || "").length !== 4}
                          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                        >
                          {verifyingId === t.id ? (
                            "Verifying..."
                          ) : (
                            <>
                              Verify & Complete <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle className="w-4 h-4" /> Task Completed & Verified via 4-Digit Customer OTP
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
