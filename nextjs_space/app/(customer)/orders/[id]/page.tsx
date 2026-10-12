"use client";
import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Circle, Package, MapPin, CreditCard, ShoppingBag, AlertTriangle, Download, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatRupees, formatDateTime, ORDER_STATUSES, ORDER_STATUS_LABELS, RETURN_STATUSES } from "@/lib/format";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function OrderDetailPage({ params }: { params: any }) {
  const id = (params?.then ? use(params) : params)?.id as string;
  const { status } = useSession() || {};
  const router = useRouter();
  const sp = useSearchParams();
  const justPlaced = sp?.get("just") === "1";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        return data;
      }
    } catch (e) {
      console.error("Error fetching order:", e);
    }
    return null;
  }, [id]);

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to initiate payment");
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error("Failed to retrieve payment link");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      setPaying(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=/orders/${id}`);
    }
  }, [status, id, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [id, status, fetchOrder]);

  // Polling logic for pending UPI payments
  useEffect(() => {
    if (status !== "authenticated" || !id || !order) return;
    if (order.paymentMethod !== "UPI" || order.paymentStatus === "PAID" || order.status === "CANCELLED") return;

    let intervalId: any;
    let attempts = 0;
    const maxAttempts = 20; // 60 seconds total

    intervalId = setInterval(async () => {
      attempts++;
      const updatedOrder = await fetchOrder();
      if (!updatedOrder || updatedOrder.paymentStatus === "PAID" || attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, status, order?.paymentStatus, order?.paymentMethod, order?.status, fetchOrder]);

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

  if (status === "loading" || status === "unauthenticated" || loading) return <div className="mx-auto max-w-[1200px] px-4 py-12 text-center text-muted-foreground">Loading order...</div>;
  if (!order) return <div className="mx-auto max-w-[1200px] px-4 py-12 text-center text-muted-foreground">Order not found</div>;

  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const trackingMap = new Map<string, any>();
  for (const t of (order.tracking ?? [])) trackingMap.set(t.status, t);
  // Calculate return window eligibility
  const deliveredTrack = (order?.tracking || []).find((t: any) => t.status === "DELIVERED");
  const deliveryDateStr = deliveredTrack?.createdAt || order?.updatedAt || order?.createdAt;
  const deliveryTime = new Date(deliveryDateStr).getTime();
  const daysSinceDelivery = (Date.now() - deliveryTime) / (1000 * 60 * 60 * 24);

  let maxReturnDays = 7;
  if (order?.items && order.items.length > 0) {
    order.items.forEach((item: any) => {
      const policyStr = item.product?.returnPolicy || "";
      const match = policyStr.match(/(\d+)/);
      if (match) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days < maxReturnDays) maxReturnDays = days;
      }
    });
  }

  const isEligibleForReturn = order?.status === "DELIVERED" && daysSinceDelivery <= maxReturnDays;

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      toast.error("Please enter a reason for your return");
      return;
    }
    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/orders/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit return request");
        return;
      }
      toast.success("Return request submitted successfully!");
      setShowReturnModal(false);
      fetchOrder();
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const isReturnFlow = ["RETURN_REQUESTED", "RETURN_ACCEPTED", "RETURN_PROCESSING", "RETURN_SUCCESS", "REFUND_INITIATED", "REFUND_SUCCESS", "RETURN_DECLINED"].includes(order?.status);
  const currentReturnIdx = RETURN_STATUSES.indexOf(order?.status as any);
  const returnTrackingMap = new Map<string, any>((order?.tracking ?? []).map((t: any) => [t.status, t]));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      {order?.paymentStatus === "PAID" && order?.status !== "DELIVERED" && !isReturnFlow ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-5 mb-5 text-center shadow-md">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-white" />
          <h2 className="text-xl font-display font-bold">Payment Successful & Order Confirmed!</h2>
          <p className="text-white/90 text-sm mt-1">We have verified your payment. Thank you for shopping with Hello Bazaar!</p>
        </motion.div>
      ) : justPlaced ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl p-5 mb-5 text-center shadow-md">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-white" />
          <h2 className="text-xl font-display font-bold">Order Placed Successfully!</h2>
          <p className="text-white/90 text-sm mt-1">Thank you for shopping with Hello Bazaar. {order?.paymentMethod === "UPI" && "Please complete payment below to confirm."}</p>
        </motion.div>
      ) : null}

      {order?.status === "DELIVERED" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl p-5 mb-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold">Order Delivered Successfully!</h2>
              <p className="text-white/90 text-xs mt-0.5">Delivered on {formatDateTime(deliveryDateStr)}. Thank you for choosing Hello Bazaar!</p>
            </div>
          </div>
          {isEligibleForReturn && (
            <Button onClick={() => setShowReturnModal(true)} variant="secondary" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shrink-0 shadow">
              Request Return ({Math.ceil(maxReturnDays - daysSinceDelivery)} days left)
            </Button>
          )}
        </motion.div>
      )}

      {order?.deliveryOtp &&
        order?.status !== "CANCELLED" &&
        order?.status !== "DELIVERED" &&
        order?.status !== "RETURN_SUCCESS" &&
        order?.status !== "REFUND_INITIATED" &&
        order?.status !== "REFUND_SUCCESS" &&
        order?.status !== "RETURN_DECLINED" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/40 text-cyan-300 rounded-2xl p-5 mb-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <KeyRound className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {order.status.includes("RETURN") ? "Return Pickup OTP" : "Delivery Verification OTP"}
                </span>
              </div>
              <h3 className="font-display font-black text-base text-white mt-1">
                {order.status.includes("RETURN") ? "Share this 4-digit Return Pickup OTP with Delivery Executive" : "Share this 4-digit OTP with your Delivery Executive"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {order.status.includes("RETURN") ? "Do not share this OTP with anyone until your return item is picked up." : "Do not share this OTP with anyone until your package is handed over."}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 px-6 py-3 rounded-2xl border border-cyan-500/50 text-center shrink-0 shadow-inner">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {order.status.includes("RETURN") ? "Pickup OTP" : "Verification OTP"}
            </div>
            <div className="font-mono text-3xl font-black text-cyan-400 tracking-[0.25em] mt-0.5">
              {order.deliveryOtp}
            </div>
          </div>
        </motion.div>
      )}

      {/* Return Status Process Banner */}
      {isReturnFlow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 mb-5 shadow-md border ${
            order.status === "RETURN_DECLINED"
              ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
              : order.status === "REFUND_SUCCESS"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
              : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-center gap-3.5">
            {order.status === "REFUND_SUCCESS" ? (
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : order.status === "RETURN_DECLINED" ? (
              <div className="h-11 w-11 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
            )}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-current/10 px-2.5 py-1 rounded-full border border-current/20">
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              <h3 className="font-display font-bold text-base mt-1.5">
                {order.status === "RETURN_REQUESTED"
                  ? "Return Request Submitted (Pending Approval)"
                  : order.status === "RETURN_ACCEPTED"
                  ? "1. Accept Return Request (Approved by Admin)"
                  : order.status === "RETURN_PROCESSING"
                  ? "2. Return Processing (Pickup Scheduled)"
                  : order.status === "RETURN_SUCCESS"
                  ? "3. Return Success (Item Picked Up)"
                  : order.status === "REFUND_INITIATED"
                  ? "4. Payment Refund Initiated"
                  : order.status === "REFUND_SUCCESS"
                  ? "5. Payment Refund Success"
                  : "Return Request Declined"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {order.status === "RETURN_REQUESTED"
                  ? "Admin is reviewing your return request. You will be updated shortly."
                  : order.status === "RETURN_ACCEPTED"
                  ? "Stage 1 Complete: Your return has been accepted by Admin. Executive will arrive for pickup."
                  : order.status === "RETURN_PROCESSING"
                  ? "Stage 2 Active: Delivery partner is processing your return pickup."
                  : order.status === "RETURN_SUCCESS"
                  ? "Stage 3 Complete: Return item picked up successfully! Processing refund."
                  : order.status === "REFUND_INITIATED"
                  ? "Stage 4 Active: Refund payment has been initiated back to your source account."
                  : order.status === "REFUND_SUCCESS"
                  ? "Stage 5 Complete: Refund payment credited successfully to your account!"
                  : "Your return request was declined as it does not meet return guidelines."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <Link href="/orders" className="text-xs text-muted-foreground hover:text-foreground">← Back to orders</Link>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Order Details</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">{order.orderNumber}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          <section className="bg-card rounded-xl p-5 product-card-shadow">
            <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {isReturnFlow ? "Order Return Tracking (5 Stages)" : "Order Tracking"}
            </h2>
            {order.status === "CANCELLED" ? (
              <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center font-bold text-sm flex items-center justify-center gap-2 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
                This order has been cancelled.
              </div>
            ) : isReturnFlow ? (
              <ol className="relative">
                {RETURN_STATUSES.map((s, idx) => {
                  const done = currentReturnIdx !== -1 && idx <= currentReturnIdx;
                  const active = currentReturnIdx === idx || (order.status === "RETURN_REQUESTED" && idx === 0);
                  const t = returnTrackingMap.get(s);
                  return (
                    <li key={s} className="flex items-start gap-3 pb-5 last:pb-0 relative">
                      {idx < RETURN_STATUSES.length - 1 && (
                        <div className={`absolute left-[11px] top-7 bottom-0 w-0.5 ${currentReturnIdx !== -1 && idx < currentReturnIdx ? "bg-emerald-500" : "bg-border"}`} />
                      )}
                      <div className={`shrink-0 z-10 ${done ? "text-emerald-500" : active ? "text-amber-500" : "text-muted-foreground"}`}>
                        {done ? (
                          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : active ? (
                          <Circle className="h-6 w-6 text-amber-500 animate-pulse" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`text-sm font-bold ${done ? "text-emerald-500" : active ? "text-amber-500 font-extrabold" : "text-muted-foreground"}`}>
                          {ORDER_STATUS_LABELS[s]}
                        </p>
                        {t && <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(t.createdAt)}</p>}
                        {s === "RETURN_ACCEPTED" && order.status === "RETURN_REQUESTED" && (
                          <p className="text-xs text-amber-500/90 font-medium mt-0.5">Pending Admin Approval</p>
                        )}
                        {s === "RETURN_SUCCESS" && done && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            Picked up from customer by Delivery Executive via 4-digit OTP
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <ol className="relative">
                {ORDER_STATUSES.map((s, idx) => {
                  const done = idx <= currentIdx;
                  const active = idx === currentIdx;
                  const t = trackingMap.get(s);
                  return (
                    <li key={s} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                      {idx < ORDER_STATUSES.length - 1 && <div className={`absolute left-[11px] top-7 bottom-0 w-0.5 ${idx < currentIdx ? "bg-primary" : "bg-border"}`} />}
                      <div className={`shrink-0 z-10 ${done ? "text-primary" : "text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className={`h-6 w-6 ${active ? "animate-pulse" : ""}`} /> : <Circle className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{ORDER_STATUS_LABELS[s]}</p>
                        {t && <p className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="bg-card rounded-xl p-5 product-card-shadow">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" />Items</h2>
            <div className="divide-y divide-border">
              {(order.items ?? []).map((it: any) => (
                <div key={it.id} className="py-3 flex items-center gap-3">
                  <div className="h-14 w-14 bg-muted rounded-md overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img src={it.image} alt={it.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{formatRupees(it.price)} × {it.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatRupees(it.price * it.quantity)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {order.paymentMethod === "UPI" && order.paymentStatus === "PENDING" && (
            <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 product-card-shadow">
              <h2 className="font-display font-bold text-sm mb-1.5 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Payment Pending
              </h2>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Your UPI payment has not been received yet. Click below to complete your payment.</p>
              <Button
                onClick={handlePayNow}
                disabled={paying}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-10 rounded-lg text-xs"
              >
                {paying ? "Opening Gateway..." : "Pay Now"}
              </Button>
            </section>
          )}
          <section className="bg-card rounded-xl p-5 product-card-shadow">
            <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Shipping Address</h2>
            <div className="text-sm space-y-0.5">
              <p className="font-medium">{order.address?.fullName}</p>
              <p className="text-muted-foreground">{order.address?.phone}</p>
              <p>{order.address?.addressLine1}{order.address?.addressLine2 ? `, ${order.address.addressLine2}` : ""}</p>
              <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
            </div>
          </section>
          <section className="bg-card rounded-xl p-5 product-card-shadow">
            <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />Payment</h2>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{order.paymentMethod.replace("_", " ")}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                  order.paymentStatus === "PAID" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                  order.paymentStatus === "FAILED" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                  "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </section>
          <section className="bg-card rounded-xl p-5 product-card-shadow">
            <h2 className="font-display font-bold text-base mb-3">Order Total</h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupees(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{order.shipping === 0 ? "Free" : formatRupees(order.shipping)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd>{formatRupees(order.tax)}</dd></div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <dt className="flex items-center gap-1">Coupon ({order.couponCode})</dt>
                  <dd>−{formatRupees(order.couponDiscount)}</dd>
                </div>
              )}
              <div className="border-t border-border pt-1 mt-2"></div>
              <div className="flex justify-between font-bold text-base"><dt>Total</dt><dd className="font-display">{formatRupees(order.total)}</dd></div>
            </dl>
          </section>
          {order.invoiceUrl && order.status === "DELIVERED" && (
            <section className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 product-card-shadow">
              <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Download className="h-4 w-4" /> Invoice Ready
              </h2>
              <p className="text-xs text-muted-foreground mb-3">Your invoice is ready. Click below to download it.</p>
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm cursor-pointer border-none outline-none"
              >
                <Download className="h-4 w-4" /> Download Invoice
              </button>
            </section>
          )}
          <Link href="/products" className="block w-full"><Button variant="outline" className="w-full">Continue Shopping</Button></Link>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Request Order Return</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-muted-foreground hover:text-foreground text-xl font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Please provide a reason for returning this order. Our team will review your request and get back to you within 24 hours.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Return Reason</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Received wrong product / Product is defective / Changed mind"
                rows={4}
                className="w-full bg-muted border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReturnModal(false)}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReturnSubmit}
                disabled={submittingReturn}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {submittingReturn ? "Submitting..." : "Submit Return"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
