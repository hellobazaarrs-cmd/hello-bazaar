"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, Download, ShieldCheck, X, Truck, KeyRound, CheckCircle2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface DeliveryDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeliveryDownloadModal({ isOpen, onClose }: DeliveryDownloadModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  if (!isOpen) return null;

  const handleDownload = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setDownloadUrl("");

    const cleanInput = password.trim();
    if (!cleanInput) {
      setErrorMsg("Please enter the security password.");
      return;
    }

    setVerifying(true);

    // Password check for Delivery Partner App
    if (cleanInput === "12211221" || cleanInput.toLowerCase() === "hellobazaar") {
      const fullUrl = "/downloads/hello-bazaar-delivery-partner.apk";
      setDownloadUrl(fullUrl);
      
      const okText = "✅ Password Verified! Opening Chrome / Browser to download Delivery APK...";
      setSuccessMsg(okText);
      toast.success("Password Verified! Opening Chrome...");

      // Multi-layer trigger to guarantee Android Chrome / System Browser launches even inside WebView app
      setTimeout(() => {
        // Method 1: _system window open (Capacitor/Android Webview to Chrome Intent)
        try {
          window.open(fullUrl, "_system");
        } catch (e) {
          console.error("_system open failed", e);
        }

        // Method 2: Blank target anchor click
        try {
          const a = document.createElement("a");
          a.href = fullUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.download = "hello-bazaar-delivery-partner.apk";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {
          console.error("anchor click failed", e);
        }

        // Method 3: Location fallback
        window.location.href = fullUrl;

        setVerifying(false);
      }, 500);
    } else {
      setVerifying(false);
      setErrorMsg("❌ Incorrect Security Password. Please enter correct password or contact Admin.");
      toast.error("Incorrect password!");
    }
  };

  const handleCloseModal = () => {
    setPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setDownloadUrl("");
    setVerifying(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pt-[max(env(safe-area-inset-top,32px),32px)] pb-[max(env(safe-area-inset-bottom,32px),32px)] overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl space-y-5 relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Delivery Partner App</h3>
              <p className="text-[11px] text-slate-400">Password Protected Android Download</p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Note */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" /> Authorized Access Required
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hello Bazaar Delivery Partner App is restricted to authorized delivery executives. Enter security password to download the Android APK.
          </p>
        </div>

        {/* Success Message Banner */}
        {successMsg && (
          <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Password Verified!</span>
            </div>
            <p className="text-xs text-emerald-200 font-semibold leading-relaxed">
              Opening Chrome / External Browser to download <span className="underline font-bold text-white">hello-bazaar-delivery-partner.apk</span>.
            </p>

            {downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open Direct Download in Chrome
              </a>
            )}
          </div>
        )}

        {/* Error Message Banner */}
        {errorMsg && (
          <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-3.5 flex items-start gap-2.5 animate-in shake duration-200">
            <p className="text-xs font-extrabold text-red-300 leading-relaxed">
              {errorMsg}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDownload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" /> Enter App Security Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password..."
                value={password}
                disabled={verifying || !!successMsg}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                className="w-full bg-slate-950 text-sm font-semibold rounded-2xl pl-4 pr-11 py-3 border border-slate-800 text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || !!successMsg}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> {verifying ? "Verifying..." : "Download Delivery APK"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
