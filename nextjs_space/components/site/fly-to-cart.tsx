"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FlyingItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  imgUrl?: string;
}

export function triggerFlyToCart(e: React.MouseEvent | HTMLElement, imgUrl?: string) {
  if (typeof window === "undefined") return;

  // Auto smooth scroll to top so the header cart icon and flight trajectory are in full view
  if (window.scrollY > 20) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let startX = window.innerWidth / 2;
  let startY = window.innerHeight / 2;

  if ("clientX" in e && "clientY" in e) {
    startX = e.clientX;
    startY = e.clientY;
  } else if (e instanceof HTMLElement) {
    const rect = e.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  }

  // Find exact position of Header Cart Icon
  const cartIconEl = document.querySelector("#header-cart-icon") || document.querySelector("[data-cart-icon]");
  
  // Default fallback if element is somehow not found
  let endX = window.innerWidth - 45;
  let endY = 32;

  if (cartIconEl) {
    const rect = cartIconEl.getBoundingClientRect();
    endX = rect.left + rect.width / 2;
    endY = rect.top + rect.height / 2;
    // In case header is scrolled, enforce top navbar boundary
    if (endY < 10) endY = 32;
  }

  const detail: FlyingItem = {
    id: "fly_" + Math.random().toString(36).substring(2, 9),
    startX,
    startY,
    endX,
    endY,
    imgUrl,
  };

  window.dispatchEvent(new CustomEvent("fly-to-cart", { detail }));
}

export function FlyToCartContainer() {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  useEffect(() => {
    const handleFly = (event: Event) => {
      const customEvent = event as CustomEvent<FlyingItem>;
      if (!customEvent.detail) return;

      const newItem = customEvent.detail;
      setFlyingItems((prev) => [...prev, newItem]);

      // Remove after flight duration (1.1s) & trigger cart bounce
      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== newItem.id));
        window.dispatchEvent(new Event("cart-bounce"));
        window.dispatchEvent(new Event("guest-cart-change"));
      }, 1100);
    };

    window.addEventListener("fly-to-cart", handleFly);
    return () => window.removeEventListener("fly-to-cart", handleFly);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999999] overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => {
          // Midpoint apex for a smooth curved parabolic arc
          const midX = (item.startX + item.endX) / 2;
          const apexY = Math.min(item.startY, item.endY) - 70;

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX,
                y: item.startY,
                scale: 1.2,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                x: [item.startX, midX, item.endX],
                y: [item.startY, apexY, item.endY],
                scale: [1.2, 0.9, 0.15],
                rotate: [0, -12, 12, 0],
                opacity: [1, 1, 0.8, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1], // Smooth cubic-bezier ease out
              }}
              style={{
                width: 72,
                height: 72,
                marginTop: -36,
                marginLeft: -36,
              }}
              className="absolute top-0 left-0 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.7)] overflow-hidden flex items-center justify-center p-1.5 backdrop-blur-md"
            >
              {item.imgUrl ? (
                <img
                  src={item.imgUrl}
                  alt="Product"
                  className="w-full h-full object-contain pointer-events-none rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-inner">
                  🛒
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
