"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    logo: "",
    sortOrder: "0",
    isActive: true,
  });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();
      if (res.ok) {
        setBrands(data.brands || []);
      } else {
        toast.error(data.error || "Failed to load brands");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && (data.url || data.urls?.[0])) {
        const uploadedUrl = data.url || data.urls[0];
        setForm((prev) => ({
          ...prev,
          logo: uploadedUrl,
        }));
        toast.success("Brand logo uploaded successfully!");
      } else {
        toast.error(data.error || "Logo upload failed");
      }
    } catch {
      toast.error("Error uploading brand logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    try {
      const method = editingBrand ? "PUT" : "POST";
      const payload = {
        ...(editingBrand ? { id: editingBrand.id } : {}),
        name: form.name.trim(),
        logo: form.logo.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      const res = await fetch("/api/admin/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingBrand ? "Brand updated successfully!" : "Brand created successfully!");
        setShowModal(false);
        setEditingBrand(null);
        setForm({ name: "", logo: "", sortOrder: "0", isActive: true });
        fetchBrands();
      } else {
        toast.error(data.error || "Failed to save brand");
      }
    } catch {
      toast.error("An error occurred while saving brand");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Brand "${name}" deleted`);
        fetchBrands();
      } else {
        toast.error(data.error || "Failed to delete brand");
      }
    } catch {
      toast.error("Error deleting brand");
    }
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setForm({
      name: "",
      logo: "",
      sortOrder: String(brands.length + 1),
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (b: any) => {
    setEditingBrand(b);
    setForm({
      name: b.name || "",
      logo: b.logo || "",
      sortOrder: String(b.sortOrder ?? 0),
      isActive: b.isActive !== false,
    });
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Top Brands Management</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Add brand logos (Samsung, Apple, Xiaomi, Vivo, etc.) that appear in the &quot;Top Brands&quot; section on the home page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBrands}
              className="gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={openCreateModal}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add New Brand
            </Button>
          </div>
        </div>

        {/* Brands List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-slate-500 font-medium">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Brands Added Yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              The &quot;Top Brands&quot; section on the homepage is currently blank. Upload your first brand logo to display it on the store.
            </p>
            <Button onClick={openCreateModal} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              Add First Brand
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {brands.map((b) => (
              <div
                key={b.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all flex flex-col items-center justify-between text-center"
              >
                {/* Status Badge */}
                <span
                  className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    b.isActive !== false
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {b.isActive !== false ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                  {b.isActive !== false ? "Active" : "Inactive"}
                </span>

                {/* Logo Box */}
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-center p-2 mb-3 mt-3 border border-slate-100 dark:border-slate-700/50">
                  {b.logo ? (
                    <img
                      src={b.logo}
                      alt={b.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                    />
                  ) : (
                    <span className="text-xl font-black text-slate-400 uppercase tracking-wider">
                      {b.name.slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Name & Order */}
                <div className="w-full mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{b.name}</h4>
                  <p className="text-[11px] text-slate-400">Order: {b.sortOrder ?? 0}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEditModal(b)}
                    className="flex-1 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBrand ? "Edit Brand" : "Add New Brand"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samsung, Apple, Xiaomi, Vivo..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Brand Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {form.logo ? (
                        <img src={form.logo} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? "Uploading..." : "Upload Logo Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste Logo Image URL"
                        value={form.logo}
                        onChange={(e) => setForm({ ...form, logo: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      Active on Store
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700">
                    {editingBrand ? "Update Brand" : "Create Brand"}
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
