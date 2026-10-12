"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Search, Pencil, Trash2, X, CheckCircle, ShieldAlert } from "lucide-react";
import { formatRupees } from "@/lib/format";
import toast, { Toaster } from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod: string;
  createdAt: string;
  user?: { name?: string; email?: string; phone?: string };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: { id: string; productName?: string; quantity?: number; price?: number }[];
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDark, setIsDark] = useState(true);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editNote, setEditNote] = useState("");
  const [updating, setUpdating] = useState(false);

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

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d?.orders ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteOrder = async (id: string, orderNum: string) => {
    if (!confirm(`Are you sure you want to delete Order #${orderNum}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      toast.success(`Order #${orderNum} deleted successfully`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete order");
    }
  };

  const handleOpenEditModal = (o: Order) => {
    setEditingOrder(o);
    setEditStatus(o.status || "ORDER_RECEIVED");
    setEditPaymentStatus(o.paymentStatus || "PENDING");
    setEditPaymentMethod(o.paymentMethod || "UPI");
    setEditTotal(String(o.total || 0));
    setEditCustomerName(o.shippingAddress?.fullName || o.user?.name || "");
    setEditCustomerPhone(o.shippingAddress?.phone || o.user?.phone || "");
    setEditNote("");
  };

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
          paymentMethod: editPaymentMethod,
          total: Number(editTotal),
          customerName: editCustomerName.trim(),
          customerPhone: editCustomerPhone.trim(),
          note: editNote.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update order");
      }

      toast.success(`Order #${editingOrder.orderNumber} updated successfully!`);
      setEditingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders?.filter((o) => {
    const matchesSearch =
      o?.orderNumber?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "") ||
      o?.user?.name?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "") ||
      o?.user?.email?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "") ||
      o?.shippingAddress?.fullName?.toLowerCase?.()?.includes?.(search?.toLowerCase?.() ?? "");
    const matchesStatus = statusFilter === "ALL" || o?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    "ALL",
    "ORDER_RECEIVED",
    "ORDER_ACCEPTED",
    "INVOICE_GENERATED",
    "PACKAGING_STARTED",
    "PACKAGING_COMPLETED",
    "READY_FOR_DISPATCH",
    "DISPATCHED",
    "IN_TRANSIT",
    "REACHED_LOCAL_HUB",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURN_ACCEPTED",
    "RETURN_PROCESSING",
    "RETURN_SUCCESS",
    "REFUND_INITIATED",
    "REFUND_SUCCESS",
    "RETURN_DECLINED",
  ];

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const inputBg = isDark ? "#0f172a" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";
  const tableBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const theadBg = isDark ? "rgba(15,23,42,0.5)" : "rgba(241,245,249,0.8)";
  const rowHoverBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  return (
    <div className="space-y-4 pb-12 w-full max-w-full overflow-x-hidden">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: textPrimary }}>Orders Management</h1>
          <p style={{ fontSize: 14, color: textSecondary }}>
            View, edit, and delete customer orders ({orders.length} total)
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or customer..."
            style={{
              width: "100%",
              background: inputBg,
              border: `1px solid ${inputBorder}`,
              borderRadius: 8,
              padding: "10px 16px 10px 44px",
              color: textPrimary,
              outline: "none",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: 8,
            padding: "10px 16px",
            color: textPrimary,
            outline: "none",
          }}
        >
          {statusOptions?.map((s) => (
            <option key={s} value={s}>
              {s?.replace?.(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${tableBorder}`, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: textSecondary }}>Loading...</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: theadBg, color: textSecondary }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Order #</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Customer</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Items</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Total</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600 }}>Payment</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 600 }}>Date</th>
                    <th style={{ textAlign: "center", padding: "12px 16px", fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((o) => (
                    <tr
                      key={o?.id}
                      style={{ borderTop: `1px solid ${tableBorder}`, transition: "background 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = rowHoverBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#22d3ee" }}>
                        {o?.orderNumber}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: textPrimary, fontWeight: 600 }}>
                          {o?.shippingAddress?.fullName || o?.user?.name || "-"}
                        </div>
                        <div style={{ fontSize: 11, color: textSecondary }}>
                          {o?.user?.email || o?.user?.phone || o?.shippingAddress?.phone || "-"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: textSecondary }}>{o?.items?.length ?? 0} items</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "#34d399" }}>
                        {formatRupees(o?.total ?? 0)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: o?.status === "CANCELLED" ? "rgba(239,68,68,0.1)" : "rgba(6,182,212,0.1)",
                            color: o?.status === "CANCELLED" ? "#f87171" : "#22d3ee",
                            fontSize: 11,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {o?.status?.replace?.(/_/g, " ") ?? "-"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: textSecondary, fontSize: 12 }}>
                        <span className="font-semibold text-slate-300">{o?.paymentMethod}</span>
                        {o?.paymentStatus && (
                          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            o.paymentStatus === "PAID"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : o.paymentStatus === "REFUND_INITIATED"
                              ? "bg-purple-500/20 text-purple-400"
                              : o.paymentStatus === "PAYMENT_REFUND" || o.paymentStatus === "REFUNDED"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {o.paymentStatus.replace(/_/g, " ")}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: textSecondary, fontSize: 12 }}>
                        {new Date(o?.createdAt ?? "").toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/admin/orders/${o?.id}`}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(o)}
                            title="Edit Order"
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                            title="Delete Order"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered?.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 32, textAlign: "center", color: textSecondary }}>
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden">
              {filtered?.map((o) => (
                <div key={o?.id} className="p-4 space-y-3" style={{ borderBottom: `1px solid ${tableBorder}` }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#22d3ee" }}>
                      {o?.orderNumber}
                    </span>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: o?.status === "CANCELLED" ? "rgba(239,68,68,0.1)" : "rgba(6,182,212,0.1)",
                        color: o?.status === "CANCELLED" ? "#f87171" : "#22d3ee",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {o?.status?.replace?.(/_/g, " ") ?? "-"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: textSecondary }}>
                    <div style={{ fontWeight: 600, color: textPrimary, marginBottom: 2 }}>
                      {o?.shippingAddress?.fullName || o?.user?.name || "-"}
                    </div>
                    <div>{o?.user?.email || o?.user?.phone || o?.shippingAddress?.phone || "-"}</div>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: textSecondary }}>
                    <div>Items: <span style={{ color: textPrimary, fontWeight: 500 }}>{o?.items?.length ?? 0}</span></div>
                    <div>Payment: <span style={{ color: textPrimary, fontWeight: 500 }}>{o?.paymentMethod}</span></div>
                    <div>{new Date(o?.createdAt ?? "").toLocaleDateString("en-IN")}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${tableBorder}` }}>
                    <div>
                      <span style={{ fontSize: 11, color: textSecondary }}>Total Amount</span>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>
                        {formatRupees(o?.total ?? 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/orders/${o?.id}`}
                        className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenEditModal(o)}
                        className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        title="Edit Order"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered?.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: textSecondary }}>
                  No orders found
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            style={{ background: cardBg, borderColor: inputBorder, color: textPrimary }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: inputBorder }}>
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Edit Order #{editingOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                  Order Pipeline Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                >
                  {statusOptions.filter((s) => s !== "ALL").map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                  >
                    <option value="PENDING">PENDING (Payment Pending)</option>
                    <option value="PAID">PAID (Payment Received)</option>
                    <option value="REFUND_INITIATED">REFUND INITIATED (Refund In Progress)</option>
                    <option value="PAYMENT_REFUND">PAYMENT REFUND (Refund Completed)</option>
                    <option value="FAILED">FAILED (Payment Failed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                    Payment Method
                  </label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                  >
                    <option value="UPI">UPI</option>
                    <option value="COD">COD (Cash on Delivery)</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="w-full text-xs font-bold text-emerald-400 rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: inputBorder }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                    Customer Mobile
                  </label>
                  <input
                    type="text"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl p-2.5 border outline-none"
                    style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                  Customer Full Name
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: textSecondary }}>
                  Admin Update Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Total revised by admin after custom discount"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl p-2.5 border outline-none"
                  style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: inputBorder }}>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Save Order Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
