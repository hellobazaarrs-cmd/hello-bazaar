"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { MapPin, Phone, Mail, Truck } from "lucide-react";
import { DeliveryDownloadModal } from "@/components/delivery-download-modal";

export function Footer() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  return (
    <footer className="hidden md:block bg-slate-900 text-slate-300 mt-16">
      <div className="mx-auto max-w-[1200px] px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="mb-3"><Logo white /></div>
            <p className="text-sm text-slate-400 max-w-xs">Your trusted destination for premium electronics in India. Shop the latest gadgets at unbeatable prices.</p>
          </div>
          <div>
            <h3 className="text-white font-display font-semibold mb-3 text-sm uppercase tracking-wide">Shop</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/products" className="hover:text-white">All Products</Link>
              <Link href="/offers" className="hover:text-white">Offers & Deals</Link>
              <Link href="/orders" className="hover:text-white">Track Order</Link>
              <button
                onClick={() => setShowDownloadModal(true)}
                className="text-left text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Truck className="w-4 h-4" /> Delivery Partner App
              </button>
              <Link href="/support" className="hover:text-white">Customer Support</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-display font-semibold mb-3 text-sm uppercase tracking-wide">Policies</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/terms" className="hover:text-white">Terms & Conditions</Link>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/returns" className="hover:text-white">Return Policy</Link>
              <Link href="/refunds" className="hover:text-white">Refund Policy</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-display font-semibold mb-3 text-sm uppercase tracking-wide">Contact</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />Bhagwanpur Hat (Purani Bazaar) , Siwan / Basantpur (Sabji Mandi) , Siwan</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />8434023311, 9504912525</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" />electrobazar0@gmail.com</div>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
          © {new Date().getFullYear()} Hello Bazaar. All rights reserved.
        </div>
      </div>

      <DeliveryDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </footer>
  );
}
