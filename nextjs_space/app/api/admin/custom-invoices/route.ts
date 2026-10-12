import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-check";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "..", "electro_bazaar_data");
const INVOICES_FILE = path.join(DATA_DIR, "custom-invoices.json");

function ensureFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(INVOICES_FILE)) {
      fs.writeFileSync(INVOICES_FILE, JSON.stringify([]), "utf-8");
    }
  } catch (err) {
    console.error("Error creating custom-invoices storage directory:", err);
  }
}

function getStoredInvoices(): any[] {
  ensureFile();
  try {
    const data = fs.readFileSync(INVOICES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveInvoices(invoices: any[]) {
  ensureFile();
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const invoices = getStoredInvoices();
  // Sort descending by date
  invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ invoices });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, invoiceDate, store, customer, items, discountType, discountValue, discountAmount, taxPercent, taxAmount, subtotal, grandTotal, paymentMode, notes } = body ?? {};

    if (!customer?.fullName || !customer?.mobile) {
      return NextResponse.json({ error: "Customer name and mobile number are required." }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one product line item is required." }, { status: 400 });
    }

    const invoices = getStoredInvoices();
    const existingIndex = id ? invoices.findIndex((inv) => inv.id === id) : -1;

    let invoiceId = id;
    let invoiceNumber = body.invoiceNumber;
    let createdAt = invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString();

    if (existingIndex !== -1) {
      // Editing existing invoice
      invoiceNumber = invoiceNumber || invoices[existingIndex].invoiceNumber;
      if (!invoiceDate) {
        createdAt = invoices[existingIndex].createdAt;
      }
    } else {
      // New invoice
      invoiceId = "cinv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
      const count = invoices.length + 1;
      const dateStr = new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, "");
      invoiceNumber = `INV-${dateStr}-${String(count).padStart(4, "0")}`;
    }

    const invoiceData = {
      id: invoiceId,
      invoiceNumber,
      createdAt,
      store: {
        name: store?.name || "ElectroBazar Main Store",
        address: store?.address || "Main Road, Market Complex, City Center, Bihar - 800001",
        phone: store?.phone || "+91 9876543210",
        gstin: store?.gstin || "10AAAAA0000A1Z5",
        logoUrl: store?.logoUrl || "/logo.jpg",
      },
      customer: {
        fullName: customer.fullName,
        mobile: customer.mobile,
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "Bihar",
        pincode: customer.pincode || "",
        gstin: customer.gstin || "",
      },
      items: items.map((it: any) => ({
        id: it.id || "item_" + Math.random().toString(36).substr(2, 5),
        productName: it.productName || "Product",
        category: it.category || "General",
        color: it.color || "Standard",
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
        imei1: it.imei1 || "",
        imei2: it.imei2 || "",
      })),
      subtotal: Number(subtotal) || 0,
      discountType: discountType || "fixed",
      discountValue: Number(discountValue) || 0,
      discountAmount: Number(discountAmount) || 0,
      taxPercent: Number(taxPercent) || 0,
      taxAmount: Number(taxAmount) || 0,
      grandTotal: Number(grandTotal) || 0,
      paymentMode: paymentMode || "UPI",
      notes: notes || "Thanks for shopping with ElectroBazar! Visit again.",
    };

    if (existingIndex !== -1) {
      invoices[existingIndex] = invoiceData;
    } else {
      invoices.unshift(invoiceData);
    }

    saveInvoices(invoices);

    return NextResponse.json({ success: true, invoice: invoiceData });
  } catch (err: any) {
    console.error("Custom invoice POST error:", err);
    return NextResponse.json({ error: "Failed to save invoice: " + err.message }, { status: 500 });
  }
}
