import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-check";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "..", "electro_bazaar_data");
const INVOICES_FILE = path.join(DATA_DIR, "custom-invoices.json");

function getStoredInvoices(): any[] {
  try {
    if (!fs.existsSync(INVOICES_FILE)) return [];
    const data = fs.readFileSync(INVOICES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function saveInvoices(invoices: any[]) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const invoices = getStoredInvoices();
  const invoice = invoices.find((inv) => inv.id === params.id || inv.invoiceNumber === params.id);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json({ invoice });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const invoices = getStoredInvoices();
  const filtered = invoices.filter((inv) => inv.id !== params.id && inv.invoiceNumber !== params.id);

  if (filtered.length === invoices.length) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  saveInvoices(filtered);
  return NextResponse.json({ success: true });
}
