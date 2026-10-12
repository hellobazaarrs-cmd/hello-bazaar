"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Activity,
  Search,
  Filter,
  Users,
  Store,
  Clock,
  Package,
  ShoppingCart,
  ShieldCheck,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, dealers: 0, customers: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "DEALER" | "CUSTOMER">("ALL");
  const [search, setSearch] = useState("");

  const fetchActivities = async (type = filterType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activities?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        setActivities(data.activities || []);
        setCounts(data.counts || { total: 0, dealers: 0, customers: 0 });
      }
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(filterType);
  }, [filterType]);

  const filtered = activities.filter(
    (act) =>
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.description.toLowerCase().includes(search.toLowerCase()) ||
      (act.user?.name && act.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (act.user?.shopName && act.user.shopName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-7 w-7 text-sky-600 dark:text-sky-400" />
              <span>Dealers & Users Activity Monitoring Log</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Real-time audit trail monitoring all actions performed by Dealers and Customers across Hello Bazaar.
            </p>
          </div>

          <Button
            onClick={() => fetchActivities(filterType)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold gap-2 shadow-md shrink-0"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Audit Trail
          </Button>
        </div>

        {/* Activity Filter Buttons */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              filterType === "ALL"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>All Activities ({counts.total})</span>
          </button>

          <button
            onClick={() => setFilterType("DEALER")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              filterType === "DEALER"
                ? "bg-amber-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>Dealers Activities</span>
          </button>

          <button
            onClick={() => setFilterType("CUSTOMER")}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              filterType === "CUSTOMER"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Wholesale Buyers Activities</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity by shop name, user, or action..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Activity List Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No activity records found matching filter.</div>
          ) : (
            <div className="space-y-4">
              {filtered.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${
                        act.type === "DEALER"
                          ? "bg-amber-600"
                          : act.type === "CUSTOMER"
                          ? "bg-emerald-600"
                          : "bg-purple-600"
                      }`}
                    >
                      {act.type === "DEALER" ? <Store className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 dark:text-white text-base">{act.title}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            act.type === "DEALER"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300"
                              : "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300"
                          }`}
                        >
                          {act.type} • {act.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{act.timestamp ? new Date(act.timestamp).toLocaleString("en-IN") : "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
