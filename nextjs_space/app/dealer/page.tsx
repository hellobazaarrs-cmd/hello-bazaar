"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export default function DealerDashboardPage() {
  const { data: session } = useSession();
  const currentUser = (session as any)?.user;

  const [stats, setStats] = useState({
    totalProducts: 0,
    liveProducts: 0,
    pendingProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealerDashboard = async () => {
      try {
        const res = await fetch("/api/dealer/stats");
        const data = await res.json();
        if (res.ok) {
          setStats(data.stats || {});
          setRecentOrders(data.recentOrders || []);
        }
      } catch (e) {
        console.error("Failed to load dealer stats", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDealerDashboard();
  }, []);

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-extrabold mb-2 backdrop-blur-sm">
              <Store className="h-3.5 w-3.5" />
              <span>Dealer Admin Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.shopName || currentUser?.fullName || "Dealer"}!
            </h1>
            <p className="text-sm text-amber-100 mt-1 font-medium">
              Manage your shop products, orders, sales reports, and customer invoices from one central place.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/dealer/products">
              <Button className="bg-white text-amber-900 hover:bg-amber-50 font-bold gap-2 shadow-md">
                <PlusCircle className="h-4 w-4 text-amber-600" /> Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>My Shop Products</span>
              <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.totalProducts}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-1 flex gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.liveProducts} Live</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.pendingProducts} Pending Approval</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>My Shop Orders</span>
              <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.totalOrders}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">Total completed & pending sales</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Shop Sales Revenue</span>
              <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-900 dark:text-sky-300">{formatPrice(stats.totalRevenue)}</div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-bold pt-1">Total revenue generated</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Shop Customers</span>
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.totalCustomers}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">Customers who bought your items</div>
          </div>
        </div>

        {/* Quick Actions & Recent Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders List (2 columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span>Recent Shop Orders</span>
              </h3>
              <Link
                href="/dealer/orders"
                className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1"
              >
                View All Orders <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">Loading recent orders...</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">No orders received for your products yet.</div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">Order #{ord.id.slice(-8)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customer: {ord.customerName || "Customer"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">{formatPrice(ord.amount || 0)}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {ord.status || "PROCESSING"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dealer Quick Management Links (1 column) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Store className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span>Dealer Actions</span>
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/dealer/products"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-amber-700 dark:group-hover:text-amber-400">Manage Products</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Add, edit pricing, or update stock</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
              </Link>

              <Link
                href="/dealer/invoices"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-sky-950/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-sky-700 dark:group-hover:text-sky-400">GST Bills & Invoices</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Generate & download customer bills</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400" />
              </Link>

              <Link
                href="/dealer/customers"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Shop Customers</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">View buyers of your shop items</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DealerLayout>
  );
}
