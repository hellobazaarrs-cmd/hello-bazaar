"use client";

import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import {
  Film,
  Plus,
  Trash2,
  Edit,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Upload,
  Zap,
  Flame,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "HERO" | "DEAL">("ALL");

  const [form, setForm] = useState({
    title: "",
    description: "",
    mediaType: "IMAGE" as "IMAGE" | "VIDEO",
    mediaUrl: "",
    targetUrl: "/products",
    buttonText: "Shop Now",
    badgeText: "HOT DEAL",
    placement: "HERO" as "HERO" | "DEAL",
    orderIndex: "1",
    durationSeconds: "3",
    active: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      if (res.ok) {
        setBanners(data.banners || []);
      } else {
        toast.error(data.error || "Failed to load banners");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (form.mediaType === "VIDEO" && file.size > 50 * 1024 * 1024) {
      toast.error("Video file is larger than 50MB limit. Please upload an optimized WebM/MP4 video.");
      return;
    }

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
        const isVideoFile =
          file.type.startsWith("video/") ||
          file.name.toLowerCase().endsWith(".mp4") ||
          file.name.toLowerCase().endsWith(".webm") ||
          file.name.toLowerCase().endsWith(".mov");
        const detectedType = isVideoFile ? "VIDEO" : form.mediaType;

        setForm((prev) => ({
          ...prev,
          mediaUrl: uploadedUrl,
          mediaType: detectedType,
        }));
        toast.success(`${detectedType === "VIDEO" ? "Video" : "Banner image"} uploaded successfully!`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaUrl.trim()) {
      toast.error("Media file (video or banner image) is required");
      return;
    }

    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : "/api/admin/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingBanner ? "Banner updated successfully!" : "New Banner added!");
        setShowModal(false);
        setEditingBanner(null);
        fetchBanners();
      } else {
        toast.error(data.error || "Failed to save banner");
      }
    } catch {
      toast.error("Error saving banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  const openCreateModal = (presetPlacement: "HERO" | "DEAL" = "HERO") => {
    setEditingBanner(null);
    setForm({
      title: "",
      description: "",
      mediaType: "IMAGE",
      mediaUrl: "",
      targetUrl: "/products",
      buttonText: presetPlacement === "DEAL" ? "Explore Deals" : "Shop Now",
      badgeText: presetPlacement === "DEAL" ? "LIMITED TIME DEAL" : "BUY SAFE & SECURE PAYMENT",
      placement: presetPlacement,
      orderIndex: String(banners.length + 1),
      durationSeconds: "3",
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (b: any) => {
    setEditingBanner(b);
    setForm({
      title: b.title || "",
      description: b.description || "",
      mediaType: b.mediaType || "IMAGE",
      mediaUrl: b.mediaUrl || "",
      targetUrl: b.targetUrl || "/products",
      buttonText: b.buttonText || "Shop Now",
      badgeText: b.badgeText || "HOT DEAL",
      placement: b.placement || "HERO",
      orderIndex: String(b.orderIndex ?? 1),
      durationSeconds: String(b.durationSeconds ?? 3),
      active: b.active !== false,
    });
    setShowModal(true);
  };

  const filteredBanners = banners.filter((b) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "HERO") return b.placement !== "DEAL";
    if (activeTab === "DEAL") return b.placement === "DEAL";
    return true;
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Film className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Banners &amp; Deals Management
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Full control over Hero Carousel Banners (top) and Limited Time Deals Banners (middle). All content is 100% dynamic.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBanners}
              className="gap-2 border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => openCreateModal("HERO")}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Banner / Deal
            </Button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Banners ({banners.length})
          </button>
          <button
            onClick={() => setActiveTab("HERO")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "HERO"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Top Hero Banners ({banners.filter((b) => b.placement !== "DEAL").length})</span>
          </button>
          <button
            onClick={() => setActiveTab("DEAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "DEAL"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Limited Time Deals ({banners.filter((b) => b.placement === "DEAL").length})</span>
          </button>
        </div>

        {/* Banners Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-slate-500 font-medium">Loading banners...</p>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Banners Found in this Section</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              Create a custom Hero slide or Limited Time Deal banner. It will appear live on the store home page instantly.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => openCreateModal("HERO")} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Add Hero Banner
              </Button>
              <Button onClick={() => openCreateModal("DEAL")} className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
                <Flame className="w-4 h-4" /> Add Deal Banner
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBanners.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Media Preview Box */}
                <div className="relative aspect-[16/8] bg-slate-950 overflow-hidden flex items-center justify-center">
                  {b.mediaType === "VIDEO" ? (
                    <video
                      src={b.mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={b.mediaUrl}
                      alt={b.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        b.placement === "DEAL"
                          ? "bg-purple-600 text-white"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      {b.placement === "DEAL" ? "DEAL SECTION" : "HERO CAROUSEL"}
                    </span>
                    <span className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      {b.mediaType === "VIDEO" ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-sky-400" />}
                      <span>{b.mediaType}</span>
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.active !== false
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {b.active !== false ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>

                {/* Banner Details */}
                <div className="p-4 space-y-2 flex-1">
                  {b.badgeText && (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {b.badgeText}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">
                    {b.title || "Untitled Banner"}
                  </h3>
                  {b.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {b.description}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[180px] flex items-center gap-1 text-indigo-600 dark:text-sky-400">
                      <LinkIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{b.targetUrl || "/products"}</span>
                    </span>
                    <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      Order: {b.orderIndex ?? 1}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(b)}
                    className="text-xs gap-1 border-slate-200 dark:border-slate-700"
                  >
                    <Edit className="w-3.5 h-3.5 text-indigo-600" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(b.id)}
                    className="text-xs gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-indigo-600" />
                  <span>{editingBanner ? "Edit Banner / Deal" : "Add New Banner / Deal"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Placement Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                    1. Banner Location / Placement *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, placement: "HERO" })}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        form.placement === "HERO"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <LayoutTemplate className="w-4 h-4" /> Top Hero Carousel
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, placement: "DEAL" })}
                      className={`p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        form.placement === "DEAL"
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Flame className="w-4 h-4" /> Limited Time Deals Banner
                    </button>
                  </div>
                </div>

                {/* 2. Media Type Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
                    2. Media Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mediaType: "IMAGE" })}
                      className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        form.mediaType === "IMAGE"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> Image (PNG, JPG, WebP)
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mediaType: "VIDEO" })}
                      className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        form.mediaType === "VIDEO"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Video className="w-4 h-4" /> Video (MP4 / WebM)
                    </button>
                  </div>
                </div>

                {/* 3. Media Upload / URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                    3. Upload Media File or Paste URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.mediaUrl}
                      onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                      placeholder="Paste Image / Video URL or click Upload"
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept={form.mediaType === "VIDEO" ? "video/*" : "image/*"}
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {form.mediaUrl && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[16/7] bg-slate-950 flex items-center justify-center">
                      {form.mediaType === "VIDEO" ? (
                        <video src={form.mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={form.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Title & Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Latest Electronics At Best Prices"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                    Banner Subtitle / Description
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Shop the newest gadgets with verified authenticity & warranty."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* 5. Badge & Button */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={form.badgeText}
                      onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                      placeholder="e.g. BUY SAFE & SECURE PAYMENT"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                      placeholder="e.g. Shop Now / Explore Deals"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 6. Target URL & Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                      Target Link / URL
                    </label>
                    <input
                      type="text"
                      value={form.targetUrl}
                      onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                      placeholder="/products or /offers"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 uppercase tracking-wider">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={form.orderIndex}
                      onChange={(e) => setForm({ ...form, orderIndex: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 7. Active Checkbox */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="bannerActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Active on Store Front
                  </label>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    {editingBanner ? "Update Banner" : "Create Banner"}
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
