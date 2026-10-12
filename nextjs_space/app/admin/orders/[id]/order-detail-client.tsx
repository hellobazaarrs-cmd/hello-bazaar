"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, MapPin, CreditCard, User, AlertTriangle, FileText, Upload, Download, CheckCircle, X, Trash2 } from "lucide-react";
import { generateTaxInvoicePdf } from "@/lib/pdf-invoice";

// Indian Currency Number-to-Words Converter helper
function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToWordsLessThanThousand = (n: number): string => {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  };

  if (num === 0) return "Zero Rupees only";

  let words = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remaining = Math.floor(num);

  if (crore > 0) {
    words += numToWordsLessThanThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += numToWordsLessThanThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += numToWordsLessThanThousand(thousand) + " Thousand ";
  }
  if (remaining > 0) {
    words += numToWordsLessThanThousand(remaining) + " ";
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
import { formatRupees, ORDER_STATUSES, ORDER_STATUS_LABELS, RETURN_STATUSES } from "@/lib/format";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  const handleDeleteOrder = async () => {
    if (!confirm(`Are you sure you want to delete Order #${order?.orderNumber || orderId}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      toast.success(`Order #${order?.orderNumber || orderId} deleted successfully`);
      router.push("/admin/orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    }
  };

  // Auto Invoice Generation Modal State
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [imeiMap, setImeiMap] = useState<Record<string, string>>({});
  const [invoiceNotes, setInvoiceNotes] = useState("Thanks for doing business with us!");
  const [shopAddress, setShopAddress] = useState("Bhagwanpur Hat (Purani Bazaar), Siwan");
  const [generating, setGenerating] = useState(false);

  // Edit billing amounts state
  const [showEditAmountsModal, setShowEditAmountsModal] = useState(false);
  const [editSubtotal, setEditSubtotal] = useState("");
  const [editShipping, setEditShipping] = useState("");
  const [editTax, setEditTax] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [savingAmounts, setSavingAmounts] = useState(false);

  const openEditAmounts = () => {
    setEditSubtotal(String(order?.subtotal ?? 0));
    setEditShipping(String(order?.shipping ?? 0));
    setEditTax(String(order?.tax ?? 0));
    setEditDiscount(String(order?.discount ?? 0));
    setEditTotal(String(order?.total ?? 0));
    setShowEditAmountsModal(true);
  };

  const handleAmountChange = (field: string, val: string) => {
    let sub = editSubtotal;
    let ship = editShipping;
    let tx = editTax;
    let disc = editDiscount;

    if (field === "subtotal") { sub = val; setEditSubtotal(val); }
    if (field === "shipping") { ship = val; setEditShipping(val); }
    if (field === "tax") { tx = val; setEditTax(val); }
    if (field === "discount") { disc = val; setEditDiscount(val); }

    const calculatedTotal = Number(sub || 0) + Number(tx || 0) + Number(ship || 0) - Number(disc || 0);
    setEditTotal(String(calculatedTotal >= 0 ? calculatedTotal : 0));
  };

  const saveAmounts = async () => {
    setSavingAmounts(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: Number(editSubtotal),
          shipping: Number(editShipping),
          tax: Number(editTax),
          discount: Number(editDiscount),
          total: Number(editTotal),
        }),
      });

      if (!res.ok) throw new Error("Failed to save amounts");
      toast.success("Billing details updated successfully!");
      setShowEditAmountsModal(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to save amounts");
    } finally {
      setSavingAmounts(false);
    }
  };

  const generateAutoInvoice = async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
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

      const dateObj = new Date(order.createdAt);
      const dateStr = dateObj.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
      const timeStr = dateObj.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

      const itemsForPdf = (order.items ?? []).map((it: any) => {
        const mrp = it.product?.mrp || it.price;
        const discount = mrp > it.price ? (mrp - it.price) : 0;
        const discountPercent = mrp > it.price ? ((mrp - it.price) / mrp) * 100 : 0;
        return {
          name: it.name || it.product?.name || "Product",
          imei: imeiMap[it.id] || "",
          color: it.product?.color || "Awesome Lavender",
          quantity: it.quantity,
          price: mrp,
          discount: discount,
          discountPercent: discountPercent,
          amount: it.price * it.quantity,
        };
      });

      const totalCalculatedDiscount = itemsForPdf.reduce((sum: number, i: any) => sum + (i.discount * i.quantity), 0) + (order.couponDiscount || 0);

      await generateTaxInvoicePdf(
        doc,
        {
          invoiceNumber: order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, "") : order.id.slice(-4),
          dateStr: dateStr,
          timeStr: timeStr,
          placeOfSupply: order.shippingAddress?.state ? `10-${order.shippingAddress.state}` : "10-Bihar",
          poDateStr: dateStr,
          poNumber: order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, "") : order.id.slice(-8),
          customer: {
            name: order.shippingAddress?.fullName || order.user?.name || "Customer",
            address: order.shippingAddress?.line1 || "",
            cityStatePincode: `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || "Bihar"} - ${order.shippingAddress?.pincode || ""}`,
            phone: order.shippingAddress?.phone || order.user?.phone || "",
          },
          items: itemsForPdf,
          subtotal: order.subtotal || order.total,
          total: order.total,
          received: Number(receivedAmount) || order.total,
          youSaved: totalCalculatedDiscount,
          terms: invoiceNotes || "1 Year Warranty !",
          store: {
            name: "Hello Bazaar",
            address: "SABJI MANDI BASANTPUR SIWAN",
            phone: "9504912525",
          },
        },
        base64Logo,
        base64Sig
      );

      const pdfBlob = doc.output("blob");

      const fd = new FormData();
      fd.append("files", new File([pdfBlob], `invoice-${order.orderNumber || order.id}.pdf`, { type: "application/pdf" }));

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();
      const url = data?.urls?.[0];

      if (!url) throw new Error("Invoice upload failed");

      // PATCH order database to update invoiceUrl & update status only if forward
      const currentStatusIdx = ORDER_STATUSES.indexOf(order.status as any);
      const invoiceStatusIdx = ORDER_STATUSES.indexOf("INVOICE_GENERATED" as any);

      const updatePayload: any = { invoiceUrl: url };
      if (currentStatusIdx !== -1 && currentStatusIdx < invoiceStatusIdx) {
        updatePayload.status = "INVOICE_GENERATED";
      }

      const updateRes = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!updateRes.ok) {
        const errJson = await updateRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update order");
      }
      
      toast.success("Invoice generated and uploaded successfully!");
      setShowAutoModal(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInvoice(true);
    const fd = new FormData();
    fd.append("files", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data?.urls?.[0];
      if (url) {
        // PATCH the order to update invoiceUrl
        const updateRes = await fetch(`/api/admin/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceUrl: url }),
        });
        if (!updateRes.ok) throw new Error("Failed to update order");
        toast.success("Invoice uploaded successfully");
        load();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload invoice");
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order?.invoiceUrl) return;
    try {
      const url = order.invoiceUrl;
      const isApp = typeof window !== "undefined" && (window as any).Capacitor !== undefined;

      if (isApp) {
        // Open the raw URL in the device's native system browser (e.g. Chrome)
        // so that the PDF downloads directly to the device's storage.
        window.open(url, "_system");
        return;
      }

      // On regular browsers (desktop/mobile), open the PDF directly in a new tab.
      window.open(url, "_blank");
    } catch (err) {
      console.error("Failed to download invoice:", err);
      window.open(order.invoiceUrl, "_blank");
    }
  };

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

  const load = async () => {
    try {
      const r = await fetch(`/api/admin/orders/${orderId}`);
      const d = await r.json();
      setOrder(d?.order ?? null);
      setNewStatus(d?.order?.status ?? "");
    } catch (e) {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const updateStatus = async () => {
    if (!newStatus || newStatus === order?.status) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) throw new Error();
      toast.success("Status updated");
      load();
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const tableBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const rowHoverBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  if (loading) {
    return <div className="text-center py-12" style={{ color: textSecondary }}>Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-12" style={{ color: textSecondary }}>Order not found</div>;
  }

  const address = order?.shippingAddress ?? {};
  const currentIdx = ORDER_STATUSES?.findIndex((s) => s === order?.status) ?? 0;

  const isReturnFlow = ["RETURN_REQUESTED", "RETURN_ACCEPTED", "RETURN_PROCESSING", "RETURN_SUCCESS", "REFUND_INITIATED", "REFUND_SUCCESS", "RETURN_DECLINED"].includes(order?.status);
  const currentReturnIdx = RETURN_STATUSES?.findIndex((s) => s === order?.status) ?? -1;

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <Toaster position="top-right" />
      <Link
        href="/admin/orders"
        style={{ color: textSecondary }}
        className="inline-flex items-center gap-2 hover:opacity-80 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full max-w-full overflow-x-hidden">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold break-all tracking-tight" style={{ color: textPrimary }}>Order {order?.orderNumber}</h1>
          <p style={{ fontSize: 13, color: textSecondary }}>
            Placed on {new Date(order?.createdAt ?? "").toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto max-w-full">
          {order?.status === "CANCELLED" ? (
            <div className="bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-extrabold px-3 py-2 rounded-lg flex items-center gap-1.5">
              <span>🔒 ORDER CANCELLED (PERMANENT LOCKED - STOCK RESTORED)</span>
            </div>
          ) : (
            <>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={order?.status === "CANCELLED"}
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: textPrimary,
                  borderRadius: 8,
                  padding: "8px 12px",
                  outline: "none",
                  fontSize: 13,
                }}
                className="flex-1 min-w-0 w-full sm:w-auto disabled:opacity-50"
              >
                {isReturnFlow ? (
                  <>
                    <option value="RETURN_REQUESTED">Return Requested (Pending Approval)</option>
                    {RETURN_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS?.[s] ?? s}
                      </option>
                    ))}
                    <option value="RETURN_DECLINED">Return Declined</option>
                  </>
                ) : (
                  <>
                    {ORDER_STATUSES?.filter((_, idx) => currentIdx === -1 || idx >= currentIdx)?.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS?.[s] ?? s}
                      </option>
                    ))}
                    {order?.status !== "CANCELLED" && <option value="CANCELLED">Cancelled</option>}
                  </>
                )}
              </select>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={updateStatus}
                  disabled={updating || newStatus === order?.status || order?.status === "CANCELLED"}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm disabled:opacity-50 text-white shrink-0 shadow-lg hover:shadow-cyan-500/20 transition"
                >
                  {updating ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={handleDeleteOrder}
                  className="px-3 py-2 rounded-lg font-bold text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 flex items-center gap-1.5 transition shrink-0"
                  title="Delete Order"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Order
                </button>
              </div>
            </>
          )}
        </div>

        {/* Return Request Banner & Actions */}
        {order?.status === "RETURN_REQUESTED" && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                Customer Order Return Requested
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-300">
              <strong>Return Reason:</strong>{" "}
              {order.tracking?.find((t: any) => t.status === "RETURN_REQUESTED")?.note?.replace("Customer Return Request: ", "") || "No reason provided"}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  setUpdating(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${orderId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "RETURN_ACCEPTED", note: "1. Return Accepted by Admin." }),
                    });
                    if (!res.ok) throw new Error();
                    toast.success("Return Request Accepted (Stage 1 Completed)!");
                    load();
                  } catch {
                    toast.error("Failed to accept return request");
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs text-white shadow-md transition"
              >
                1. Accept Return Request
              </button>
              <button
                onClick={async () => {
                  setUpdating(true);
                  try {
                    const res = await fetch(`/api/admin/orders/${orderId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "RETURN_DECLINED", note: "Return Declined by Admin." }),
                    });
                    if (!res.ok) throw new Error();
                    toast.success("Return Request Declined!");
                    load();
                  } catch {
                    toast.error("Failed to decline return request");
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 font-semibold text-xs text-white shadow-md transition"
              >
                Decline Return
              </button>
            </div>
          </div>
        )}

        {isReturnFlow && order?.status !== "RETURN_REQUESTED" && order?.status !== "RETURN_DECLINED" && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Return Pipeline Stage: <strong>{ORDER_STATUS_LABELS[order.status] || order.status}</strong></span>
          </div>
        )}

        {order?.status === "RETURN_DECLINED" && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <X className="w-5 h-5 text-red-400 shrink-0" />
            <span>Return Request for this order was DECLINED.</span>
          </div>
        )}
      </div>

      <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 16 }} className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-400" />
          {isReturnFlow ? "Return Tracking Status (5 Stages)" : "Tracking Status"}
        </h3>
        {order?.status === "CANCELLED" ? (
          <div className="bg-red-500/10 text-red-500 p-6 rounded-xl border border-red-500/20 text-center font-bold text-base flex items-center justify-center gap-2 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            ORDER CANCELLED
          </div>
        ) : isReturnFlow ? (
          /* 5-STAGE RETURN TRACKER FOR ADMIN */
          <div className="space-y-4 max-w-lg">
            {RETURN_STATUSES?.map((s, i) => {
              const done = currentReturnIdx !== -1 && i <= currentReturnIdx;
              const current = currentReturnIdx === i || (order.status === "RETURN_REQUESTED" && i === 0);
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow"
                    style={{
                      background: done
                        ? "linear-gradient(to bottom right, #10b981, #059669)"
                        : current ? "linear-gradient(to bottom right, #f59e0b, #d97706)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      color: done || current ? "#ffffff" : textSecondary,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: current ? 700 : done ? 600 : 400,
                        color: current ? "#f59e0b" : done ? "#10b981" : textSecondary,
                      }}
                    >
                      {ORDER_STATUS_LABELS?.[s] ?? s}
                    </span>
                    {s === "RETURN_ACCEPTED" && order.status === "RETURN_REQUESTED" && (
                      <span className="ml-2 text-xs text-amber-400 font-semibold">(Pending Admin Approval)</span>
                    )}
                    {s === "RETURN_SUCCESS" && done && (
                      <span className="ml-2 text-xs text-emerald-400 font-semibold">(Picked up from customer via OTP)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 max-w-lg">
            {ORDER_STATUSES?.map((s, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold"
                    style={{
                      background: done
                        ? "linear-gradient(to bottom right, #22d3ee, #2563eb)"
                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      color: done ? "#ffffff" : textSecondary,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: current ? 600 : 400,
                      color: current ? "#22d3ee" : done ? textPrimary : textSecondary,
                    }}
                  >
                    {ORDER_STATUS_LABELS?.[s] ?? s}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Box */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 12 }} className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" /> Customer
          </h3>
          <div style={{ fontSize: 14, color: textPrimary }} className="space-y-1">
            <div style={{ fontWeight: 500 }}>{order?.user?.name}</div>
            <div style={{ color: textSecondary }}>{order?.user?.email}</div>
            <div style={{ color: textSecondary }}>{order?.user?.phone ?? "-"}</div>
          </div>
        </div>

        {/* Shipping Box */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 12 }} className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" /> Shipping Address
          </h3>
          <div style={{ fontSize: 14, color: textPrimary }} className="space-y-1">
            <div style={{ fontWeight: 500 }}>{address?.fullName}</div>
            <div style={{ color: textSecondary }}>{address?.phone}</div>
            <div style={{ color: textSecondary }}>
              {address?.line1}
              {address?.line2 ? `, ${address?.line2}` : ""}
            </div>
            <div style={{ color: textSecondary }}>
              {address?.city}, {address?.state} {address?.pincode}
            </div>
          </div>
        </div>

        {/* Payment Box */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 12 }} className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" /> Payment
          </h3>
          <div style={{ fontSize: 14, color: textPrimary }} className="space-y-1">
            <div style={{ color: textSecondary }}>Method: <span style={{ color: textPrimary, fontWeight: 500 }}>{order?.paymentMethod}</span></div>
            <div style={{ color: textSecondary }}>Status: <span style={{ color: textPrimary, fontWeight: 500 }}>{order?.paymentStatus}</span></div>
            <div className="font-semibold mt-2 text-base" style={{ color: isDark ? "#34d399" : "#059669" }}>
              {formatRupees(order?.total ?? 0)}
            </div>
            {order?.paymentMethod === "UPI" && order?.paymentStatus === "PENDING" && (
              <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl text-xs font-semibold mt-3 flex items-center gap-2 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                <span>UNPAID UPI - DO NOT SHIP YET</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Management Box */}
        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 12 }} className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> Invoice
          </h3>
          <div className="space-y-3">
            {order?.invoiceUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                  <CheckCircle className="w-4 h-4" /> Invoice Uploaded
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={handleDownloadInvoice}
                    className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer border-none outline-none shadow hover:bg-slate-500 animate-fade-in"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => {
                      setReceivedAmount(String(order.total));
                      setPaymentMode(order.paymentMethod === "COD" ? "Cash" : "UPI");
                      setShowAutoModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer border-none outline-none shadow animate-fade-in"
                  >
                    <FileText className="w-3.5 h-3.5" /> Auto Regenerate
                  </button>
                  <label className="inline-flex items-center gap-1.5 bg-slate-600 hover:bg-slate-500 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer border-none outline-none shadow">
                    <Upload className="w-3.5 h-3.5" /> Replace Manual
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p style={{ fontSize: 12, color: textSecondary }}>No invoice uploaded yet.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setReceivedAmount(String(order.total));
                      setPaymentMode(order.paymentMethod === "COD" ? "Cash" : "UPI");
                      setShowAutoModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold text-white transition cursor-pointer shadow-lg hover:shadow-purple-500/20 border-none outline-none"
                  >
                    <FileText className="w-4 h-4" /> Generate Invoice (Auto)
                  </button>
                  
                  <label className="inline-flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-xs font-semibold text-white transition cursor-pointer text-center shadow">
                    {uploadingInvoice ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload Invoice (Manual PDF)
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleInvoiceUpload}
                      disabled={uploadingInvoice}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Box */}
      <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, padding: 20 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: textPrimary }} className="m-0">Items</h3>
          <button
            onClick={openEditAmounts}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 px-3 py-1.5 rounded-lg transition bg-cyan-500/5 hover:bg-cyan-500/10 flex items-center gap-1.5"
          >
            Edit Billing Amounts
          </button>
        </div>

        <div className="space-y-3">
          {(order?.items ?? [])?.map((item: any) => (
            <div
              key={item?.id}
              style={{
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                border: `1px solid ${tableBorder}`,
                borderRadius: 12,
                padding: 12
              }}
              className="flex items-center gap-3"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: inputBg }}>
                {(item?.image || item?.product?.image) && (
                  <Image
                    src={item?.image || item?.product?.image}
                    alt={item?.name || item?.product?.name || ""}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 500, color: textPrimary }} className="truncate">
                  {item?.name || item?.product?.name || "Product"}
                </div>
                <div style={{ fontSize: 13, color: textSecondary }}>
                  Qty: {item?.quantity} × {formatRupees(item?.price ?? 0)}
                </div>
              </div>
              <div style={{ fontWeight: 600, color: textPrimary }} className="whitespace-nowrap">
                {formatRupees((item?.price ?? 0) * (item?.quantity ?? 0))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 space-y-2 text-sm" style={{ borderTop: `1px solid ${tableBorder}` }}>
          <div className="flex justify-between" style={{ color: textSecondary }}>
            <span>Subtotal</span>
            <span style={{ color: textPrimary }}>{formatRupees(order?.subtotal ?? 0)}</span>
          </div>
          {Number(order?.discount ?? 0) > 0 && (
            <div className="flex justify-between" style={{ color: textSecondary }}>
              <span>Discount</span>
              <span className="text-red-400">-{formatRupees(order?.discount ?? 0)}</span>
            </div>
          )}
          <div className="flex justify-between" style={{ color: textSecondary }}>
            <span>GST / Tax</span>
            <span style={{ color: textPrimary }}>{formatRupees(order?.tax ?? 0)}</span>
          </div>
          <div className="flex justify-between" style={{ color: textSecondary }}>
            <span>Shipping</span>
            <span style={{ color: textPrimary }}>{formatRupees(order?.shipping ?? 0)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2" style={{ borderTop: `1px solid ${tableBorder}` }}>
            <span style={{ color: textPrimary }}>Total</span>
            <span style={{ color: "#22d3ee" }}>{formatRupees(order?.total ?? 0)}</span>
          </div>
        </div>

      </div>

      {/* Auto Invoice Modal */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            style={{ background: cardBg, borderColor: inputBorder }} 
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tableBorder }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                <FileText className="w-5 h-5 text-cyan-400" /> Generate Tax Invoice
              </h3>
              <button 
                onClick={() => setShowAutoModal(false)}
                className="p-1 rounded-full hover:bg-slate-800/10 dark:hover:bg-white/10 transition"
                style={{ color: textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Items Serial / IMEI */}
              <div>
                <label className="block font-semibold mb-2" style={{ color: textPrimary }}>Item Serials / IMEI</label>
                <div className="space-y-3">
                  {(order.items ?? []).map((it: any) => (
                    <div key={it.id} className="flex flex-col gap-1">
                      <span className="text-xs text-slate-500 font-medium">{it.name || it.product?.name} (Qty: {it.quantity})</span>
                      <input
                        type="text"
                        placeholder="Enter Serial / IMEI number"
                        value={imeiMap[it.id] || ""}
                        onChange={(e) => setImeiMap({ ...imeiMap, [it.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition bg-transparent"
                        style={{ borderColor: inputBorder, color: textPrimary }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: textPrimary }}>Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition bg-transparent"
                    style={{ borderColor: inputBorder, color: textPrimary, background: inputBg }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: textPrimary }}>Received Amount</label>
                  <input
                    type="number"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition bg-transparent"
                    style={{ borderColor: inputBorder, color: textPrimary }}
                  />
                </div>
              </div>

              {/* Shop Address Selector */}
              <div>
                <label className="block font-semibold mb-1" style={{ color: textPrimary }}>Shop Address</label>
                <select
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition bg-transparent"
                  style={{ borderColor: inputBorder, color: textPrimary, background: inputBg }}
                >
                  <option value="Bhagwanpur Hat (Purani Bazaar), Siwan" className="bg-slate-900 text-white">Bhagwanpur Hat (Purani Bazaar), Siwan</option>
                  <option value="Basantpur (Sabji Mandi) , Siwan" className="bg-slate-900 text-white">Basantpur (Sabji Mandi) , Siwan</option>
                </select>
              </div>

              {/* Custom Terms / Notes */}
              <div>
                <label className="block font-semibold mb-1" style={{ color: textPrimary }}>Terms & Conditions / Notes</label>
                <textarea
                  rows={3}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Exchange terms, warranty details, etc."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition bg-transparent resize-none"
                  style={{ borderColor: inputBorder, color: textPrimary }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: tableBorder }}>
              <button
                onClick={() => setShowAutoModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border transition"
                style={{ borderColor: inputBorder, color: textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={generateAutoInvoice}
                disabled={generating}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate & Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Billing Amounts Modal */}
      {showEditAmountsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            style={{ background: cardBg, borderColor: inputBorder }} 
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: tableBorder }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: textPrimary }}>
                Edit Billing Amounts
              </h3>
              <button 
                onClick={() => setShowEditAmountsModal(false)}
                className="p-1 rounded-full hover:bg-slate-800/10 dark:hover:bg-white/10 transition"
                style={{ color: textSecondary }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: textSecondary }}>Subtotal (₹)</label>
                <input
                  type="number"
                  value={editSubtotal}
                  onChange={(e) => handleAmountChange("subtotal", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ background: inputBg, color: textPrimary, borderColor: inputBorder }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: textSecondary }}>GST / Tax (₹)</label>
                <input
                  type="number"
                  value={editTax}
                  onChange={(e) => handleAmountChange("tax", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ background: inputBg, color: textPrimary, borderColor: inputBorder }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: textSecondary }}>Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={editShipping}
                  onChange={(e) => handleAmountChange("shipping", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ background: inputBg, color: textPrimary, borderColor: inputBorder }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: textSecondary }}>Discount (₹)</label>
                <input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => handleAmountChange("discount", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                  style={{ background: inputBg, color: textPrimary, borderColor: inputBorder }}
                />
              </div>

              <div className="pt-2 border-t" style={{ borderColor: tableBorder }}>
                <label className="block text-xs font-semibold mb-1" style={{ color: textSecondary }}>Grand Total (₹)</label>
                <input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-semibold focus:outline-none"
                  style={{ background: inputBg, color: "#22d3ee", borderColor: inputBorder }}
                />
                <span className="text-[10px] block mt-1" style={{ color: textSecondary }}>
                  Note: Total auto-recalculates when other fields change, but you can override it manually.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowEditAmountsModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800/10 dark:hover:bg-white/10 transition"
                style={{ color: textPrimary }}
              >
                Cancel
              </button>
              <button
                onClick={saveAmounts}
                disabled={savingAmounts}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 text-white shadow-lg hover:shadow-cyan-500/20 transition"
              >
                {savingAmounts ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

