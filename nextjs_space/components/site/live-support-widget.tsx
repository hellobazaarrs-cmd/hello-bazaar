"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  X,
  Send,
  Package,
  Flame,
  Store,
  Phone,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string }[];
  link?: string;
  linkText?: string;
}

interface LiveSupportWidgetProps {
  isOpenControlled?: boolean;
  onClose?: () => void;
  hideFloatingTrigger?: boolean;
}

export function LiveSupportWidget({
  isOpenControlled,
  onClose,
  hideFloatingTrigger = false,
}: LiveSupportWidgetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalOpen;
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
    if (!val && onClose) onClose();
  };

  const [lang, setLang] = useState<"EN">("EN");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "bot",
      text: "Hello! Welcome to Hello Bazaar B2B Support Assistant. 👋\n\nHow can we help you today?",
      options: [
        { label: "📦 Track Order", action: "ACTION_TRACK" },
        { label: "🔥 Today's Hot Deals", action: "ACTION_OFFERS" },
        { label: "🏪 Dealer Registration", action: "ACTION_DEALER" },
        { label: "💬 Chat on WhatsApp (8434023311)", action: "ACTION_WHATSAPP" },
      ],
    },
  ]);

  const handleOptionClick = async (action: string, label: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: label,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(async () => {
      if (action === "ACTION_TRACK") {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: "📦 Please type your **Order ID** or **Phone Number** to track your order status:\n(e.g., ORDER 123456 or 8434023311)",
          },
        ]);
      } else if (action === "ACTION_OFFERS") {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: "🔥 **Hello Bazaar - Today's Hot Deals:**\n\n1️⃣ **Smart TVs:** Up to 50% off + No-Cost EMI\n2️⃣ **Laptops:** Intel Core i7 & M-Series with extra discounts\n3️⃣ **Smartphones:** 5G phones available at wholesale bulk rates\n\n🎟️ Promo Code: **DISCOUNT2000**",
            link: "/offers",
            linkText: "🛒 View All Deals",
          },
        ]);
      } else if (action === "ACTION_DEALER") {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: "🏪 **Hello Bazaar Wholesale Dealer Portal:**\n\nDirect B2B wholesale purchasing from Super Admin!\n\n✅ Instant Dealer Account Access\n✅ Wholesale Bulk Price Discounts\n✅ Transparent Order Tracking",
            link: "/register?role=DEALER",
            linkText: "🏪 Register Shop Now",
          },
        ]);
      } else if (action === "ACTION_WHATSAPP") {
        const whatsappUrl = `https://wa.me/918434023311?text=${encodeURIComponent(
          "Hi Hello Bazaar Customer Support, I need help with my order."
        )}`;
        window.open(whatsappUrl, "_blank");
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: "📲 Opening WhatsApp chat (8434023311)... Click below if it didn't open automatically.",
            link: whatsappUrl,
            linkText: "💬 Open WhatsApp Chat (8434023311)",
          },
        ]);
      }
      setLoading(false);
    }, 400);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text: userText,
      },
    ]);

    setLoading(true);

    setTimeout(() => {
      const lower = userText.toLowerCase();

      if (lower.includes("hi") || lower.includes("hello") || lower.includes("namaste")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: "Hello! How can I assist you with your orders or wholesale pricing today?",
            options: [
              { label: "📦 Track Order", action: "ACTION_TRACK" },
              { label: "🔥 Latest Offers", action: "ACTION_OFFERS" },
              { label: "🏪 Dealer Registration", action: "ACTION_DEALER" },
              { label: "💬 WhatsApp (8434023311)", action: "ACTION_WHATSAPP" },
            ],
          },
        ]);
      } else if (lower.match(/\d{10}/) || lower.includes("order")) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `🔎 Searching... Finding your order details!\n\nPlease check your live order tracking on the orders page:`,
            link: "/orders",
            linkText: "📦 Check Live Order Status",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text:
              "Thank you! Our support team is available to assist you. You can connect with us directly on WhatsApp or Call at 8434023311.",
            options: [
              { label: "💬 WhatsApp (8434023311)", action: "ACTION_WHATSAPP" },
              { label: "🔥 View Today's Deals", action: "ACTION_OFFERS" },
            ],
          },
        ]);
      }
      setLoading(false);
    }, 500);
  };

  return (
    <>
      {/* Draggable Floating Button Widget Bar */}
      {!hideFloatingTrigger && (
        <motion.div
          drag
          dragMomentum={false}
          className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 pointer-events-auto cursor-grab active:cursor-grabbing"
        >
          {/* Direct WhatsApp Call/Chat Button — VISIBLE ON DESKTOP ONLY (HIDDEN ON MOBILE) */}
          <a
            href={`https://wa.me/918434023311?text=${encodeURIComponent(
              "Hi Hello Bazaar Support, I need help with an order."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl items-center justify-center transition-transform hover:scale-110 border-2 border-white group"
            title="Direct WhatsApp Chat (8434023311)"
          >
            <Phone className="h-6 w-6 fill-current text-white" />
            <span className="absolute right-14 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-bold">
              WhatsApp Direct Chat (8434023311)
            </span>
          </a>

          {/* Live AI Assistant Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 border-2 border-white relative"
            title="Drag anywhere / Click to open AI Assistant"
          >
            {isOpen ? (
              <X className="h-7 w-7" />
            ) : (
              <Bot className="h-7 w-7 text-white" />
            )}
          </button>
        </motion.div>
      )}

      {/* Interactive Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>Hello Bazaar Assistant</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">Support: 8434023311 • 24/7 Response</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50 font-sans text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-sky-600 text-white rounded-br-none"
                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed font-medium">{msg.text}</p>

                    {/* Optional Action Button Link */}
                    {msg.link && (
                      <a
                        href={msg.link}
                        target={msg.link.startsWith("http") ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow transition-all"
                      >
                        <span>{msg.linkText || "Open Link"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {/* Interactive Options Buttons */}
                  {msg.options && (
                    <div className="mt-2 flex flex-col gap-1.5 w-full">
                      {msg.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(opt.action, opt.label)}
                          className="w-full text-left bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/80 text-sky-700 dark:text-sky-300 font-bold p-2.5 rounded-xl border border-sky-200 dark:border-slate-700 transition-all flex items-center justify-between group shadow-sm text-[11px]"
                        >
                          <span>{opt.label}</span>
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 opacity-70 group-hover:scale-125 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
                  <span>Assistant typing...</span>
                </div>
              )}
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 border border-transparent dark:border-slate-700"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold shadow flex items-center justify-center shrink-0 transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
