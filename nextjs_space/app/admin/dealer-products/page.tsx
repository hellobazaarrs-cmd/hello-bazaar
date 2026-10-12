"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Edit,
  Store,
  Tag,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export default function SuperAdminDealerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    brand: "",
    stockCount: "",
    description: "",
    imageUrl: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dealer-products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      } else {
        toast.error(data.error || "Failed to load dealer products");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/dealer-products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Product status updated to ${status}`);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Update failed");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/admin/dealer-products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          images: editForm.imageUrl ? [editForm.imageUrl] : editingProduct.images,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product details updated!");
        setEditingProduct(null);
        fetchProducts();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch {
      toast.error("Error updating product details");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.shopName && p.shopName.toLowerCase().includes(search.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = products.filter((p) => p.status === "PENDING_APPROVAL").length;
  const liveCount = products.filter((p) => p.status === "LIVE" || !p.status).length;
  const declinedCount = products.filter((p) => p.status === "DECLINED").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              <span>Dealer Products Approval Center</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">
              Review, edit, and approve dealer uploaded products before publishing live on Hello Bazaar.
            </p>
          </div>
          <Button
            onClick={fetchProducts}
            variant="outline"
            size="sm"
            className="gap-2 font-bold bg-white dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Dealer Products</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{products.length}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/30 shadow-sm">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Pending Approval</span>
            </div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">{pendingCount}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Live Products</span>
            </div>
            <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">{liveCount}</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-300 dark:border-rose-700/60 bg-rose-50/50 dark:bg-rose-950/30 shadow-sm">
            <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>Declined Products</span>
            </div>
            <div className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">{declinedCount}</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product by name, dealer shop, or brand..."
              className="w-full pl-9 pr-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Products</option>
            <option value="PENDING_APPROVAL">Pending Approval Only</option>
            <option value="LIVE">Live Products Only</option>
            <option value="DECLINED">Declined Products Only</option>
          </select>
        </div>

        {/* Products Grid with 1:1 Aspect Square Mobile Image Container */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading Dealer Products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No dealer products found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all p-4 space-y-4"
              >
                {/* Product Header & Status */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate">
                      <Store className="h-3.5 w-3.5 shrink-0" />
                      <span>{prod.shopName || "Dealer Shop"}</span>
                    </span>

                    {prod.status === "PENDING_APPROVAL" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse shrink-0">
                        PENDING APPROVAL
                      </span>
                    )}
                    {prod.status === "LIVE" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shrink-0">
                        LIVE
                      </span>
                    )}
                    {prod.status === "DECLINED" && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shrink-0">
                        DECLINED
                      </span>
                    )}
                  </div>

                  {/* 1:1 Aspect Square Image Preview Container for Perfect Mobile Display */}
                  <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <img
                      src={Array.isArray(prod.images) ? prod.images[0] : "/logo.jpg"}
                      alt={prod.name}
                      className="w-full h-full object-contain max-h-full max-w-full rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base line-clamp-2">{prod.name}</h3>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(prod.price)}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Stock: {prod.stockCount || 10}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {prod.status !== "LIVE" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(prod.id, "LIVE")}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-9 gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve Live
                    </Button>
                  )}

                  {prod.status !== "DECLINED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(prod.id, "DECLINED")}
                      className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs h-9"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Decline
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingProduct(prod);
                      setEditForm({
                        name: prod.name || "",
                        price: String(prod.price || ""),
                        originalPrice: String(prod.originalPrice || ""),
                        brand: prod.brand || "",
                        stockCount: String(prod.stockCount || "10"),
                        description: prod.description || "",
                        imageUrl: Array.isArray(prod.images) ? prod.images[0] : "",
                      });
                    }}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-xs h-9 px-2.5"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal with 1:1 Aspect Square Mobile Image Container */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>Edit Product: {editingProduct.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                {/* 1:1 Aspect Square Mobile Image Container */}
                <div className="w-full aspect-square max-w-[220px] mx-auto bg-slate-100 dark:bg-slate-800 rounded-xl p-2 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={editForm.imageUrl || (Array.isArray(editingProduct.images) ? editingProduct.images[0] : "/logo.jpg")}
                    alt="Preview"
                    className="w-full h-full object-contain max-h-full max-w-full rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Stock Count</label>
                    <input
                      type="number"
                      value={editForm.stockCount}
                      onChange={(e) => setEditForm({ ...editForm, stockCount: e.target.value })}
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditingProduct(null)} className="dark:border-slate-700 dark:text-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    Save Changes & Approve
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
