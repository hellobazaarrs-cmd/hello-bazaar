"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, CheckSquare, Square } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppExitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [doNotAskLater, setDoNotAskLater] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only register back button listener in browser environment
    if (typeof window === "undefined") return;

    let backListener: any = null;

    const setupListener = async () => {
      try {
        const { App } = await import("@capacitor/app");
        backListener = await App.addListener("backButton", (event) => {
          // Check if user previously saved "Do not ask later"
          const dontAsk = localStorage.getItem("dont_ask_exit_app");
          if (dontAsk === "true") {
            // Instantly exit app without modal
            App.exitApp();
            return;
          }

          // Show confirmation modal on root pages or when back cannot navigate
          const rootPaths = ["/", "/home", "/cart", "/orders", "/profile", "/categories"];
          const isRootPath = rootPaths.includes(pathname || "/");

          if (!event.canGoBack || isRootPath) {
            setIsOpen(true);
          } else {
            // Otherwise let standard history back handle it
            window.history.back();
          }
        });
      } catch (err) {
        // Fallback for non-Capacitor web environments
      }
    };

    setupListener();

    return () => {
      if (backListener && typeof backListener.remove === "function") {
        backListener.remove();
      }
    };
  }, [pathname]);

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleOk = async () => {
    if (doNotAskLater) {
      localStorage.setItem("dont_ask_exit_app", "true");
    }
    setIsOpen(false);

    try {
      const { App } = await import("@capacitor/app");
      App.exitApp();
    } catch {
      if (typeof window !== "undefined") {
        window.close();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <LogOut className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold tracking-tight text-white">
                Are you sure to leave this app?
              </h3>
            </div>

            {/* Cancel & OK Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={handleCancel}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all border border-slate-700 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleOk}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-600 hover:to-purple-700 text-white font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                OK
              </button>
            </div>

            {/* "Do not ask later" Checkbox Option Section below buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center">
              <label
                onClick={() => setDoNotAskLater(!doNotAskLater)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none py-1 px-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                {doNotAskLater ? (
                  <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <span className="font-medium">Do not ask later</span>
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
