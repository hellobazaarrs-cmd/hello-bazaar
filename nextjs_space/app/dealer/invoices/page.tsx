"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { useSession } from "next-auth/react";
import { FileText, Search, Download, PlusCircle, Store, MapPin, Phone, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { generateTaxInvoicePdf } from "@/lib/pdf-invoice";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function DealerInvoicesPage() {
  const { data: session } = useSession();
  const currentUser = (session as any)?.user;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Custom Invoice Modal Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    itemName: "",
    quantity: "1",
    price: "",
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dealer/stats");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.recentOrders || []);
      }
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadInvoice = async (ord: any) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");

      const items = (ord.items || []).map((item: any) => ({
        name: item.name || item.title || "Electronic Item",
        quantity: item.quantity || 1,
        price: item.price || ord.totalAmount || 0,
        amount: (item.quantity || 1) * (item.price || ord.totalAmount || 0),
      }));

      if (items.length === 0) {
        items.push({
          name: "Shop Products Batch",
          quantity: 1,
          price: ord.totalAmount || ord.amount || 0,
          amount: ord.totalAmount || ord.amount || 0,
        });
      }

      const totalAmount = ord.totalAmount || ord.amount || 0;

      await generateTaxInvoicePdf(doc, {
        invoiceNumber: `INV-DLR-${ord.id ? ord.id.slice(-6).toUpperCase() : Date.now()}`,
        dateStr: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"),
        timeStr: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        placeOfSupply: "Bihar",
        customer: {
          name: ord.customerName || ord.user?.name || "Customer",
          phone: ord.customerPhone || ord.user?.phone || "",
          address: ord.shippingAddress || "Authorized Shop Order",
        },
        items,
        subtotal: totalAmount,
        total: totalAmount,
        received: totalAmount,
        store: {
          name: currentUser?.shopName || "Authorized Dealer Shop",
          address: currentUser?.shopAddress || "Authorized Dealer Outlet",
          phone: currentUser?.phone || "",
        },
      });

      doc.save(`Invoice_${currentUser?.shopName || "Shop"}_${ord.id ? ord.id.slice(-6) : "Bill"}.pdf`);
      toast.success("GST Tax Invoice downloaded with your shop header!");
    } catch (e: any) {
      toast.error("Failed to generate PDF invoice");
    }
  };

  const handleGenerateCustomPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.customerName || !customForm.itemName || !customForm.price) {
      toast.error("Customer name, item name, and price are required");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const qty = Number(customForm.quantity) || 1;
      const unitPrice = Number(customForm.price) || 0;
      const totalAmount = qty * unitPrice;

      await generateTaxInvoicePdf(doc, {
        invoiceNumber: `INV-CST-${Math.floor(100000 + Math.random() * 900000)}`,
        dateStr: new Date().toLocaleDateString("en-IN"),
        timeStr: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        placeOfSupply: "Bihar",
        customer: {
          name: customForm.customerName,
          phone: customForm.customerPhone || "N/A",
          address: customForm.customerAddress || "In-Store Purchase",
        },
        items: [
          {
            name: customForm.itemName,
            quantity: qty,
            price: unitPrice,
            amount: totalAmount,
          },
        ],
        subtotal: totalAmount,
        total: totalAmount,
        received: totalAmount,
        store: {
          name: currentUser?.shopName || "Authorized Dealer Shop",
          address: currentUser?.shopAddress || "Authorized Dealer Outlet",
          phone: currentUser?.phone || "",
        },
      });

      doc.save(`Invoice_${customForm.customerName.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
      toast.success("Custom GST Tax Invoice generated and downloaded!");
      setShowCustomModal(false);
      setCustomForm({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        itemName: "",
        quantity: "1",
        price: "",
      });
    } catch {
      toast.error("Error generating custom invoice");
    }
  };

  const filtered = orders.filter(
    (ord) =>
      ord.id.toLowerCase().includes(search.toLowerCase()) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              <span>GST Bills & Customer Invoices</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 font-medium">
              Generate and download official GST tax invoices branded with your shop details.
            </p>
          </div>

          <Button
            onClick={() => setShowCustomModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-md shrink-0"
          >
            <PlusCircle className="h-4 w-4" /> Create Custom Tax Invoice
          </Button>
        </div>

        {/* Dealer Shop Information Header Box */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 p-5 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-lg">
              <Store className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <span>Your Official Invoice Header Branding</span>
            </div>
            <span className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED SELLER
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-amber-900 dark:text-amber-200 font-semibold border-t border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5">
              <Store className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Shop: <strong>{currentUser?.shopName || "Your Shop Name"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Address: <strong>{currentUser?.shopAddress || "Your Shop Address"}</strong></span>
            </div>

            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Phone / GST: <strong>{currentUser?.phone || "N/A"} {currentUser?.gstNumber ? `(GST: ${currentUser.gstNumber})` : ""}</strong></span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice by order ID or customer name..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Invoices List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading shop invoices...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No sales invoices generated yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filtered.map((ord) => (
                <div key={ord.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Tax Invoice #{ord.id.slice(-8).toUpperCase()}</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                        {currentUser?.shopName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Customer: <strong>{ord.customerName || "Shop Customer"}</strong> • Date: {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN") : "N/A"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {formatPrice(ord.totalAmount || ord.amount || 0)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadInvoice(ord)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
                    >
                      <Download className="h-4 w-4" /> Download Shop Bill (PDF)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Tax Invoice Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>Generate Custom Shop Tax Invoice</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleGenerateCustomPdf} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Customer Full Name*</label>
                  <input
                    type="text"
                    required
                    value={customForm.customerName}
                    onChange={(e) => setCustomForm({ ...customForm, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={customForm.customerPhone}
                      onChange={(e) => setCustomForm({ ...customForm, customerPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Address / Location</label>
                    <input
                      type="text"
                      value={customForm.customerAddress}
                      onChange={(e) => setCustomForm({ ...customForm, customerAddress: e.target.value })}
                      placeholder="e.g. Siwan, Bihar"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Item / Product Description*</label>
                  <input
                    type="text"
                    required
                    value={customForm.itemName}
                    onChange={(e) => setCustomForm({ ...customForm, itemName: e.target.value })}
                    placeholder="e.g. Smart LED TV 55 inch"
                    className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      value={customForm.quantity}
                      onChange={(e) => setCustomForm({ ...customForm, quantity: e.target.value })}
                      placeholder="1"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={customForm.price}
                      onChange={(e) => setCustomForm({ ...customForm, price: e.target.value })}
                      placeholder="45000"
                      className="w-full p-2.5 border dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-xl shadow-md"
                  >
                    Generate & Download PDF Bill
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomModal(false)}
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
