"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Download,
  Search,
  Store,
  User,
  ShoppingBag,
  IndianRupee,
  Calendar,
  CheckCircle,
  Eye,
  X,
  Share2,
  RefreshCw,
  Tag,
  Hash,
  Sparkles,
  Pencil,
  CreditCard,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import jsPDF from "jspdf";
import { generateTaxInvoicePdf } from "@/lib/pdf-invoice";

interface InvoiceItem {
  id: string;
  productName: string;
  category: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imei1: string;
  imei2: string;
}

interface StoreConfig {
  id: string;
  name: string;
  address: string;
  phone: string;
  gstin: string;
  logoUrl: string;
}

const STORE_PRESETS: StoreConfig[] = [
  {
    id: "main_store",
    name: "Hello Bazaar",
    address: "Basantpur / Main Sabji Mandi, Siwan, Bihar - 841406",
    phone: "+91 9504912525, 8434023311",
    gstin: "10AAAAA0000A1Z5",
    logoUrl: "/logo.jpg",
  },
  {
    id: "branch_1",
    name: "Hello Bazaar Branch",
    address: "Station Road, Near Super Market, Muzaffarpur, Bihar - 842001",
    phone: "+91 9504912525, 8434023311",
    gstin: "10BBBBB1111B1Z2",
    logoUrl: "/logo.jpg",
  },
];

const CATEGORY_PRESETS = [
  "Mobile Phones",
  "Laptops & Computers",
  "Smartwatches",
  "Audio & Headphones",
  "Accessories",
  "Television & Appliances",
  "Gaming",
];

export default function CustomInvoicesClient() {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");

  // Editing & Date Selection State
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Store Selection
  const [selectedStoreId, setSelectedStoreId] = useState<string>("main_store");
  const [customStore, setCustomStore] = useState<StoreConfig>(STORE_PRESETS[0]);

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("Patna");
  const [customerState, setCustomerState] = useState("Bihar");
  const [customerPincode, setCustomerPincode] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");

  // Manual Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      productName: "",
      category: "Mobile Phones",
      color: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      imei1: "",
      imei2: "",
    },
  ]);

  // Pricing & Discounts
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [notes, setNotes] = useState("Thanks for shopping with ElectroBazar! 1 Year Brand Warranty Applicable.");

  // Saving / Preview State
  const [saving, setSaving] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

  // Theme Sync
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const checkDark = () => {
      const dark = document.documentElement.classList.contains("dark") || localStorage.getItem("admin-theme") !== "light";
      setIsDark(dark);
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Sync Store Selection Preset
  useEffect(() => {
    const preset = STORE_PRESETS.find((s) => s.id === selectedStoreId);
    if (preset) {
      setCustomStore({ ...preset });
    }
  }, [selectedStoreId]);

  // Fetch History
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/custom-invoices");
      if (res.ok) {
        const data = await res.json();
        setSavedInvoices(data.invoices || []);
      }
    } catch {
      toast.error("Failed to load invoice history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Item List Handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) || 0 : item.quantity;
          const price = field === "unitPrice" ? Number(value) || 0 : item.unitPrice;
          updated.totalPrice = qty * price;
        }
        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        productName: "",
        category: "Mobile Phones",
        color: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        imei1: "",
        imei2: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.error("At least one product item is required");
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live Calculation Math
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const numDiscVal = Number(discountValue) || 0;
  const discountAmount =
    discountType === "percent"
      ? Math.round((subtotal * Math.min(100, Math.max(0, numDiscVal))) / 100)
      : Math.min(subtotal, Math.max(0, numDiscVal));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
  const grandTotal = afterDiscount + taxAmount;

  // Generate & Save Invoice Handler
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerMobile.trim()) {
      toast.error("Please enter customer Name and Mobile Number");
      return;
    }

    const invalidItem = items.find((it) => !it.productName.trim() || !it.unitPrice);
    if (invalidItem) {
      toast.error("Please complete Product Name and Price for all items");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingInvoiceId || undefined,
        invoiceNumber: editingInvoiceNumber || undefined,
        invoiceDate,
        store: customStore,
        customer: {
          fullName: customerName.trim(),
          mobile: customerMobile.trim(),
          address: customerAddress.trim(),
          city: customerCity.trim(),
          state: customerState.trim(),
          pincode: customerPincode.trim(),
          gstin: customerGstin.trim(),
        },
        items,
        subtotal,
        discountType,
        discountValue: numDiscVal,
        discountAmount,
        taxPercent,
        taxAmount,
        grandTotal,
        paymentMode,
        notes,
      };

      const res = await fetch("/api/admin/custom-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invoice");
      }

      const data = await res.json();
      toast.success(`Invoice ${data.invoice.invoiceNumber} ${editingInvoiceId ? "updated" : "generated"} & saved!`);
      setPreviewInvoice(data.invoice);
      setEditingInvoiceId(null);
      setEditingInvoiceNumber("");
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setSaving(false);
    }
  };

function numberToWords(num: number): string {
  if (!num || num <= 0) return "Zero Rupees only";

  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + " ";
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      if (n % 10 > 0) {
        str += single[n % 10] + " ";
      }
    } else if (n > 0) {
      str += single[n] + " ";
    }
    return str;
  }

  let words = "";
  let n = Math.floor(num);

  if (n >= 10000000) {
    words += convertLessThanThousand(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    words += convertLessThanThousand(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    words += convertLessThanThousand(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanThousand(n);
  }

  return (words.trim() + " Rupees only").replace(/\s+/g, " ");
}

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

  // PDF Generation via jsPDF (ElectroBazar Branded)
  const generatePDF = async (inv: any, action: "download" | "print" = "download") => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let base64Logo = "";
      try {
        base64Logo = await getBase64ImageFromUrl("/logo.jpg");
      } catch {
        try {
          base64Logo = await getBase64ImageFromUrl("/logo.png");
        } catch {
          // ignore
        }
      }

      let base64Sig = "";
      try {
        base64Sig = await getBase64ImageFromUrl("/signature.png");
      } catch {
        // ignore
      }

      const dateObj = new Date(inv.createdAt || Date.now());
      const dateStr = dateObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
      const timeStr = dateObj.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

      const itemsForPdf = (inv.items ?? []).map((it: any) => {
        const price = Number(it.price) || 0;
        const discount = Number(it.discountAmount) || 0;
        const mrp = price + discount;
        const discountPercent = mrp > price ? (discount / mrp) * 100 : 0;
        return {
          name: it.productName || "Product",
          imei: it.imei || "",
          color: it.color || "Awesome Lavender",
          quantity: Number(it.quantity) || 1,
          price: mrp,
          discount: discount,
          discountPercent: discountPercent,
          amount: (Number(it.totalPrice) || (price * (Number(it.quantity) || 1))),
        };
      });

      const totalCalculatedDiscount = itemsForPdf.reduce((sum: number, i: any) => sum + (i.discount * i.quantity), 0) + (Number(inv.discountAmount) || 0);

      await generateTaxInvoicePdf(
        doc,
        {
          invoiceNumber: inv.invoiceNumber || "1072",
          dateStr: dateStr,
          timeStr: timeStr,
          placeOfSupply: inv.customer?.state ? `10-${inv.customer.state}` : "10-Bihar",
          poDateStr: dateStr,
          poNumber: inv.poNumber || inv.invoiceNumber || "91428 47142",
          customer: {
            name: inv.customer?.fullName || "Customer",
            address: inv.customer?.address || "",
            cityStatePincode: `${inv.customer?.city || "Siwan"}, ${inv.customer?.state || "Bihar"} - ${inv.customer?.pincode || ""}`,
            phone: inv.customer?.mobile || "",
          },
          items: itemsForPdf,
          subtotal: inv.subtotal || inv.grandTotal,
          total: inv.grandTotal,
          received: inv.grandTotal,
          youSaved: totalCalculatedDiscount,
          terms: inv.notes || "1 Year Warranty !",
          store: {
            name: "Hello Bazaar",
            address: inv.store?.address || "SABJI MANDI BASANTPUR SIWAN",
            phone: inv.store?.phone || "9504912525",
          },
        },
        base64Logo,
        base64Sig
      );

      if (action === "download") {
        doc.save(`${inv.invoiceNumber}.pdf`);
        toast.success(`Downloaded ${inv.invoiceNumber}.pdf`);
      } else {
        doc.autoPrint();
        window.open(doc.output("bloburl"), "_blank");
      }
      return;
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF invoice");
    }
  };

  const handleEditInvoice = (inv: any) => {
    setEditingInvoiceId(inv.id);
    setEditingInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(inv.createdAt ? new Date(inv.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setCustomStore(inv.store || STORE_PRESETS[0]);
    setCustomerName(inv.customer?.fullName || "");
    setCustomerMobile(inv.customer?.mobile || "");
    setCustomerAddress(inv.customer?.address || "");
    setCustomerCity(inv.customer?.city || "Siwan");
    setCustomerState(inv.customer?.state || "10-Bihar");
    setCustomerPincode(inv.customer?.pincode || "");
    setCustomerGstin(inv.customer?.gstin || "");
    setItems(
      Array.isArray(inv.items) && inv.items.length > 0
        ? inv.items.map((it: any) => ({
            id: it.id || String(Math.random()),
            productName: it.productName || "",
            category: it.category || "Mobile Phones",
            color: it.color || "",
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            totalPrice: Number(it.totalPrice) || 0,
            imei1: it.imei1 || "",
            imei2: it.imei2 || "",
          }))
        : [
            {
              id: "1",
              productName: "",
              category: "Mobile Phones",
              color: "",
              quantity: 1,
              unitPrice: 0,
              totalPrice: 0,
              imei1: "",
              imei2: "",
            },
          ]
    );
    setDiscountType(inv.discountType || "fixed");
    setDiscountValue(inv.discountValue != null ? String(inv.discountValue) : "");
    setTaxPercent(inv.taxPercent != null ? Number(inv.taxPercent) : 0);
    setPaymentMode(inv.paymentMode || "UPI");
    setNotes(inv.notes || "Thanks for doing business with us! Warranty: 1 Year Manufacturer Warranty.");
    setActiveTab("create");
    toast.success(`Editing Invoice ${inv.invoiceNumber}`);
  };

  const handleDeleteInvoice = async (id: string, invNum: string) => {
    if (!confirm(`Are you sure you want to delete Invoice ${invNum}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/custom-invoices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      toast.success(`Invoice ${invNum} deleted successfully`);
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoice");
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingInvoiceId(null);
    setEditingInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setCustomerName("");
    setCustomerMobile("");
    setCustomerAddress("");
    setCustomerCity("Siwan");
    setCustomerState("10-Bihar");
    setCustomerPincode("");
    setCustomerGstin("");
    setItems([
      {
        id: "1",
        productName: "",
        category: "Mobile Phones",
        color: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        imei1: "",
        imei2: "",
      },
    ]);
    setDiscountType("fixed");
    setDiscountValue("");
    setTaxPercent(0);
    setPaymentMode("UPI");
    setPreviewInvoice(null);
  };

  const filteredHistory = savedInvoices.filter(
    (inv) =>
      inv.invoiceNumber?.toLowerCase().includes(searchHistory.toLowerCase()) ||
      inv.customer?.fullName?.toLowerCase().includes(searchHistory.toLowerCase()) ||
      inv.customer?.mobile?.includes(searchHistory)
  );

  const containerBg = isDark ? "#0f172a" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const borderClr = isDark ? "#334155" : "#e2e8f0";
  const inputBg = isDark ? "#0f172a" : "#f1f5f9";

  return (
    <div className="space-y-6 pb-20">
      <Toaster position="top-right" />

      {/* Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: textPrimary }}>
            <FileText className="w-7 h-7 text-cyan-500" /> POS Billing & Custom Invoices
          </h1>
          <p className="text-xs font-medium" style={{ color: textSecondary }}>
            Generate official branded Tax Invoices with Store Selection, IMEI tracking & Discount options.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl border" style={{ borderColor: borderClr }}>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "create" ? "bg-cyan-500 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            <Plus className="w-4 h-4" /> Create New Invoice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "history" ? "bg-cyan-500 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" /> Invoice Records ({savedInvoices.length})
          </button>
        </div>
      </div>

      {activeTab === "create" && (
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          {editingInvoiceId && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <Pencil className="w-4 h-4" /> Editing Existing Invoice: <span className="font-mono text-white bg-amber-500/20 px-2 py-0.5 rounded">{editingInvoiceNumber}</span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* Section 1: Store & Branch Config */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: borderClr }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                <Store className="w-4 h-4 text-cyan-500" /> Store / Franchise Branch Details & Date
              </h2>
              <span className="text-[11px] text-cyan-500 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                Official Logo & GST Included
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-cyan-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Select Store Location
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                >
                  {STORE_PRESETS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Store Contact Number
                </label>
                <input
                  type="text"
                  value={customStore.phone}
                  onChange={(e) => setCustomStore({ ...customStore, phone: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Store GSTIN Number
                </label>
                <input
                  type="text"
                  value={customStore.gstin}
                  onChange={(e) => setCustomStore({ ...customStore, gstin: e.target.value })}
                  className="w-full text-xs font-mono font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                Store Full Address
              </label>
              <input
                type="text"
                value={customStore.address}
                onChange={(e) => setCustomStore({ ...customStore, address: e.target.value })}
                className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
              />
            </div>
          </div>

          {/* Section 2: Customer Details */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="border-b pb-3" style={{ borderColor: borderClr }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                <User className="w-4 h-4 text-cyan-500" /> Customer Information (Billing Details)
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Customer Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Yuvraj Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patna"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  State & Pincode
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="State"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="w-2/3 text-xs font-medium rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={customerPincode}
                    onChange={(e) => setCustomerPincode(e.target.value)}
                    className="w-1/3 text-xs font-medium rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Customer Street Address
                </label>
                <input
                  type="text"
                  placeholder="House No., Street Name, Area"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                  Customer GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Optional B2B GSTIN"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  className="w-full text-xs font-mono font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Manual Product Line Items (IMEI 1, IMEI 2, Category, Colour) */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: borderClr }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                <ShoppingBag className="w-4 h-4 text-cyan-500" /> Manual Product Line Items (IMEI & Specs)
              </h2>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border relative space-y-3 transition-all"
                  style={{ background: inputBg, borderColor: borderClr }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">
                      Line Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                        Product Name / Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Motorola G37 Power 5G (8GB/256GB)"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                        className="w-full text-xs font-semibold rounded-lg p-2 border outline-none"
                        style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                        Category
                      </label>
                      <input
                        type="text"
                        list={`categories_${idx}`}
                        placeholder="e.g. Mobile Phones"
                        value={item.category}
                        onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                        className="w-full text-xs font-semibold rounded-lg p-2 border outline-none"
                        style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                      />
                      <datalist id={`categories_${idx}`}>
                        {CATEGORY_PRESETS.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                        Colour / Variant
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PANTONE Black"
                        value={item.color}
                        onChange={(e) => handleItemChange(idx, "color", e.target.value)}
                        className="w-full text-xs font-semibold rounded-lg p-2 border outline-none"
                        style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                      />
                    </div>
                  </div>

                  {/* IMEI 1, IMEI 2, Qty & Rate */}
                  <div className="grid md:grid-cols-4 gap-3 pt-1 border-t border-dashed" style={{ borderColor: borderClr }}>
                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-cyan-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> IMEI 1 / Serial No.
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 865492048572019"
                        value={item.imei1}
                        onChange={(e) => handleItemChange(idx, "imei1", e.target.value)}
                        className="w-full text-xs font-mono font-semibold rounded-lg p-2 border outline-none"
                        style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1 text-cyan-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> IMEI 2 (Dual SIM)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 865492048572027"
                        value={item.imei2}
                        onChange={(e) => handleItemChange(idx, "imei2", e.target.value)}
                        className="w-full text-xs font-mono font-semibold rounded-lg p-2 border outline-none"
                        style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                        Quantity & Unit Price (₹)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-1/3 text-xs font-bold rounded-lg p-2 border outline-none text-center"
                          style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                        />
                        <input
                          required
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Rate ₹"
                          value={item.unitPrice || ""}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          className="w-2/3 text-xs font-bold rounded-lg p-2 border outline-none text-right"
                          style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: textSecondary }}>
                        Line Item Total Amount
                      </label>
                      <div className="w-full text-xs font-extrabold rounded-lg p-2 border text-right text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                        ₹{item.totalPrice.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Discount, Tax & Totals Section */}
          <div className="p-5 rounded-2xl border shadow-sm space-y-4" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="border-b pb-3 flex items-center justify-between" style={{ borderColor: borderClr }}>
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                <IndianRupee className="w-4 h-4 text-cyan-500" /> Invoice Pricing & Discount Options
              </h2>
              <span className="text-xs font-extrabold text-cyan-500">Live Auto Calculation</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Discount Controls & Notes */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border space-y-3" style={{ background: inputBg, borderColor: borderClr }}>
                  <label className="block text-xs font-bold text-cyan-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Customer Discount
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-1/3 text-xs font-semibold rounded-lg p-2 border outline-none"
                      style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                    >
                      <option value="fixed">Rupees (₹)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder={discountType === "percent" ? "e.g. 10%" : "e.g. 500"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-2/3 text-xs font-bold rounded-lg p-2 border outline-none text-right"
                      style={{ background: cardBg, borderColor: borderClr, color: textPrimary }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                    Tax / GST Percentage (%)
                  </label>
                  <select
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full text-xs font-semibold rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                  >
                    <option value={0}>0% (Tax Inclusive / Exempted)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST (Standard Electronics)</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1" style={{ color: textSecondary }}>
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Payment Mode / Method
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                  >
                    <option value="UPI">UPI (PhonePe / GPay / Paytm / QR)</option>
                    <option value="Cash">Cash / Cash Payment</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: textSecondary }}>
                    Invoice Notes / Terms & Conditions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none resize-none"
                    style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
                  />
                </div>
              </div>

              {/* Right Column: Calculation Summary */}
              <div className="p-5 rounded-xl border flex flex-col justify-between space-y-3" style={{ background: inputBg, borderColor: borderClr }}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Payment Breakdown</h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold" style={{ color: textSecondary }}>
                    <span>Subtotal ({items.length} items):</span>
                    <span className="font-mono text-slate-200">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between font-semibold text-red-500">
                      <span>Discount ({discountType === "percent" ? discountValue + "%" : "₹" + discountValue}):</span>
                      <span className="font-mono">- ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {taxAmount > 0 && (
                    <div className="flex justify-between font-semibold text-cyan-400">
                      <span>GST ({taxPercent}%):</span>
                      <span className="font-mono">+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 flex justify-between items-baseline" style={{ borderColor: borderClr }}>
                    <span className="text-sm font-extrabold" style={{ color: textPrimary }}>
                      Grand Total Amount:
                    </span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl border text-xs font-bold hover:bg-slate-800 transition-colors"
                    style={{ borderColor: borderClr, color: textSecondary }}
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving Invoice...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Save & Generate Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Invoice Saved Modal Preview */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="p-6 rounded-2xl border max-w-lg w-full space-y-4 shadow-2xl" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: borderClr }}>
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                <CheckCircle className="w-5 h-5" /> Invoice Generated Successfully!
              </div>
              <button onClick={() => setPreviewInvoice(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Invoice Number:</span>
                <span className="font-mono font-bold text-cyan-400">{previewInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Customer:</span>
                <span className="font-bold">{previewInvoice.customer?.fullName} (+91 {previewInvoice.customer?.mobile})</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: textSecondary }}>Total Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{previewInvoice.grandTotal?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => generatePDF(previewInvoice, "download")}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => generatePDF(previewInvoice, "print")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Records / History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border" style={{ background: cardBg, borderColor: borderClr }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by Invoice No, Customer Name or Mobile..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full text-xs font-medium rounded-xl p-2.5 pl-9 border outline-none"
                style={{ background: inputBg, borderColor: borderClr, color: textPrimary }}
              />
            </div>
            <button
              onClick={fetchHistory}
              className="px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors"
              style={{ borderColor: borderClr, color: textPrimary }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} /> Refresh List
            </button>
          </div>

          <div className="overflow-x-auto border rounded-2xl shadow-sm" style={{ background: cardBg, borderColor: borderClr }}>
            <table className="w-full text-xs text-left">
              <thead className="border-b bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-medium">
                {filteredHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-cyan-400">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-400">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="p-3">
                      <div className="font-bold">{inv.customer?.fullName}</div>
                      <div className="text-[10px] text-slate-400">+91 {inv.customer?.mobile}</div>
                    </td>
                    <td className="p-3 text-slate-300">
                      {inv.items?.length || 0} line items
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      ₹{inv.grandTotal?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditInvoice(inv)}
                          title="Edit Invoice"
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => generatePDF(inv, "download")}
                          title="Download PDF"
                          className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => generatePDF(inv, "print")}
                          title="Print Invoice"
                          className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          title="Delete Invoice"
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      No custom invoices generated yet. Click &quot;Create New Invoice&quot; above to issue your first invoice!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
