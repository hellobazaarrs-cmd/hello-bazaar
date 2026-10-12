"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { Ticket, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DealerCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch("/api/admin/coupons");
        const data = await res.json();
        if (res.ok) {
          setCoupons(Array.isArray(data) ? data : data.coupons || []);
        }
      } catch {
        toast.error("Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span>Shop Offers & Discount Coupons</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage discount codes and promo offers for your shop products.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          {loading ? (
            <div className="text-center text-slate-500 dark:text-slate-400 font-medium">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 font-medium">No active shop coupons.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 space-y-2">
                  <div className="font-black text-amber-900 dark:text-amber-300 text-lg tracking-wider font-mono">{c.code}</div>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">{c.discountPercent || c.value}% OFF</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Min Order: ₹{c.minOrderAmount || c.minOrder || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DealerLayout>
  );
}
