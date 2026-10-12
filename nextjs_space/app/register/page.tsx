"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Shield, Loader2, Eye, EyeOff, Phone, Store, MapPin, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/site/auth-shell";
import { Button } from "@/components/ui/button";
import { SECURITY_QUESTIONS } from "@/lib/format";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    shopName: "",
    shopAddress: "",
    gstNumber: "",
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: "",
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!form.shopName.trim() || !form.shopAddress.trim()) {
      toast.error("Shop Name and Shop Address are required for Dealers");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role: "DEALER",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Signup failed");
        return;
      }

      toast.success("Dealer registered successfully! Signing you in...");
      const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (signInRes?.error) {
        router.replace("/login");
      } else {
        router.replace("/home");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Dealer Registration" subtitle="Register your shop on Hello Bazaar B2B Portal">
      <div className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          {/* Shop / Business Name */}
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
            <input
              required
              value={form.shopName}
              onChange={e => update("shopName", e.target.value)}
              placeholder="Shop / Business Name *"
              className="w-full h-11 rounded-lg bg-white/10 border border-amber-400/40 pl-10 pr-3 text-sm text-white placeholder:text-amber-100/60 focus:outline-none focus:border-amber-400 focus:bg-white/15"
            />
          </div>

          {/* Shop Address */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
            <input
              required
              value={form.shopAddress}
              onChange={e => update("shopAddress", e.target.value)}
              placeholder="Shop / Business Full Address *"
              className="w-full h-11 rounded-lg bg-white/10 border border-amber-400/40 pl-10 pr-3 text-sm text-white placeholder:text-amber-100/60 focus:outline-none focus:border-amber-400 focus:bg-white/15"
            />
          </div>

          {/* GST Number */}
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
            <input
              value={form.gstNumber}
              onChange={e => update("gstNumber", e.target.value.toUpperCase())}
              placeholder="GST Number (Optional)"
              className="w-full h-11 rounded-lg bg-white/10 border border-amber-400/40 pl-10 pr-3 text-sm text-white placeholder:text-amber-100/60 focus:outline-none focus:border-amber-400 focus:bg-white/15"
            />
          </div>

          {/* Owner Full Name */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              required
              value={form.fullName}
              onChange={e => update("fullName", e.target.value)}
              placeholder="Owner / Contact Person Full Name *"
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
            />
          </div>

          {/* Email & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => update("email", e.target.value)}
                placeholder="Email Address *"
                className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => update("phone", e.target.value)}
                placeholder="Mobile Number (10 digits) *"
                className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type={show ? "text" : "password"}
                required
                value={form.password}
                onChange={e => update("password", e.target.value)}
                placeholder="Password *"
                className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-9 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <input
                type={show ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={e => update("confirmPassword", e.target.value)}
                placeholder="Confirm Password *"
                className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
              />
            </div>
          </div>

          {/* Security Question */}
          <div className="relative">
            <Shield className="absolute left-3 top-3.5 h-4 w-4 text-white/50 z-10" />
            <select
              required
              value={form.securityQuestion}
              onChange={e => update("securityQuestion", e.target.value)}
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-sky-400 focus:bg-white/15 appearance-none"
            >
              {SECURITY_QUESTIONS.map(q => (
                <option key={q} value={q} className="bg-slate-800">
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Security Answer */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              required
              value={form.securityAnswer}
              onChange={e => update("securityAnswer", e.target.value)}
              placeholder="Security Answer *"
              className="w-full h-11 rounded-lg bg-white/10 border border-white/20 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 focus:bg-white/15"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-white font-semibold shadow-lg mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Register as Dealer"
            )}
          </Button>

          <div className="text-center text-sm text-white/70 pt-1">
            Already registered?{" "}
            <Link href="/login" className="text-amber-300 hover:text-amber-200 font-medium">
              Dealer Sign In
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
