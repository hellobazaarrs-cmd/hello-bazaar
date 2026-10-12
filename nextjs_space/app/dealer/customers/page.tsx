"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { Users, Search, Phone, Mail, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function DealerCustomersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/dealer/stats");
        const data = await res.json();
        if (res.ok) {
          setOrders(data.recentOrders || []);
        }
      } catch {
        toast.error("Failed to load shop customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const customersMap = new Map();
  orders.forEach((ord) => {
    const name = ord.shippingAddress?.fullName || ord.customerName || "Customer";
    const phone = ord.shippingAddress?.phone || ord.phone || "N/A";
    const key = phone !== "N/A" ? phone : name;
    if (!customersMap.has(key)) {
      customersMap.set(key, { name, phone, email: ord.customerEmail || "N/A", ordersCount: 1 });
    } else {
      const existing = customersMap.get(key);
      existing.ordersCount += 1;
    }
  });

  const customersList = Array.from(customersMap.values());
  const filtered = customersList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span>Shop Customers</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            List of customers who purchased products from your shop.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading shop customers...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No customer purchases recorded for your shop yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.map((cust, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-900 dark:text-white">{cust.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-amber-600 dark:text-amber-400" /> {cust.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {cust.email}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 rounded-full font-bold text-xs flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> {cust.ordersCount} Orders
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DealerLayout>
  );
}
