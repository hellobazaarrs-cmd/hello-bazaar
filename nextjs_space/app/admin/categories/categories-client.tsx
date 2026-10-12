"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  Upload,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Watch,
  Refrigerator,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Watch,
  Refrigerator,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  description?: string | null;
  _count?: { products?: number };
}

export default function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    icon: "Smartphone",
    image: "",
    description: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data?.categories ?? []);
      } else {
        toast.error(data?.error || "Failed to load categories");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      icon: "Smartphone",
      image: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      icon: c.icon || "Smartphone",
      image: c.image || "",
      description: c.description || "",
    });
    setShowModal(true);
  };

  // Robust file upload handling with instant base64 preview + API upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file must be smaller than 10MB");
      return;
    }

    setUploading(true);

    // 1. Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target?.result as string;
      if (base64Data) {
        setForm((prev) => ({
          ...prev,
          image: base64Data,
        }));
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to server/Cloudinary
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
          image: uploadedUrl,
        }));
        toast.success("Logo uploaded successfully!");
      } else {
        // If server upload had an issue, keep the base64 preview which can also be saved
        toast.info("Logo captured and ready to save!");
      }
    } catch {
      toast.info("Logo captured and ready to save!");
    } finally {
      setUploading(false);
      // Reset input values so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug:
        form.slug.trim() ||
        form.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      icon: form.icon || "Smartphone",
      image: form.image.trim() || null,
      description: form.description.trim() || null,
    };

    try {
      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          editing ? "Category & Logo updated successfully!" : "Category created successfully!"
        );
        setShowModal(false);
        setEditing(null);
        loadCategories();
      } else {
        toast.error(data?.error || "Failed to save category");
      }
    } catch {
      toast.error("Error saving category");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Category "${name}" deleted`);
        loadCategories();
      } else {
        toast.error(data?.error || "Cannot delete category with active products");
      }
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Hidden file inputs for Camera and File Manager */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-sm">
              <Tag className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Categories &amp; Logos Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1.5 max-w-2xl">
            Upload custom brand logos or images for each category (Mobiles, Laptops, TV, Audio, Accessories, etc.). High-contrast logos automatically fit nicely in light and dark modes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="flex-1 sm:flex-initial gap-2 border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={openCreateModal}
            className="flex-1 sm:flex-initial gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Categories Found</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto mt-1 mb-6">
            Add your product categories with custom logos to organize your store.
          </p>
          <Button onClick={openCreateModal} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold shadow-md">
            <Plus className="w-4 h-4" /> Add First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const Icon = iconMap[c.icon || ""] || Tag;
            const hasCustomLogo = Boolean(c.image);

            return (
              <div
                key={c.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Logo Box & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* High-Contrast Logo Container (Clean white background so black/transparent/colored logos ALWAYS show clearly) */}
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 dark:border-slate-300 p-2 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {hasCustomLogo ? (
                        <img
                          src={c.image!}
                          alt={c.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                        />
                      ) : (
                        <Icon className="w-8 h-8 text-indigo-600" />
                      )}
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        title="Edit Category & Logo"
                        className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 transition-colors shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        title="Delete Category"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/80 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Name & Slug */}
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                      {c.name}
                    </h3>
                    <div className="pt-0.5">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block truncate max-w-full">
                        slug: {c.slug}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 pt-1 font-medium leading-relaxed">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: Logo Status & Product Count */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      hasCustomLogo
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {hasCustomLogo ? "Custom Logo" : "Default Icon"}
                  </span>

                  <span className="text-xs font-black text-indigo-600 dark:text-sky-300">
                    {c._count?.products ?? 0} Products
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <span>{editing ? "Edit Category & Logo" : "Add New Category"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Category Name */}
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1 uppercase tracking-wider">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mobiles, Laptops, TV, Accessories, Audio..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 2. Custom Category Logo Upload (Camera + File Manager + URL) */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block uppercase tracking-wider">
                  Category Logo / Image (Camera, Gallery, File Manager or URL)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Logo Preview Box */}
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                        <ImageIcon className="w-7 h-7 text-slate-400 mb-1" />
                        <span className="text-[9px] font-bold">No Logo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Options Buttons */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Button 1: Camera (Take Photo) */}
                      <Button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl shadow-sm"
                      >
                        <Camera className="w-4 h-4 shrink-0" />
                        <span>Take Photo</span>
                      </Button>

                      {/* Button 2: File Manager / Device Browse */}
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 rounded-xl shadow-sm"
                      >
                        <FolderOpen className="w-4 h-4 shrink-0" />
                        <span>Choose File</span>
                      </Button>
                    </div>

                    {/* Image URL Input & Remove Option */}
                    <div className="flex items-center gap-2 pt-1">
                      <div className="relative flex-1">
                        <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Or paste image URL directly..."
                          value={form.image}
                          onChange={(e) => setForm({ ...form, image: e.target.value })}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image: "" })}
                          className="text-xs px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-bold shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {uploading && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading image to server...</span>
                  </p>
                )}
              </div>

              {/* 3. Slug */}
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1 uppercase tracking-wider">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. smartphones, laptops, televisions, accessories"
                  className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* 4. Fallback Icon */}
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1 uppercase tracking-wider">
                  Default Icon (Fallback if no custom logo is added)
                </label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Smartphone">📱 Smartphone / Mobile</option>
                  <option value="Laptop">💻 Laptop / PC</option>
                  <option value="Tv">📺 Television / TV</option>
                  <option value="Headphones">🎧 Audio / Headphones</option>
                  <option value="Watch">⌚ Smartwatch / Accessories</option>
                  <option value="Refrigerator">❄️ Refrigerator / Home Appliances</option>
                </select>
              </div>

              {/* 5. Description */}
              <div>
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the category..."
                  className="w-full px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md">
                  {editing ? "Save Category & Logo" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
