"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Package,
  ShoppingCart,
  Edit,
  ShieldCheck,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export default function SuperAdminDealersPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingDealer, setEditingDealer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ gstNumber: "", phone: "", shopName: "", shopAddress: "" });

  const fetchDealers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dealers");
      const data = await res.json();
      if (res.ok) {
        setDealers(data.dealers || []);
      } else {
        toast.error(data.error || "Failed to load dealers");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/dealers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Dealer status updated to ${status}`);
        fetchDealers();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Update failed");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDealer) return;
    try {
      const res = await fetch(`/api/admin/dealers/${editingDealer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Dealer details updated!");
        setEditingDealer(null);
        fetchDealers();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Error updating dealer details");
    }
  };

  const filteredDealers = dealers.filter((d) => {
    const matchesSearch =
      d.shopName.toLowerCase().includes(search.toLowerCase()) ||
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      (d.gstNumber && d.gstNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSalesRevenue = dealers.reduce((acc, d) => acc + (d.metrics?.totalSalesRevenue || 0), 0);
  const pendingCount = dealers.filter((d) => d.status === "PENDING").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Store className="h-7 w-7 text-sky-600 dark:text-sky-400" />
              <span>Dealers Management</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">
              Monitor dealer sales, GST verification, approve pending accounts, and manage dealer access.
            </p>
          </div>
          <Button onClick={fetchDealers} variant="outline" size="sm" className="gap-2 font-bold bg-white dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Registered Dealers</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{dealers.length}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Active Authorized Dealers</span>
            </div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
              {dealers.filter((d) => d.status !== "SUSPENDED").length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm">
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>GST Verified Dealers</span>
            </div>
            <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">
              {dealers.filter((d) => Boolean(d.gstNumber)).length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-sky-300 dark:border-sky-700/60 bg-sky-50/50 dark:bg-sky-950/30 shadow-sm">
            <div className="text-xs font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Total Wholesale Volume</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-900 dark:text-sky-200 mt-1">{formatPrice(totalSalesRevenue)}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by shop name, owner, phone, or GST number..."
              className="w-full pl-9 pr-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Dealers</option>
            <option value="APPROVED">Active Dealers</option>
            <option value="SUSPENDED">Suspended Dealers</option>
          </select>
        </div>

        {/* Dealers Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Dealers Data...</div>
          ) : filteredDealers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No dealers found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Shop & Owner Details</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">GST Number</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Sales & Products</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {filteredDealers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-base">{d.shopName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>Owner: {d.fullName}</span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]">{d.shopAddress}</div>
                      </td>

                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                          <Phone className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          <span>{d.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{d.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {d.gstNumber ? (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            {d.gstNumber}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            GST Not Provided
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {d.status === "SUSPENDED" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                          <Package className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Wholesale Items: {d.metrics?.totalProducts || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                          <ShoppingCart className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Orders: {d.metrics?.totalOrders || 0}</span>
                        </div>
                        <div className="font-extrabold text-sky-700 dark:text-sky-300">
                          Purchases: {formatPrice(d.metrics?.totalSalesRevenue || 0)}
                        </div>
                      </td>

                      <td className="p-4 text-right space-x-1">
                        {d.status === "SUSPENDED" ? (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(d.id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 h-8"
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(d.id, "SUSPENDED")}
                            className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold px-3 py-1 h-8"
                          >
                            Suspend
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDealer(d);
                            setEditForm({
                              gstNumber: d.gstNumber || "",
                              phone: d.phone || "",
                              shopName: d.shopName || "",
                              shopAddress: d.shopAddress || "",
                            });
                          }}
                          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold px-2 py-1 h-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingDealer && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <span>Edit Dealer Info: {editingDealer.shopName}</span>
              </h3>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.shopName}
                    onChange={(e) => setEditForm({ ...editForm, shopName: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">GST Number</label>
                  <input
                    type="text"
                    value={editForm.gstNumber}
                    onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="Enter GST Number or leave empty"
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Shop Address</label>
                  <input
                    type="text"
                    required
                    value={editForm.shopAddress}
                    onChange={(e) => setEditForm({ ...editForm, shopAddress: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex gap-2 pt-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingDealer(null)} className="dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
