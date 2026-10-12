"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import {
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export default function DealerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    originalPrice: "",
    categoryId: "",
    brand: "",
    description: "",
    imageUrl: "",
    stockCount: "10",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/dealer/products"),
        fetch("/api/categories"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodRes.ok) setProducts(prodData.products || []);
      if (catRes.ok) {
        const cats = Array.isArray(catData) ? catData : catData.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !form.categoryId) {
          setForm((p) => ({ ...p, categoryId: cats[0].id }));
        }
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setForm((p) => ({ ...p, imageUrl: data.url }));
        toast.success("Product image uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch {
      toast.error("Image upload error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      price: "",
      originalPrice: "",
      categoryId: categories[0]?.id || "",
      brand: "",
      description: "",
      imageUrl: "",
      stockCount: "10",
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (prod: any) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name || "",
      price: String(prod.price || ""),
      originalPrice: String(prod.originalPrice || ""),
      categoryId: prod.categoryId || categories[0]?.id || "",
      brand: prod.brand || "",
      description: prod.description || "",
      imageUrl: Array.isArray(prod.images) ? prod.images[0] : prod.imageUrl || "",
      stockCount: String(prod.stockCount || "10"),
    });
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shop product?")) return;
    try {
      const res = await fetch(`/api/dealer/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Product deleted successfully");
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete product");
      }
    } catch {
      toast.error("Error deleting product");
    }
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Product name, price, and category are required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingProduct
        ? `/api/dealer/products/${editingProduct.id}`
        : "/api/dealer/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: [form.imageUrl || "/logo.jpg"],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Product saved successfully!");
        setShowAddModal(false);
        setEditingProduct(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save product");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              <span>My Shop Products & Inventory</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Upload and manage products on Hello Bazaar. Edited or new products will be verified by Super Admin before going live.
            </p>
          </div>

          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-md shrink-0"
          >
            <PlusCircle className="h-4 w-4" /> Upload New Product
          </Button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or brand..."
              className="w-full pl-9 pr-3 py-2 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={fetchData}
            className="gap-2 font-bold text-xs shrink-0 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh List
          </Button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium">
            Loading your shop products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 font-medium space-y-3">
            <Package className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <div>No products found in your shop inventory.</div>
            <Button
              onClick={handleOpenAddModal}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              + Upload Your First Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status Badge & Actions */}
                  <div className="flex justify-between items-center">
                    {prod.status === "LIVE" || !prod.status ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> LIVE ON SITE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 animate-pulse">
                        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" /> PENDING ADMIN APPROVAL
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Image & Title */}
                  <div className="flex gap-3 items-center">
                    <div className="w-20 h-20 aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex-shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={Array.isArray(prod.images) ? prod.images[0] : prod.imageUrl || "/logo.jpg"}
                        alt={prod.name}
                        className="w-full h-full object-contain max-h-full max-w-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-2">{prod.name}</h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{prod.brand || "Authorized Shop Item"} • Stock: {prod.stockCount || 10}</div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(prod.price)}</span>
                    {prod.originalPrice && prod.originalPrice > prod.price && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(prod.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>{editingProduct ? "Edit Shop Product" : "Upload New Shop Product"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Samsung Galaxy S24 Ultra (256GB, Titanium Gray)"
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. 109999"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                      placeholder="e.g. 129999"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category *</label>
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Stock Count</label>
                    <input
                      type="number"
                      value={form.stockCount}
                      onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
                      placeholder="10"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Direct Image File Upload & Preview */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Product Photo</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-all">
                        {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <Upload className="h-4 w-4 text-amber-500" />}
                        <span>{uploadingImage ? "Uploading Photo..." : "Choose Image File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                      <span className="text-xs text-slate-400">or enter image URL below</span>
                    </div>

                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://example.com/product.jpg or uploaded URL"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    {form.imageUrl && (
                      <div className="w-24 h-24 aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide details, specs, or warranty terms for this item..."
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-xl shadow-md"
                  >
                    {submitting ? "Saving Product..." : editingProduct ? "Save Product Changes" : "Submit Product for Approval"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="font-bold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
