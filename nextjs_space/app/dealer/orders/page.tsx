"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { ShoppingCart, Search, Truck, CheckCircle2, Clock, MapPin, Phone, User } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import Link from "next/link";

export default function DealerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dealer/stats");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.recentOrders || []);
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = filter === "ALL" || ord.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span>My Shop Orders & Delivery</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage orders placed by customers for products sold by your shop.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer name..."
              className="w-full pl-9 pr-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Link href="/delivery-partner" className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 justify-center">
            <Truck className="h-4 w-4" /> Open Delivery Partner App
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading shop orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No orders found for your shop items.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 sm:p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-base">Order #{ord.id}</div>
                      <div className="text-xs text-slate-400">
                        Placed on: {ord.createdAt ? new Date(ord.createdAt).toLocaleString("en-IN") : "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        {ord.status || "PROCESSING"}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">{formatPrice(ord.totalAmount || ord.amount || 0)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Customer: {ord.shippingAddress?.fullName || ord.customerName || "Customer"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ord.shippingAddress?.phone || ord.phone || "N/A"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Delivery Address</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ord.shippingAddress?.addressLine1 || ord.shippingAddress?.address || "Address details on invoice"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DealerLayout>
  );
}
