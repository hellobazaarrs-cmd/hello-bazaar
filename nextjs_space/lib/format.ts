export function formatRupees(value: number | null | undefined): string {
  const num = value ?? 0;
  return "₹" + Math.round(num).toLocaleString("en-IN");
}

export const formatPrice = formatRupees;

export function formatRupeesDecimal(value: number | null | undefined): string {
  const num = value ?? 0;
  return "\u20B9" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", { 
    timeZone: "Asia/Kolkata", 
    year: "numeric", 
    month: "short", 
    day: "numeric", 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });
}

export const ORDER_STATUSES = [
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
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const RETURN_STATUSES = [
  "RETURN_ACCEPTED",
  "RETURN_PROCESSING",
  "RETURN_SUCCESS",
  "REFUND_INITIATED",
  "REFUND_SUCCESS",
] as const;

export type ReturnStatus = typeof RETURN_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  ORDER_RECEIVED: "Order Received",
  ORDER_ACCEPTED: "Order Accepted",
  INVOICE_GENERATED: "Invoice Generated",
  PACKAGING_STARTED: "Packaging Started",
  PACKAGING_COMPLETED: "Packaging Completed",
  READY_FOR_DISPATCH: "Ready For Dispatch",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In Transit",
  REACHED_LOCAL_HUB: "Reached Local Hub",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested (Pending)",
  RETURN_ACCEPTED: "1. Accept Return Request",
  RETURN_PROCESSING: "2. Return Processing",
  RETURN_SUCCESS: "3. Return Success",
  REFUND_INITIATED: "4. Payment Refund Initiated",
  REFUND_SUCCESS: "5. Payment Refund Success",
  RETURN_DECLINED: "Return Declined",
};

export function getStatusIndex(status: string): number {
  return ORDER_STATUSES.indexOf(status as any);
}

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "REFUND_INITIATED",
  "PAYMENT_REFUND",
  "FAILED",
] as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  REFUND_INITIATED: "Refund Initiated",
  PAYMENT_REFUND: "Payment Refunded",
  FAILED: "Failed",
};

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "In which city were you born?",
  "What is your favorite movie?",
  "What is your favorite food?",
  "What was the model of your first car?",
];
