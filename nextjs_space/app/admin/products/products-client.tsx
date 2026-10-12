"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Sliders, CheckSquare, Square, Save, RotateCcw, AlertTriangle, Layers, Upload, MoveLeft, MoveRight, GripVertical, Star, CornerDownRight } from "lucide-react";
import { formatRupees } from "@/lib/format";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductVariant {
  id?: string;
  ram: string;
  storage: string;
  color: string;
  price: number | string;
  originalPrice?: number | string | null;
  stock: number | string;
  sku: string;
  barcode?: string;
  image: string;
  images: string[];
  weight?: string;
  dimensions?: string;
  warranty?: string;
  status: string;
  lowStockLimit?: number | string;
  isDefault?: boolean;
  specs?: Record<string, string>;
  view360Angles?: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  discount?: number;
  stock: number;
  sku?: string;
  image: string;
  images?: string[];
  brand?: string;
  color?: string;
  category?: Category;
  categoryId?: string;
  featured?: boolean;
  specs?: Record<string, string>;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  returnPolicy?: string;
  view360Angles?: Record<string, string>;
  bulkPrice?: number | null;
  minBulkQty?: number | null;
}

export default function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [specRows, setSpecRows] = useState<{ key: string; value: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Product Variant Management State
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);
  const [variantFormData, setVariantFormData] = useState<ProductVariant>({
    ram: "",
    storage: "",
    color: "",
    price: "",
    originalPrice: "",
    stock: "",
    sku: "",
    barcode: "",
    image: "",
    images: [],
    weight: "",
    dimensions: "",
    warranty: "1 Year Brand Warranty",
    status: "ACTIVE",
    lowStockLimit: 5,
    isDefault: false,
  });
  const [variantImages, setVariantImages] = useState<string[]>([]);
  const [variantUploading, setVariantUploading] = useState(false);
  const [variantSpecRows, setVariantSpecRows] = useState<{ key: string; value: string }[]>([]);

  // Drag & Drop reordering state for Main Product images
  const [mainDragIdx, setMainDragIdx] = useState<number | null>(null);
  const [mainDragOverIdx, setMainDragOverIdx] = useState<number | null>(null);

  // Drag & Drop reordering state for Variant images
  const [variantDragIdx, setVariantDragIdx] = useState<number | null>(null);
  const [variantDragOverIdx, setVariantDragOverIdx] = useState<number | null>(null);

  const moveMainImage = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= uploadedImages.length) return;
    setUploadedImages((prev) => {
      const list = [...prev];
      const [item] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, item);
      return list;
    });
  };

  const moveVariantImage = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= variantImages.length) return;
    setVariantImages((prev) => {
      const list = [...prev];
      const [item] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, item);
      setVariantFormData((f) => ({
        ...f,
        image: list[0] || "",
        images: list,
      }));
      return list;
    });
  };

  // Bulk Matrix Generator State
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixRams, setMatrixRams] = useState("4GB, 6GB, 8GB");
  const [matrixStorages, setMatrixStorages] = useState("64GB, 128GB, 256GB");
  const [matrixColors, setMatrixColors] = useState("Blue, Black");
  const [matrixBasePrice, setMatrixBasePrice] = useState("");
  const [matrixBaseStock, setMatrixBaseStock] = useState("10");

  // Bulk Operations State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<"fields" | "stock">("stock");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showVariantsInBulk, setShowVariantsInBulk] = useState(true);

  // Bulk fields form
  const [applyToAll, setApplyToAll] = useState(false);
  const [priceChangeType, setPriceChangeType] = useState<"" | "set" | "add" | "percent_add" | "percent_sub">("");
  const [priceChangeValue, setPriceChangeValue] = useState("");
  const [stockChangeType, setStockChangeType] = useState<"" | "set" | "add">("");
  const [stockChangeValue, setStockChangeValue] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkFeatured, setBulkFeatured] = useState<"none" | "featured" | "standard">("none");
  const [bulkBrand, setBulkBrand] = useState("");
  const [bulkDescription, setBulkDescription] = useState("");
  const [bulkOriginalPriceChangeType, setBulkOriginalPriceChangeType] = useState<"" | "set" | "remove">("");
  const [bulkOriginalPriceChangeValue, setBulkOriginalPriceChangeValue] = useState("");

  // Full Stock Quick-Editor State
  const [bulkStockMap, setBulkStockMap] = useState<Record<string, string>>({});
  const [bulkPriceMap, setBulkPriceMap] = useState<Record<string, string>>({});
  const [bulkNameMap, setBulkNameMap] = useState<Record<string, string>>({});
  const [bulkVariantPriceMap, setBulkVariantPriceMap] = useState<Record<string, string>>({});
  const [bulkVariantOriginalPriceMap, setBulkVariantOriginalPriceMap] = useState<Record<string, string>>({});
  const [bulkVariantStockMap, setBulkVariantStockMap] = useState<Record<string, string>>({});
  const [stockSearch, setStockSearch] = useState("");

  useEffect(() => {
    const checkDark = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("admin-theme") !== "light";
      setIsDark(dark);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [variantDragActive, setVariantDragActive] = useState(false);

  useEffect(() => {
    if (!showModal && !showVariantModal) {
      setDragActive(false);
      setVariantDragActive(false);
      return;
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        if (showVariantModal) {
          setVariantDragActive(true);
        } else if (showModal) {
          setDragActive(true);
        }
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setDragActive(false);
        setVariantDragActive(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isVariant = showVariantModal;
      setDragActive(false);
      setVariantDragActive(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) {
          toast.error("Please drop image files only");
          return;
        }

        if (isVariant) {
          setVariantUploading(true);
          try {
            const fd = new FormData();
            imageFiles.forEach((file) => fd.append("files", file));

            const res = await fetch("/api/admin/upload", {
              method: "POST",
              body: fd,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            if (data?.urls) {
              setVariantImages((prev) => [...prev, ...data.urls]);
              setVariantFormData((prev) => ({
                ...prev,
                image: prev.image || data.urls[0],
                images: [...(prev.images || []), ...data.urls],
              }));
              toast.success("Images uploaded to Variant successfully via Drag & Drop!");
            }
          } catch {
            toast.error("Failed to upload dragged variant images");
          } finally {
            setVariantUploading(false);
          }
        } else {
          setUploading(true);
          try {
            const fd = new FormData();
            imageFiles.forEach((file) => fd.append("files", file));

            const res = await fetch("/api/admin/upload", {
              method: "POST",
              body: fd,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            if (data?.urls) {
              setUploadedImages((prev) => [...prev, ...data.urls]);
              toast.success("Images uploaded to Main Product successfully via Drag & Drop!");
            }
          } catch {
            toast.error("Failed to upload dragged images");
          } finally {
            setUploading(false);
          }
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [showModal, showVariantModal]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    originalPrice: "",
    stock: "",
    brand: "",
    color: "",
    image: "",
    categoryId: "",
    featured: false,
    returnPolicy: "7 Days Replacement / Return Policy",
    bulkPrice: "",
    minBulkQty: "10",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      const p = await pRes.json();
      const c = await cRes.json();
      const loadedProducts = p?.products ?? [];
      setProducts(loadedProducts);
      setCategories(c?.categories ?? []);

      // Pre-fill bulk maps
      const stockMap: Record<string, string> = {};
      const priceMap: Record<string, string> = {};
      const nameMap: Record<string, string> = {};
      const varPriceMap: Record<string, string> = {};
      const varOrigPriceMap: Record<string, string> = {};
      const varStockMap: Record<string, string> = {};

      loadedProducts.forEach((prod: Product) => {
        stockMap[prod.id] = String(prod.stock ?? 0);
        priceMap[prod.id] = String(prod.price ?? 0);
        nameMap[prod.id] = prod.name || "";

        if (Array.isArray(prod.variants)) {
          prod.variants.forEach((v: any) => {
            if (v.id) {
              varPriceMap[v.id] = String(v.price ?? prod.price ?? 0);
              varOrigPriceMap[v.id] = v.originalPrice != null ? String(v.originalPrice) : (prod.originalPrice != null ? String(prod.originalPrice) : "");
              varStockMap[v.id] = String(v.stock ?? prod.stock ?? 0);
            }
          });
        }
      });

      setBulkStockMap(stockMap);
      setBulkPriceMap(priceMap);
      setBulkNameMap(nameMap);
      setBulkVariantPriceMap(varPriceMap);
      setBulkVariantOriginalPriceMap(varOrigPriceMap);
      setBulkVariantStockMap(varStockMap);
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      originalPrice: "",
      stock: "",
      brand: "",
      color: "",
      image: "",
      categoryId: categories?.[0]?.id ?? "",
      featured: false,
      returnPolicy: "7 Days Replacement / Return Policy",
      bulkPrice: "",
      minBulkQty: "10",
    });
    setHasVariants(false);
    setVariants([]);
    setSpecRows([
      { key: "Processor", value: "" },
      { key: "Storage", value: "" },
      { key: "Battery", value: "" },
      { key: "Camera", value: "" },
      { key: "Display", value: "" },
      { key: "RAM", value: "" },
    ]);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setFormData({
      name: p?.name ?? "",
      slug: p?.slug ?? "",
      description: p?.description ?? "",
      price: String(p?.price ?? ""),
      originalPrice: p?.originalPrice != null ? String(p?.originalPrice) : "",
      stock: String(p?.stock ?? 0),
      brand: p?.brand ?? "",
      color: p?.color ?? "",
      image: p?.image ?? "",
      categoryId: p?.categoryId ?? "",
      featured: p?.featured ?? false,
      returnPolicy: (p as any)?.returnPolicy ?? "7 Days Replacement / Return Policy",
      bulkPrice: (p as any)?.bulkPrice != null ? String((p as any).bulkPrice) : "",
      minBulkQty: (p as any)?.minBulkQty != null ? String((p as any).minBulkQty) : "10",
    });
    setUploadedImages((p as any)?.images || (p?.image ? [p.image] : []));
    const prodVariants = (p as any)?.variants || [];
    setHasVariants(!!p?.hasVariants || prodVariants.length > 0);
    setVariants(prodVariants);

    const existingSpecs = (p as any)?.specs || {};
    const mapped = Object.entries(existingSpecs).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setSpecRows(mapped.length > 0 ? mapped : [
      { key: "Processor", value: "" },
      { key: "Storage", value: "" },
      { key: "Battery", value: "" },
      { key: "Camera", value: "" },
      { key: "Display", value: "" },
      { key: "RAM", value: "" },
    ]);
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data?.urls) {
        setUploadedImages((prev) => [...prev, ...data.urls]);
        toast.success("Images uploaded successfully");
      }
    } catch (err) {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleVariantFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setVariantUploading(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) {
      fd.append("files", files[i]);
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data?.urls) {
        setVariantImages((prev) => [...prev, ...data.urls]);
        setVariantFormData((prev) => ({
          ...prev,
          image: prev.image || data.urls[0],
          images: [...(prev.images || []), ...data.urls],
        }));
        toast.success("Variant images uploaded!");
      }
    } catch {
      toast.error("Failed to upload variant images");
    } finally {
      setVariantUploading(false);
    }
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantFormData.ram && !variantFormData.storage && !variantFormData.color) {
      toast.error("Please specify at least RAM, Storage, or Color");
      return;
    }
    const finalImages = variantImages.length > 0 ? variantImages : (uploadedImages.length > 0 ? uploadedImages : [variantFormData.image || ""]);
    
    const variantSpecsObj: Record<string, string> = {};
    variantSpecRows.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        variantSpecsObj[row.key.trim()] = row.value.trim();
      }
    });

    const newVariant: ProductVariant = {
      ...variantFormData,
      price: Number(variantFormData.price || formData.price || 0),
      originalPrice: variantFormData.originalPrice ? Number(variantFormData.originalPrice) : null,
      stock: Number(variantFormData.stock ?? 0),
      image: finalImages[0] || "",
      images: finalImages,
      specs: variantSpecsObj,
    };

    setVariants((prev) => {
      const list = [...prev];
      if (editingVariantIndex !== null && editingVariantIndex >= 0) {
        list[editingVariantIndex] = newVariant;
      } else {
        list.push(newVariant);
      }
      return list;
    });

    setShowVariantModal(false);
    toast.success(editingVariantIndex !== null ? "Variant updated!" : "Variant added!");
  };

  const handleGenerateMatrix = () => {
    const rams = matrixRams.split(",").map((s) => s.trim()).filter(Boolean);
    const storages = matrixStorages.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = matrixColors.split(",").map((s) => s.trim()).filter(Boolean);

    if (rams.length === 0 || storages.length === 0) {
      toast.error("Please enter at least one RAM and Storage option");
      return;
    }

    const colorList = colors.length > 0 ? colors : ["Standard"];
    const baseP = Number(matrixBasePrice || formData.price || 9999);
    const baseS = Number(matrixBaseStock || 10);
    const slugPrefix = (formData.name || "PROD").toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 8);

    const generated: ProductVariant[] = [];
    let count = 1;
    for (const ram of rams) {
      for (const storage of storages) {
        for (const color of colorList) {
          generated.push({
            ram,
            storage,
            color,
            price: baseP,
            originalPrice: baseP ? Math.round(baseP * 1.2) : "",
            stock: baseS,
            sku: `${slugPrefix}-${ram.toLowerCase()}-${storage.toLowerCase()}-${color.toLowerCase().substring(0, 3)}`,
            barcode: "",
            image: uploadedImages[0] || "",
            images: [...uploadedImages],
            weight: "",
            dimensions: "",
            warranty: "1 Year Brand Warranty",
            status: "ACTIVE",
            lowStockLimit: 5,
            isDefault: count === 1,
            specs: {
              "RAM": ram,
              "Storage": storage,
              "Colour": color,
            },
          });
          count++;
        }
      }
    }

    setVariants((prev) => [...prev, ...generated]);
    setHasVariants(true);
    setShowMatrixModal(false);
    toast.success(`Generated ${generated.length} variant combinations!`);
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }
    const specsObj: Record<string, string> = {};
    specRows.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        specsObj[row.key.trim()] = row.value.trim();
      }
    });

    const payload = {
      name: formData?.name,
      slug: formData?.slug || formData?.name?.toLowerCase?.()?.replace?.(/[^a-z0-9]+/g, "-"),
      description: formData?.description,
      price: Number(formData?.price) || 0,
      originalPrice: formData?.originalPrice ? Number(formData?.originalPrice) : null,
      stock: Number(formData?.stock) || 0,
      brand: formData?.brand,
      color: formData?.color || null,
      image: uploadedImages[0] ?? "",
      images: uploadedImages,
      categoryId: formData?.categoryId,
      featured: formData?.featured,
      returnPolicy: formData?.returnPolicy || "7 Days Replacement / Return Policy",
      specs: specsObj,
      hasVariants,
      variants: hasVariants ? variants : [],
      bulkPrice: formData?.bulkPrice ? Number(formData.bulkPrice) : null,
      minBulkQty: formData?.minBulkQty ? Number(formData.minBulkQty) : null,
    };
    try {
      const url = editing ? `/api/admin/products/${editing?.id}` : "/api/admin/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editing ? "Product updated" : "Product created");
      setShowModal(false);
      load();
    } catch (e) {
      toast.error("Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Product deleted");
      setSelectedIds(prev => prev.filter(x => x !== id));
      load();
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  // Bulk operation actions
  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targets = applyToAll ? products.map(p => p.id) : selectedIds;
    if (targets.length === 0) {
      toast.error("No products selected");
      return;
    }

    setBulkSubmitting(true);
    try {
      const payload: any = {
        action: "edit_fields",
        ids: targets,
        data: {},
      };

      if (priceChangeType && priceChangeValue !== "") {
        payload.data.priceChangeType = priceChangeType;
        payload.data.priceChangeValue = Number(priceChangeValue);
      }

      if (stockChangeType && stockChangeValue !== "") {
        payload.data.stockChangeType = stockChangeType;
        payload.data.stockChangeValue = Number(stockChangeValue);
      }

      if (bulkCategoryId) {
        payload.data.categoryId = bulkCategoryId;
      }

      if (bulkFeatured !== "none") {
        payload.data.featured = bulkFeatured === "featured";
      }

      if (bulkBrand) {
        payload.data.brand = bulkBrand;
      }

      if (bulkDescription) {
        payload.data.description = bulkDescription;
      }

      if (bulkOriginalPriceChangeType) {
        payload.data.originalPriceChangeType = bulkOriginalPriceChangeType;
        if (bulkOriginalPriceChangeType === "set" && bulkOriginalPriceChangeValue !== "") {
          payload.data.originalPriceChangeValue = Number(bulkOriginalPriceChangeValue);
        }
      }

      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Bulk update failed");
      const data = await res.json();
      toast.success(`Successfully updated ${data.count} products`);
      setShowBulkModal(false);
      setSelectedIds([]);
      
      // Reset forms
      setPriceChangeType("");
      setPriceChangeValue("");
      setStockChangeType("");
      setStockChangeValue("");
      setBulkCategoryId("");
      setBulkFeatured("none");
      setBulkBrand("");
      setBulkDescription("");
      setBulkOriginalPriceChangeType("");
      setBulkOriginalPriceChangeValue("");
      setApplyToAll(false);

      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update products in bulk");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    try {
      const variantMapPayload: Record<string, { price?: number; originalPrice?: number | null; stock?: number }> = {};
      Object.keys(bulkVariantPriceMap).forEach((varId) => {
        const pVal = bulkVariantPriceMap[varId];
        const opVal = bulkVariantOriginalPriceMap[varId];
        const sVal = bulkVariantStockMap[varId];
        variantMapPayload[varId] = {
          price: pVal !== "" ? Number(pVal) : undefined,
          originalPrice: opVal === "" ? null : (opVal != null && opVal !== "" ? Number(opVal) : undefined),
          stock: sVal !== "" ? Number(sVal) : undefined,
        };
      });

      const payload = {
        action: "update_stock",
        data: {
          stockMap: bulkStockMap,
          priceMap: bulkPriceMap,
          nameMap: bulkNameMap,
          variantMap: variantMapPayload,
        },
      };

      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Bulk spreadsheet update failed");
      const data = await res.json();
      toast.success(`Successfully updated catalog & variant prices!`);
      setShowBulkModal(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to update catalog spreadsheet");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("No products selected to delete");
      return;
    }
    if (!confirm(`Are you absolutely sure you want to permanently delete the ${selectedIds.length} selected products? This cannot be undone.`)) return;

    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          ids: selectedIds,
        }),
      });

      if (!res.ok) throw new Error("Bulk deletion failed");
      toast.success("Selected products deleted successfully");
      setSelectedIds([]);
      setShowBulkModal(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete products in bulk");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtered = products?.filter((p) =>
    p?.name?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "") ||
    p?.brand?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "")
  );

  const toggleSelectAll = () => {
    const filteredIds = filtered.map((p) => p.id);
    const allSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const next = [...prev];
        filteredIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const isAllSelected =
    filtered?.length > 0 && filtered.every((p) => selectedIds.includes(p.id));

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const tableBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const theadBg = isDark ? "rgba(15,23,42,0.5)" : "rgba(241,245,249,0.8)";
  const rowHoverBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const modalBgColor = isDark ? "#1e293b" : "#ffffff";

  // Filter products specifically in the stock quick sheet view
  const filteredForStockSheet = products?.filter((p) =>
    p?.name?.toLowerCase?.()?.includes?.(stockSearch?.toLowerCase?.() ?? "") ||
    p?.brand?.toLowerCase?.()?.includes?.(stockSearch?.toLowerCase?.() ?? "")
  );

  return (
    <div className="space-y-4 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* Header and Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: textPrimary }}>Products</h1>
          <p style={{ fontSize: 14, color: textSecondary }}>Manage your store catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              // Pre-fill quick editing maps
              const stockMap: Record<string, string> = {};
              const priceMap: Record<string, string> = {};
              const nameMap: Record<string, string> = {};
              products.forEach((prod) => {
                stockMap[prod.id] = String(prod.stock);
                priceMap[prod.id] = String(prod.price);
                nameMap[prod.id] = prod.name;
              });
              setBulkStockMap(stockMap);
              setBulkPriceMap(priceMap);
              setBulkNameMap(nameMap);
              setBulkTab(selectedIds.length > 0 ? "fields" : "stock");
              setShowBulkModal(true);
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-purple-500/30 transition text-white text-sm"
          >
            <Sliders className="w-4 h-4" /> Bulk Editor
          </button>
          
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-cyan-500/30 transition text-white text-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: textSecondary }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or brand..."
          style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "10px 16px 10px 44px", color: textPrimary, outline: "none" }}
        />
      </div>

      {/* Selection floating status bar for all screens */}
      {selectedIds.length > 0 && (
        <div 
          className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-4 px-4 py-3 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-300 w-[92%] max-w-lg"
          style={{
            background: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)",
            borderColor: isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.6)",
          }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: textPrimary }}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
              {selectedIds.length}
            </span>
            <span>selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkTab("fields");
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
            >
              Bulk Action
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: textSecondary, borderColor: inputBorder }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Products list card container */}
      <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: textSecondary }}>Loading...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm font-sans">
                <thead style={{ background: theadBg, color: textSecondary }}>
                  <tr>
                    <th style={{ padding: "12px 16px", width: 48, textAlign: "center" }}>
                      <button 
                        type="button" 
                        onClick={toggleSelectAll} 
                        style={{ color: isAllSelected ? "#6366f1" : textSecondary }}
                      >
                        {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Product</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Price</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Stock</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr
                        key={p?.id}
                        style={{ 
                          borderTop: `1px solid ${tableBorder}`, 
                          transition: "background 0.2s",
                          background: isSelected ? (isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)") : "transparent"
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = rowHoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button 
                            type="button" 
                            onClick={() => toggleSelect(p.id)} 
                            style={{ color: isSelected ? "#6366f1" : textSecondary }}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: inputBg }}>
                              {p?.image && (
                                <Image
                                  src={p?.image}
                                  alt={p?.name ?? ""}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: textPrimary }}>{p?.name}</div>
                              <div style={{ fontSize: 12, color: textSecondary }}>{p?.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: textSecondary }}>{p?.category?.name ?? "-"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: textPrimary }}>
                          <div>{formatRupees(p?.price ?? 0)}</div>
                          {(p as any)?.bulkPrice ? (
                            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                              Bulk: {formatRupees((p as any).bulkPrice)} (Min {(p as any).minBulkQty || 10})
                            </div>
                          ) : null}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <span
                            style={{
                              padding: "4px 8px", borderRadius: 4, fontSize: 12,
                              background: (p?.stock ?? 0) > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                              color: (p?.stock ?? 0) > 0 ? "#10b981" : "#ef4444"
                            }}
                          >
                            {p?.stock ?? 0}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => openEdit(p)}
                              style={{ padding: 8, borderRadius: 8, color: "#22d3ee" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(6,182,212,0.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p?.id ?? "")}
                              style={{ padding: 8, borderRadius: 8, color: "#ef4444" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered?.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 32, textAlign: "center", color: textSecondary }}>
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden">
              <div className="flex items-center justify-between p-3" style={{ borderBottom: `1px solid ${tableBorder}`, background: theadBg }}>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: textSecondary }}
                >
                  {isAllSelected ? <CheckSquare className="w-4.5 h-4.5 text-indigo-500" /> : <Square className="w-4.5 h-4.5" />}
                  Select All Filtered
                </button>
              </div>

              {filtered?.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div 
                    key={p?.id} 
                    className="p-4 space-y-3 relative transition-colors duration-200" 
                    style={{ 
                      borderBottom: `1px solid ${tableBorder}`,
                      background: isSelected ? (isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.03)") : "transparent"
                    }}
                  >
                    {/* Checkbox Floating Selector on Mobile */}
                    <button
                      onClick={() => toggleSelect(p.id)}
                      className="absolute top-4 left-4 z-10 rounded-md bg-slate-900/10 dark:bg-white/10"
                      style={{ color: isSelected ? "#6366f1" : textSecondary }}
                    >
                      {isSelected ? <CheckSquare className="w-5 h-5 bg-white dark:bg-slate-900 rounded" /> : <Square className="w-5 h-5 bg-white dark:bg-slate-900 rounded" />}
                    </button>

                    <div className="flex items-center gap-3 pl-8">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ background: inputBg, border: `1px solid ${tableBorder}` }}>
                        {p?.image && (
                          <Image
                            src={p?.image}
                            alt={p?.name ?? ""}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontWeight: 600, color: textPrimary, fontSize: 14 }} className="truncate">{p?.name}</div>
                        <div style={{ fontSize: 12, color: textSecondary }}>{p?.brand} · {p?.category?.name ?? "-"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 pl-8" style={{ borderTop: `1px solid ${tableBorder}` }}>
                      <div className="flex items-baseline gap-2">
                        <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>
                          {formatRupees(p?.price ?? 0)}
                        </div>
                        {p?.originalPrice && (
                          <div style={{ fontSize: 12, color: textSecondary, textDecoration: "line-through" }}>
                            {formatRupees(p.originalPrice)}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: (p?.stock ?? 0) > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: (p?.stock ?? 0) > 0 ? "#10b981" : "#ef4444"
                        }}
                      >
                        Stock: {p?.stock ?? 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => openEdit(p)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, color: "#22d3ee", background: "rgba(6,182,212,0.1)", fontSize: 12, fontWeight: 500 }}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p?.id ?? "")}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, color: "#ef4444", background: "rgba(239,68,68,0.1)", fontSize: 12, fontWeight: 500 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {filtered?.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: textSecondary }}>
                  No products found
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Single Product Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div style={{ background: modalBgColor, borderRadius: 16, width: "100%", maxWidth: 672, border: `1px solid ${tableBorder}`, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", position: "relative" }}>
              {dragActive && (
                <div 
                  className="absolute inset-0 bg-cyan-500/10 dark:bg-cyan-500/5 backdrop-blur-sm border-2 border-dashed border-cyan-500 rounded-[16px] z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-300"
                >
                  <div className="bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl shadow-xl flex flex-col items-center gap-2 border dark:border-slate-800 scale-105 transition-all">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 animate-bounce">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-sm">Drop images here to upload</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP supported</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary }}>
                  {editing ? "Edit Product" : "Add Product"}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ padding: 8, borderRadius: 8, color: textSecondary }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Name</label>
                    <input
                      required
                      value={formData?.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Slug (optional)</label>
                    <input
                      value={formData?.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData?.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>MRP (₹)</label>
                    <input
                      type="number"
                      value={formData?.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Selling Price (₹)</label>
                    <input
                      required
                      type="number"
                      value={formData?.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Stock</label>
                    <input
                      required
                      type="number"
                      value={formData?.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>
                {/* B2B Wholesale Bulk Pricing Section */}
                <div style={{ background: isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "12px 16px" }} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>📦 B2B Wholesale Bulk Pricing (For Dealers)</span>
                    <span style={{ fontSize: 11, color: textSecondary }}>Special wholesale discount for bulk quantity orders</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>
                        Wholesale Bulk Price (₹/pc)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 850 (Discounted wholesale rate)"
                        value={formData?.bulkPrice}
                        onChange={(e) => setFormData({ ...formData, bulkPrice: e.target.value })}
                        style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>
                        Minimum Bulk Quantity (pcs)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={formData?.minBulkQty}
                        onChange={(e) => setFormData({ ...formData, minBulkQty: e.target.value })}
                        style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Brand</label>
                    <input
                      value={formData?.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Category</label>
                    <select
                      required
                      value={formData?.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    >
                      <option value="">Select category</option>
                      {categories?.map((c) => (
                        <option key={c?.id} value={c?.id}>
                          {c?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Colour</label>
                    <input
                      value={formData?.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g. Black, Gold, Silver"
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Return & Replacement Policy</label>
                    <input
                      value={formData?.returnPolicy}
                      onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                      placeholder="e.g. 7 Days Replacement / Return Policy"
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>Main Product Image Gallery</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="images-upload"
                        className={`flex-1 flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                          dragActive
                            ? "border-cyan-500 bg-cyan-500/10 ring-4 ring-cyan-500/20 scale-[1.01]"
                            : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-cyan-500 hover:bg-cyan-500/5"
                        }`}
                      >
                        {uploading ? (
                          <div className="flex items-center gap-2 text-cyan-500 font-medium text-xs">
                            <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            Uploading main product images...
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <Upload className={`w-6 h-6 mb-1.5 ${dragActive ? "text-cyan-400 animate-bounce" : "text-cyan-500"}`} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>Drag & Drop Main Product Images here</span>
                            <span style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>or click to browse from device (PNG, JPG, JPEG, WEBP)</span>
                          </div>
                        )}
                      </label>
                      <input
                        type="file"
                        id="images-upload"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>

                    {uploadedImages.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                          <span>Drag thumbnail or use arrows to reorder position. Index 1 = Cover Image.</span>
                          <span>{uploadedImages.length} images</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {uploadedImages.map((url, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={() => setMainDragIdx(index)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setMainDragOverIdx(index);
                              }}
                              onDragLeave={() => setMainDragOverIdx(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (mainDragIdx !== null) moveMainImage(mainDragIdx, index);
                                setMainDragIdx(null);
                                setMainDragOverIdx(null);
                              }}
                              className={`relative aspect-square rounded-lg overflow-hidden group shadow-md transition-all cursor-move border-2 ${
                                mainDragOverIdx === index
                                  ? "border-cyan-500 scale-105 ring-2 ring-cyan-500/50"
                                  : mainDragIdx === index
                                  ? "opacity-40 border-dashed border-slate-400"
                                  : "border-slate-200 dark:border-slate-800"
                              }`}
                              style={{ background: inputBg }}
                            >
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                fill
                                unoptimized
                                className="object-contain p-1 pointer-events-none"
                              />
                              <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur rounded px-1 py-0.5 z-10">
                                <GripVertical className="w-3 h-3 text-white" />
                                <span className="text-[9px] font-bold text-white">#{index + 1}</span>
                              </div>
                              {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-cyan-500 text-[8px] font-bold text-white px-1.5 py-0.5 rounded leading-none shadow z-10">
                                  Cover Image
                                </span>
                              )}
                              <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    title="Move left"
                                    onClick={() => moveMainImage(index, index - 1)}
                                    className="h-5 w-5 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center shadow"
                                  >
                                    <MoveLeft className="w-3 h-3" />
                                  </button>
                                )}
                                {index < uploadedImages.length - 1 && (
                                  <button
                                    type="button"
                                    title="Move right"
                                    onClick={() => moveMainImage(index, index + 1)}
                                    className="h-5 w-5 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center shadow"
                                  >
                                    <MoveRight className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="Remove image"
                                  onClick={() => removeImage(index)}
                                  className="h-5 w-5 rounded bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Specifications Section */}
                <div style={{ borderTop: `1px solid ${tableBorder}`, paddingTop: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>
                    Specifications
                  </label>
                  <div className="space-y-2">
                    {specRows.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          placeholder="Name (e.g., RAM)"
                          value={row.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecRows(prev => prev.map((r, i) => i === index ? { ...r, key: val } : r));
                          }}
                          style={{ width: "40%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                        />
                        <input
                          placeholder="Value (e.g., 8GB)"
                          value={row.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecRows(prev => prev.map((r, i) => i === index ? { ...r, value: val } : r));
                          }}
                          style={{ width: "50%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSpecRows(prev => prev.filter((_, i) => i !== index));
                          }}
                          style={{ width: "10%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8, borderRadius: 8, color: "#ef4444" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSpecRows(prev => [...prev, { key: "", value: "" }])}
                      className="text-xs text-cyan-500 hover:text-cyan-600 font-semibold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Specification
                    </button>
                  </div>
                </div>

                {/* Product Variants Section (Amazon/Flipkart Style) */}
                <div style={{ borderTop: `1px solid ${tableBorder}`, paddingTop: 16 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 700, color: textPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                        <Layers className="w-4 h-4 text-cyan-500" /> Enable Product Variants (RAM / Storage / Color)
                      </label>
                      <p style={{ fontSize: 12, color: textSecondary }}>
                        Allow customers to select RAM, Storage & Color options on a single product page.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="hasVariantsToggle"
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="w-5 h-5 accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  {hasVariants && (
                    <div className="space-y-3 p-4 rounded-xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Configured Variants ({variants.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMatrixModal(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center gap-1"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Bulk Matrix Generator
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVariantIndex(null);
                              setVariantFormData({
                                ram: "",
                                storage: "",
                                color: "",
                                price: formData.price || "",
                                originalPrice: formData.originalPrice || "",
                                stock: formData.stock || "10",
                                sku: `${(formData.name || "PROD").toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 8)}-v${variants.length + 1}`,
                                barcode: "",
                                image: uploadedImages[0] || "",
                                images: [...uploadedImages],
                                weight: "",
                                dimensions: "",
                                warranty: "1 Year Brand Warranty",
                                status: "ACTIVE",
                                lowStockLimit: 5,
                                isDefault: variants.length === 0,
                              });
                              setVariantImages([...uploadedImages]);
                              setVariantSpecRows(specRows.length > 0 ? [...specRows] : [
                                { key: "RAM", value: "" },
                                { key: "Storage", value: "" },
                                { key: "Processor", value: "" },
                                { key: "Camera", value: "" },
                              ]);
                              setShowVariantModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Single Variant
                          </button>
                        </div>
                      </div>

                      {variants.length === 0 ? (
                        <div className="text-center py-6 border border-dashed rounded-lg border-slate-300 dark:border-slate-800 text-xs text-slate-500">
                          No variants added yet. Click &quot;Bulk Matrix Generator&quot; or &quot;Add Single Variant&quot; above!
                        </div>
                      ) : (
                        <div className="overflow-x-auto border rounded-lg border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b dark:border-slate-700">
                              <tr>
                                <th className="p-2">Variant</th>
                                <th className="p-2">Color</th>
                                <th className="p-2">Price (₹)</th>
                                <th className="p-2">Stock</th>
                                <th className="p-2">SKU</th>
                                <th className="p-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {variants.map((v, idx) => (
                                <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="p-2 font-medium text-slate-800 dark:text-slate-200">
                                    {v.ram} {v.storage && `+ ${v.storage}`}
                                    {v.isDefault && <span className="ml-1.5 text-[9px] bg-cyan-500 text-white font-bold px-1.5 py-0.5 rounded">Default</span>}
                                  </td>
                                  <td className="p-2 text-slate-600 dark:text-slate-400">{v.color || "-"}</td>
                                  <td className="p-2 font-semibold text-emerald-600 dark:text-emerald-400">₹{v.price}</td>
                                  <td className="p-2">{v.stock}</td>
                                  <td className="p-2 text-slate-500 font-mono text-[11px]">{v.sku || "-"}</td>
                                  <td className="p-2 text-right space-x-1">
                                    <button
                                      type="button"
                                      title={v.isDefault ? "Current Default Variant" : "Set as Default Variant"}
                                      onClick={() => {
                                        setVariants((prev) =>
                                          prev.map((item, i) => ({
                                            ...item,
                                            isDefault: i === idx,
                                          }))
                                        );
                                        toast.success(`Set ${v.ram} ${v.storage} as Default Variant!`);
                                      }}
                                      className={`p-1 rounded transition-colors ${
                                        v.isDefault
                                          ? "bg-amber-500/10 text-amber-500 font-bold"
                                          : "hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-400 hover:text-amber-500"
                                      }`}
                                    >
                                      <Star className={`w-3.5 h-3.5 ${v.isDefault ? "fill-amber-500 text-amber-500" : ""}`} />
                                    </button>
                                    <button
                                      type="button"
                                      title="Edit Variant"
                                      onClick={() => {
                                        setEditingVariantIndex(idx);
                                        setVariantFormData({ ...v });
                                        setVariantImages(v.images || (v.image ? [v.image] : []));
                                        const vSpecs = v.specs ? Object.entries(v.specs).map(([key, value]) => ({ key, value: String(value) })) : [];
                                        setVariantSpecRows(vSpecs.length > 0 ? vSpecs : specRows);
                                        setShowVariantModal(true);
                                      }}
                                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Copy / Duplicate Variant"
                                      onClick={() => {
                                        const copied = { ...v, sku: `${v.sku || "sku"}-copy` };
                                        setEditingVariantIndex(null);
                                        setVariantFormData(copied);
                                        setVariantImages(copied.images || []);
                                        const vSpecs = v.specs ? Object.entries(v.specs).map(([key, value]) => ({ key, value: String(value) })) : [];
                                        setVariantSpecRows(vSpecs.length > 0 ? vSpecs : specRows);
                                        setShowVariantModal(true);
                                      }}
                                      className="p-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                                    >
                                      <Layers className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Delete Variant"
                                      onClick={() => {
                                        setVariants((prev) => prev.filter((_, i) => i !== idx));
                                        toast.success("Variant removed");
                                      }}
                                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData?.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="featured" style={{ fontSize: 14, color: textSecondary }}>
                    Featured product
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-4" style={{ borderTop: `1px solid ${tableBorder}` }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${inputBorder}`, color: textPrimary, background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white"
                  >
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div style={{ background: modalBgColor, borderRadius: 16, width: "100%", maxWidth: bulkTab === "stock" ? 800 : 600, border: `1px solid ${tableBorder}`, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", position: "relative" }}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: textPrimary }} className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-500" /> Catalog Bulk Operations
                  </h2>
                  <p style={{ fontSize: 12, color: textSecondary }}>
                    Perform batch operations on products catalog
                  </p>
                </div>
                <button onClick={() => setShowBulkModal(false)} style={{ padding: 8, borderRadius: 8, color: textSecondary }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(128,128,128,0.1)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top Options Bar (Show Variants Toggle & Mode Switcher) */}
              <div className="flex flex-wrap items-center justify-between p-3 border-b bg-slate-100/60 dark:bg-slate-800/40 gap-3" style={{ borderColor: tableBorder }}>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showVariantsInBulk}
                    onChange={(e) => setShowVariantsInBulk(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-500" /> Show Product Variants (Direct Edit Price, MRP & Stock)
                  </span>
                </label>

                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-900/80 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBulkTab("stock")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      bulkTab === "stock"
                        ? "bg-cyan-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Full Stock Spreadsheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkTab("fields")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      bulkTab === "fields"
                        ? "bg-cyan-500 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Bulk Field Editor ({selectedIds.length} Selected)
                  </button>
                </div>
              </div>

              {/* Tab Content: Bulk Fields Editor */}
              {bulkTab === "fields" && (
                <form onSubmit={handleBulkEditSubmit} className="p-5 space-y-4">
                  {selectedIds.length === 0 && !applyToAll ? (
                    <div className="p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-3" style={{ borderColor: inputBorder, background: inputBg }}>
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                      <div className="text-sm font-semibold" style={{ color: textPrimary }}>No products selected</div>
                      <div className="text-xs max-w-xs" style={{ color: textSecondary }}>
                        Select products first from the list using checkboxes, or enable the option below to apply changes to ALL products in stock.
                      </div>
                      <button
                        type="button"
                        onClick={() => setApplyToAll(true)}
                        className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-semibold text-xs transition"
                      >
                        Apply to ALL {products.length} Products
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Selection Status Banner */}
                      <div className="p-3 rounded-lg flex items-center justify-between text-xs font-semibold" style={{ background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)", border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.3)"}` }}>
                        <span style={{ color: textPrimary }}>
                          {applyToAll ? `Applying changes to ALL ${products.length} products.` : `Applying changes to the ${selectedIds.length} selected products.`}
                        </span>
                        {!applyToAll && selectedIds.length === 0 && (
                          <span className="text-red-500">Error: Select items or all.</span>
                        )}
                        {selectedIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setApplyToAll(!applyToAll)}
                            className="text-indigo-500 underline"
                          >
                            {applyToAll ? "Switch back to Selected Only" : "Switch to ALL Products"}
                          </button>
                        )}
                      </div>

                      {/* Bulk Fields List */}
                      <div className="space-y-4">
                        {/* Price Change Row */}
                        <div className="grid sm:grid-cols-2 gap-3 items-end">
                          <div>
                            <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Bulk Price Adjustment</label>
                            <select
                              value={priceChangeType}
                              onChange={(e) => setPriceChangeType(e.target.value as any)}
                              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                            >
                              <option value="">No Change (Keep Current Price)</option>
                              <option value="set">Set to Fixed Value (e.g. ₹499)</option>
                              <option value="add">Add Value (e.g. Current Price + ₹50)</option>
                              <option value="percent_add">Increase by Percentage (e.g. Current Price + 10%)</option>
                              <option value="percent_sub">Decrease by Percentage (e.g. Current Price - 10%)</option>
                            </select>
                          </div>
                          {priceChangeType && (
                            <div>
                              <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>
                                {priceChangeType.includes("percent") ? "Percentage Value (%)" : "Rupee Value (₹)"}
                              </label>
                              <input
                                required
                                type="number"
                                step="any"
                                placeholder={priceChangeType.includes("percent") ? "e.g. 10 for 10%" : "e.g. 150"}
                                value={priceChangeValue}
                                onChange={(e) => setPriceChangeValue(e.target.value)}
                                style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Stock Adjustment Row */}
                        <div className="grid sm:grid-cols-2 gap-3 items-end">
                          <div>
                            <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Bulk Stock Adjustment</label>
                            <select
                              value={stockChangeType}
                              onChange={(e) => setStockChangeType(e.target.value as any)}
                              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                            >
                              <option value="">No Change (Keep Current Stock)</option>
                              <option value="set">Set Stock to Fixed Quantity (e.g. 100)</option>
                              <option value="add">Add Quantity to Stock (e.g. Current + 10)</option>
                            </select>
                          </div>
                          {stockChangeType && (
                            <div>
                              <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Quantity</label>
                              <input
                                required
                                type="number"
                                placeholder="e.g. 50"
                                value={stockChangeValue}
                                onChange={(e) => setStockChangeValue(e.target.value)}
                                style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Category Row */}
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Change Category To</label>
                          <select
                            value={bulkCategoryId}
                            onChange={(e) => setBulkCategoryId(e.target.value)}
                            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                          >
                            <option value="">No Change (Keep Current Categories)</option>
                            {categories?.map((c) => (
                              <option key={c?.id} value={c?.id}>
                                {c?.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Featured Toggles */}
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Featured Badge</label>
                          <select
                            value={bulkFeatured}
                            onChange={(e) => setBulkFeatured(e.target.value as any)}
                            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                          >
                            <option value="none">No Change (Keep Current)</option>
                            <option value="featured">Set all to Featured</option>
                            <option value="standard">Remove all from Featured</option>
                          </select>
                        </div>

                        {/* Brand Row */}
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Change Brand To</label>
                          <input
                            type="text"
                            placeholder="e.g. Apple, Sony (Leave blank for no change)"
                            value={bulkBrand}
                            onChange={(e) => setBulkBrand(e.target.value)}
                            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                          />
                        </div>

                        {/* Original Price (Strike-through Price) Row */}
                        <div className="grid sm:grid-cols-2 gap-3 items-end">
                          <div>
                            <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Original Price Adjustment</label>
                            <select
                              value={bulkOriginalPriceChangeType}
                              onChange={(e) => setBulkOriginalPriceChangeType(e.target.value as any)}
                              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                            >
                              <option value="">No Change (Keep Current Original Price)</option>
                              <option value="set">Set to Fixed Value (e.g. ₹999)</option>
                              <option value="remove">Remove Original Price (No discount badge)</option>
                            </select>
                          </div>
                          {bulkOriginalPriceChangeType === "set" && (
                            <div>
                              <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Original Price Value (₹)</label>
                              <input
                                required
                                type="number"
                                placeholder="e.g. 1200"
                                value={bulkOriginalPriceChangeValue}
                                onChange={(e) => setBulkOriginalPriceChangeValue(e.target.value)}
                                style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Description Row */}
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Change Description To</label>
                          <textarea
                            placeholder="Type new description here (Leave blank for no change)"
                            value={bulkDescription}
                            onChange={(e) => setBulkDescription(e.target.value)}
                            rows={3}
                            style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", resize: "none" }}
                          />
                        </div>
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-6" style={{ borderTop: `1px solid ${tableBorder}` }}>
                        <div>
                          {selectedIds.length > 0 && (
                            <button
                              type="button"
                              onClick={handleBulkDelete}
                              className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-semibold text-sm transition flex items-center gap-1.5"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.length})
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowBulkModal(false)}
                            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${inputBorder}`, color: textPrimary, background: "transparent" }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={bulkSubmitting}
                            className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white transition shadow-lg hover:shadow-indigo-500/20"
                          >
                            {bulkSubmitting ? "Updating..." : "Apply Bulk Updates"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </form>
              )}

              {/* Tab Content: Full Stock spreadsheet-like editor */}
              {bulkTab === "stock" && (
                <form onSubmit={handleBulkStockSubmit} className="p-5 space-y-4">
                  {/* Internal Filter Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textSecondary }} />
                    <input
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Quick filter products in stock sheet..."
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "6px 12px 6px 36px", color: textPrimary, outline: "none", fontSize: 13 }}
                    />
                  </div>

                  {/* Stock spreadsheet container */}
                  <div className="max-h-96 overflow-y-auto border rounded-xl" style={{ borderColor: tableBorder }}>
                    <table className="w-full text-xs font-sans text-left">
                      <thead style={{ background: theadBg, color: textSecondary }}>
                        <tr>
                          <th style={{ padding: "8px 12px", width: 280 }}>Product / Variant Name</th>
                          <th style={{ padding: "8px 12px" }}>Brand/Category & Colour</th>
                          <th style={{ padding: "8px 12px", width: 110, textAlign: "right" }}>Selling Price (₹)</th>
                          <th style={{ padding: "8px 12px", width: 110, textAlign: "right" }}>MRP / Orig (₹)</th>
                          <th style={{ padding: "8px 12px", width: 80, textAlign: "center" }}>Stock Value</th>
                          <th style={{ padding: "8px 12px", width: 50, textAlign: "center" }}>Reset</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredForStockSheet?.map((p) => (
                          <React.Fragment key={p.id}>
                            <tr style={{ borderTop: `1px solid ${tableBorder}` }} className="hover:bg-slate-800/20">
                              <td style={{ padding: "8px 12px" }} className="font-semibold text-slate-200">
                                <div className="flex items-center gap-2">
                                  <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
                                    {p.image && <img src={p.image} className="object-cover w-full h-full" />}
                                  </div>
                                  <input
                                    type="text"
                                    value={bulkNameMap[p.id] ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setBulkNameMap(prev => ({ ...prev, [p.id]: val }));
                                    }}
                                    style={{
                                      background: inputBg,
                                      border: `1px solid ${inputBorder}`,
                                      borderRadius: 6,
                                      color: textPrimary,
                                      outline: "none",
                                      padding: "4px 8px",
                                      fontSize: 12,
                                      width: "100%",
                                    }}
                                  />
                                </div>
                              </td>
                              <td style={{ padding: "8px 12px", color: textSecondary }}>
                                {p.brand || "Electro"} / {p.category?.name || "-"}
                                {p.hasVariants && (
                                  <span className="ml-1 text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold">
                                    {p.variants?.length || 0} Variants
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={bulkPriceMap[p.id] ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBulkPriceMap(prev => ({ ...prev, [p.id]: val }));
                                  }}
                                  style={{
                                    width: "90px",
                                    padding: "4px 8px",
                                    background: inputBg,
                                    border: `1px solid ${inputBorder}`,
                                    borderRadius: 6,
                                    color: textPrimary,
                                    outline: "none",
                                    textAlign: "right"
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                <span className="text-slate-500 text-[11px] font-mono">
                                  {p.originalPrice ? `₹${p.originalPrice}` : "-"}
                                </span>
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                <input
                                  type="number"
                                  min="0"
                                  value={bulkStockMap[p.id] ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBulkStockMap(prev => ({ ...prev, [p.id]: val }));
                                  }}
                                  style={{
                                    width: "70px",
                                    padding: "4px 8px",
                                    background: inputBg,
                                    border: `1px solid ${inputBorder}`,
                                    borderRadius: 6,
                                    color: textPrimary,
                                    outline: "none",
                                    textAlign: "center"
                                  }}
                                />
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                <button
                                  type="button"
                                  title="Reset row to current db values"
                                  onClick={() => {
                                    setBulkNameMap(prev => ({ ...prev, [p.id]: p.name }));
                                    setBulkPriceMap(prev => ({ ...prev, [p.id]: String(p.price) }));
                                    setBulkStockMap(prev => ({ ...prev, [p.id]: String(p.stock) }));
                                  }}
                                  className="p-1 rounded text-xs hover:bg-slate-700/50"
                                  style={{ color: textSecondary }}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>

                            {/* Variant Sub-Rows (If Show Variants is Enabled) */}
                            {showVariantsInBulk && Array.isArray(p.variants) && p.variants.map((v, vIdx) => (
                              <tr key={`v_${v.id || vIdx}`} className="bg-slate-900/40 dark:bg-slate-950/60 border-t border-dashed border-cyan-500/20">
                                <td style={{ padding: "6px 12px 6px 28px" }}>
                                  <div className="flex items-center gap-2">
                                    <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                    <div className="relative w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
                                      {(v.image || v.images?.[0] || p.image) && (
                                        <img src={v.image || v.images?.[0] || p.image} alt={v.color || "Variant"} className="object-cover w-full h-full" />
                                      )}
                                    </div>
                                    <div className="flex flex-col text-xs">
                                      <span className="font-semibold text-cyan-300">
                                        {v.ram || ""} {v.storage ? `+ ${v.storage}` : ""} {v.color ? `(${v.color})` : ""}
                                      </span>
                                      {v.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {v.sku}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "6px 12px" }} className="text-slate-400 text-xs">
                                  {v.color || "Standard"}
                                </td>
                                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={`₹${v.price}`}
                                    value={bulkVariantPriceMap[v.id || ""] ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (v.id) setBulkVariantPriceMap(prev => ({ ...prev, [v.id!]: val }));
                                    }}
                                    style={{
                                      width: "90px",
                                      padding: "3px 6px",
                                      background: inputBg,
                                      border: `1px solid ${inputBorder}`,
                                      borderRadius: 6,
                                      color: textPrimary,
                                      outline: "none",
                                      textAlign: "right",
                                      fontSize: 12
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={`₹${v.originalPrice || ""}`}
                                    value={bulkVariantOriginalPriceMap[v.id || ""] ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (v.id) setBulkVariantOriginalPriceMap(prev => ({ ...prev, [v.id!]: val }));
                                    }}
                                    style={{
                                      width: "90px",
                                      padding: "3px 6px",
                                      background: inputBg,
                                      border: `1px solid ${inputBorder}`,
                                      borderRadius: 6,
                                      color: textPrimary,
                                      outline: "none",
                                      textAlign: "right",
                                      fontSize: 12
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 12px", textAlign: "center" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder={`${v.stock}`}
                                    value={bulkVariantStockMap[v.id || ""] ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (v.id) setBulkVariantStockMap(prev => ({ ...prev, [v.id!]: val }));
                                    }}
                                    style={{
                                      width: "70px",
                                      padding: "3px 6px",
                                      background: inputBg,
                                      border: `1px solid ${inputBorder}`,
                                      borderRadius: 6,
                                      color: textPrimary,
                                      outline: "none",
                                      textAlign: "center",
                                      fontSize: 12
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "6px 12px", textAlign: "center" }}>
                                  <button
                                    type="button"
                                    title="Reset variant values"
                                    onClick={() => {
                                      if (v.id) {
                                        setBulkVariantPriceMap(prev => ({ ...prev, [v.id!]: String(v.price ?? "") }));
                                        setBulkVariantOriginalPriceMap(prev => ({ ...prev, [v.id!]: v.originalPrice != null ? String(v.originalPrice) : "" }));
                                        setBulkVariantStockMap(prev => ({ ...prev, [v.id!]: String(v.stock ?? "") }));
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-slate-700/50 text-slate-400"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        {filteredForStockSheet?.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: 24, textAlign: "center", color: textSecondary }}>
                              No products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-4 mt-6" style={{ borderTop: `1px solid ${tableBorder}` }}>
                    <div className="text-xs" style={{ color: textSecondary }}>
                      Editing catalog values for all {products.length} products
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkModal(false)}
                        style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${inputBorder}`, color: textPrimary, background: "transparent" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={bulkSubmitting}
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold text-white transition shadow-lg flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> {bulkSubmitting ? "Saving..." : "Save Catalog Changes"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
      {/* Variant Add / Edit Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div style={{ background: modalBgColor, borderRadius: 16, width: "100%", maxWidth: 640, border: `1px solid ${tableBorder}`, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary }} className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-500" /> {editingVariantIndex !== null ? "Edit Variant" : "Add New Variant"}
                </h3>
                <button type="button" onClick={() => setShowVariantModal(false)} style={{ color: textSecondary }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVariant} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>RAM</label>
                    <input
                      placeholder="e.g. 8GB"
                      value={variantFormData.ram}
                      onChange={(e) => setVariantFormData({ ...variantFormData, ram: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Storage</label>
                    <input
                      placeholder="e.g. 256GB"
                      value={variantFormData.storage}
                      onChange={(e) => setVariantFormData({ ...variantFormData, storage: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Color</label>
                    <input
                      placeholder="e.g. Blue"
                      value={variantFormData.color}
                      onChange={(e) => setVariantFormData({ ...variantFormData, color: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={variantFormData.price}
                      onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>MRP (₹)</label>
                    <input
                      type="number"
                      value={variantFormData.originalPrice || ""}
                      onChange={(e) => setVariantFormData({ ...variantFormData, originalPrice: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Stock Qty</label>
                    <input
                      type="number"
                      required
                      value={variantFormData.stock}
                      onChange={(e) => setVariantFormData({ ...variantFormData, stock: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>SKU</label>
                    <input
                      placeholder="e.g. MOT-G37-8-256-BLU"
                      value={variantFormData.sku}
                      onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: textSecondary, marginBottom: 4 }}>Barcode (Optional)</label>
                    <input
                      placeholder="e.g. 890123456789"
                      value={variantFormData.barcode || ""}
                      onChange={(e) => setVariantFormData({ ...variantFormData, barcode: e.target.value })}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none" }}
                    />
                  </div>
                </div>

                {/* Variant Specific Images */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textPrimary, marginBottom: 4 }}>
                    Variant Images (Specific to this color/spec)
                  </label>
                  <div className="space-y-2">
                    <label
                      htmlFor="variant-img-upload"
                      className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        variantDragActive
                          ? "border-cyan-500 bg-cyan-500/10 ring-4 ring-cyan-500/20 scale-[1.01]"
                          : "border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-cyan-500 hover:bg-cyan-500/5"
                      }`}
                    >
                      {variantUploading ? (
                        <div className="flex items-center gap-2 text-cyan-500 font-medium text-xs">
                          <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                          Uploading variant images...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center">
                          <Upload className={`w-5 h-5 mb-1 ${variantDragActive ? "text-cyan-400 animate-bounce" : "text-cyan-500"}`} />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Drag & Drop Variant Images here
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            or click to browse from device (PNG, JPG, WEBP)
                          </span>
                        </div>
                      )}
                    </label>
                    <input
                      type="file"
                      id="variant-img-upload"
                      multiple
                      accept="image/*"
                      onChange={handleVariantFileUpload}
                      disabled={variantUploading}
                      className="hidden"
                    />

                    {variantImages.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>Drag thumbnail or use arrows to reorder position. Index 1 = Cover Image.</span>
                          <span>{variantImages.length} images</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {variantImages.map((img, index) => (
                            <div
                              key={index}
                              draggable
                              onDragStart={() => setVariantDragIdx(index)}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setVariantDragOverIdx(index);
                              }}
                              onDragLeave={() => setVariantDragOverIdx(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (variantDragIdx !== null) moveVariantImage(variantDragIdx, index);
                                setVariantDragIdx(null);
                                setVariantDragOverIdx(null);
                              }}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 group shadow-sm transition-all cursor-move ${
                                variantDragOverIdx === index
                                  ? "border-cyan-500 scale-105 ring-2 ring-cyan-500/50"
                                  : variantDragIdx === index
                                  ? "opacity-40 border-dashed border-slate-400"
                                  : "border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <Image src={img} alt={`Variant ${index + 1}`} fill unoptimized className="object-contain p-1 pointer-events-none" />
                              <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur rounded px-1 py-0.5 z-10">
                                <GripVertical className="w-2.5 h-2.5 text-white" />
                                <span className="text-[8px] font-bold text-white">#{index + 1}</span>
                              </div>
                              {index === 0 && (
                                <span className="absolute bottom-0.5 left-0.5 bg-cyan-500 text-[7px] font-bold text-white px-1 py-0.5 rounded leading-none shadow z-10">
                                  Cover
                                </span>
                              )}
                              <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    title="Move left"
                                    onClick={() => moveVariantImage(index, index - 1)}
                                    className="h-4 w-4 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center shadow"
                                  >
                                    <MoveLeft className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                {index < variantImages.length - 1 && (
                                  <button
                                    type="button"
                                    title="Move right"
                                    onClick={() => moveVariantImage(index, index + 1)}
                                    className="h-4 w-4 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center shadow"
                                  >
                                    <MoveRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  title="Remove image"
                                  onClick={() => {
                                    const filtered = variantImages.filter((_, i) => i !== index);
                                    setVariantImages(filtered);
                                    setVariantFormData({ ...variantFormData, images: filtered, image: filtered[0] || "" });
                                  }}
                                  className="h-4 w-4 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center shadow"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variant Specifications Section */}
                <div style={{ borderTop: `1px solid ${tableBorder}`, paddingTop: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>
                    Variant Specifications (Overridden Specs for this Variant)
                  </label>
                  <div className="space-y-2">
                    {variantSpecRows.map((row, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          placeholder="Name (e.g., RAM)"
                          value={row.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariantSpecRows(prev => prev.map((r, i) => i === index ? { ...r, key: val } : r));
                          }}
                          style={{ width: "40%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "6px 10px", color: textPrimary, outline: "none", fontSize: 12 }}
                        />
                        <input
                          placeholder="Value (e.g., 8GB)"
                          value={row.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setVariantSpecRows(prev => prev.map((r, i) => i === index ? { ...r, value: val } : r));
                          }}
                          style={{ width: "50%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "6px 10px", color: textPrimary, outline: "none", fontSize: 12 }}
                        />
                        <button
                          type="button"
                          title="Delete specification"
                          onClick={() => {
                            setVariantSpecRows(prev => prev.filter((_, i) => i !== index));
                          }}
                          style={{ width: "10%", display: "flex", alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 8, color: "#ef4444" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVariantSpecRows(prev => [...prev, { key: "", value: "" }])}
                      className="text-xs text-cyan-500 hover:text-cyan-600 font-semibold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Specification Row
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${tableBorder}` }}>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variantFormData.isDefault}
                      onChange={(e) => setVariantFormData({ ...variantFormData, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    Make Default Selected Variant
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVariantModal(false)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 text-white font-semibold text-xs hover:bg-cyan-600 transition-colors"
                    >
                      Save Variant
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Matrix Generator Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div style={{ background: modalBgColor, borderRadius: 16, width: "100%", maxWidth: 540, border: `1px solid ${tableBorder}`, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
              <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary }} className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" /> Bulk Variant Matrix Generator
                </h3>
                <button type="button" onClick={() => setShowMatrixModal(false)} style={{ color: textSecondary }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter comma-separated values to automatically generate all variant combinations!
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">RAM Options (Comma Separated)</label>
                  <input
                    placeholder="e.g. 4GB, 6GB, 8GB"
                    value={matrixRams}
                    onChange={(e) => setMatrixRams(e.target.value)}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Options (Comma Separated)</label>
                  <input
                    placeholder="e.g. 64GB, 128GB, 256GB"
                    value={matrixStorages}
                    onChange={(e) => setMatrixStorages(e.target.value)}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Color Options (Comma Separated)</label>
                  <input
                    placeholder="e.g. Blue, Black, Green"
                    value={matrixColors}
                    onChange={(e) => setMatrixColors(e.target.value)}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", fontSize: 13 }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 11999"
                      value={matrixBasePrice}
                      onChange={(e) => setMatrixBasePrice(e.target.value)}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Stock Qty</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={matrixBaseStock}
                      onChange={(e) => setMatrixBaseStock(e.target.value)}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "8px 12px", color: textPrimary, outline: "none", fontSize: 13 }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3" style={{ borderTop: `1px solid ${tableBorder}` }}>
                  <button
                    type="button"
                    onClick={() => setShowMatrixModal(false)}
                    className="px-4 py-2 rounded-lg border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateMatrix}
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Generate Combinations
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
