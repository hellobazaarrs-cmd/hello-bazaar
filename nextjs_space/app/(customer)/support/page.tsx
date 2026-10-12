"use client";
import { useState } from "react";
import { HelpCircle, Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const whatsappUrl = `https://wa.me/918434023311?text=${encodeURIComponent(
      "Hi Hello Bazaar Support, I need help with an order/product."
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 text-primary items-center justify-center mb-3">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">How can we help?</h1>
        <p className="text-muted-foreground mt-2">We're here to answer your questions and help with your orders</p>
      </motion.div>

      {/* Prominent Direct WhatsApp Mobile Trigger Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/30"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0">
            <Phone className="h-7 w-7 text-white fill-current" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black font-display tracking-tight">
              💬 Direct WhatsApp Customer Support
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
              WhatsApp Helpdesk Number: <strong className="text-white font-bold underline">+91 8434023311</strong>
            </p>
          </div>
        </div>

        <Button
          onClick={openWhatsApp}
          className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 border border-emerald-200 shrink-0 text-sm transform transition-all active:scale-95"
        >
          <span>Chat on WhatsApp (8434023311)</span>
          <ExternalLink className="h-4 w-4" />
        </Button>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Phone, t: "Call Us", v: "8434023311, 9504912525", s: "Mon-Sat 9am-7pm" },
          { icon: Mail, t: "Email Us", v: "electrobazar0@gmail.com", s: "24/7 response" },
          {
            icon: MapPin,
            t: "Visit Us",
            v: "Bhagwanpur Hat (Purani Bazaar), Siwan / Basantpur (Sabji Mandi), Siwan",
            s: "Showroom open daily",
          },
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 text-center product-card-shadow border border-slate-100 dark:border-slate-800"
          >
            <div className="mx-auto h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="font-display font-bold">{c.t}</p>
            <p className="text-sm mt-1 font-semibold">{c.v}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.s}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 md:p-8 product-card-shadow border border-slate-100 dark:border-slate-800">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Send us a message
        </h2>
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
            <p className="font-semibold">Thanks! Your message has been received.</p>
            <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
            <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
              Send Another
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              required
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm md:col-span-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <textarea
              required
              placeholder="Your Message"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="p-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm md:col-span-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground md:col-span-2">
              We respect your privacy. Your message is stored securely and only used to respond to your enquiry.
            </p>
            <Button
              type="submit"
              disabled={submitting}
              className="md:col-span-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold"
            >
              {submitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
