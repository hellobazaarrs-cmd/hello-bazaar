"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check initial state
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleTryAgain = async () => {
    setChecking(true);
    try {
      // Perform a lightweight fetch ping to test true internet connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("/api/app-version", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      if (res || navigator.onLine) {
        setIsOffline(false);
      }
    } catch {
      // Remains offline
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  if (!isOffline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-white text-slate-900 flex flex-col justify-between items-center p-6 select-none overflow-y-auto"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Top Space / Header */}
        <div className="w-full text-center pt-8 md:pt-12">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2B2349]">
            Ooops!
          </h1>
        </div>

        {/* Center Illustration - Matching exact user provided image */}
        <div className="w-full max-w-[320px] md:max-w-[380px] my-auto py-6 flex justify-center">
          <svg
            viewBox="0 0 400 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto drop-shadow-sm"
          >
            {/* Cable Background Loop (Light Purple) */}
            <path
              d="M -20 180 C 40 80, 100 80, 140 130 C 180 180, 220 180, 260 130 C 300 80, 360 80, 420 180"
              stroke="#D8CCF1"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Hole Shadow at Bottom */}
            <ellipse cx="200" cy="275" rx="100" ry="18" fill="#323B44" />

            {/* Person Torso (Dark Teal) */}
            <path
              d="M 120 270 C 120 190, 160 170, 200 170 C 240 170, 280 190, 280 270 Z"
              fill="#066967"
            />

            {/* Collar & Lines */}
            <path
              d="M 185 170 Q 200 200 215 170"
              stroke="#044D4B"
              strokeWidth="3"
              fill="none"
            />
            <path d="M 200 200 L 200 270" stroke="#044D4B" strokeWidth="2.5" />

            {/* Neck & Face */}
            <path d="M 188 150 L 212 150 L 212 175 L 188 175 Z" fill="#FCE5D8" />
            <path
              d="M 172 132 C 172 105, 228 105, 228 132 C 228 155, 172 155, 172 132 Z"
              fill="#FCE5D8"
            />

            {/* Face Details */}
            {/* Eyes closed / surprised */}
            <path
              d="M 188 128 Q 193 124 198 128"
              stroke="#2B2349"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 210 128 Q 215 124 220 128"
              stroke="#2B2349"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Open Mouth */}
            <ellipse cx="212" cy="140" rx="4" ry="6" fill="#2B2349" />
            {/* Nose */}
            <path
              d="M 204 128 L 202 134 L 206 134"
              stroke="#E2B8A4"
              strokeWidth="2"
              fill="none"
            />

            {/* Hair (Black Curly) */}
            <path
              d="M 168 130 C 160 110, 180 90, 198 96 C 210 88, 235 94, 232 115 C 238 122, 230 138, 225 135 C 218 100, 180 105, 168 130 Z"
              fill="#222629"
            />

            {/* Ears */}
            <circle cx="172" cy="134" r="5" fill="#FCE5D8" />
            <circle cx="228" cy="134" r="5" fill="#FCE5D8" />

            {/* Left Arm & Disconnected Male Plug */}
            <path
              d="M 135 200 L 75 140 L 95 120"
              stroke="#FCE5D8"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Left Hand Plug (Greenish Teal) */}
            <g transform="translate(82, 100) rotate(-30)">
              <rect x="0" y="10" width="34" height="24" rx="6" fill="#0A5C5A" />
              {/* Prongs */}
              <rect
                x="8"
                y="-4"
                width="5"
                height="14"
                rx="2"
                fill="#222629"
              />
              <rect
                x="21"
                y="-4"
                width="5"
                height="14"
                rx="2"
                fill="#222629"
              />
            </g>

            {/* Right Arm & Disconnected Female Plug */}
            <path
              d="M 265 200 L 325 140 L 305 120"
              stroke="#FCE5D8"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Right Hand Plug (Purple-Teal) */}
            <g transform="translate(270, 95) rotate(35)">
              <rect x="0" y="10" width="34" height="24" rx="6" fill="#0A5C5A" />
              {/* Socket Holes */}
              <circle cx="10" cy="10" r="3" fill="#D8CCF1" />
              <circle cx="24" cy="10" r="3" fill="#D8CCF1" />
            </g>
          </svg>
        </div>

        {/* Content & Action Section */}
        <div className="w-full max-w-sm text-center space-y-3 pb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2B2349] tracking-tight">
            You’r offline
          </h2>
          <p className="text-sm md:text-base text-slate-600 font-medium leading-relaxed px-4">
            Something went wrong.
            <br />
            Try refreshing the page or checking your internet connection.
            <br />
            We’ll see you in a moment!
          </p>

          <div className="pt-4">
            <button
              onClick={handleTryAgain}
              disabled={checking}
              className="w-full py-4 px-6 bg-[#222325] hover:bg-[#111213] active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-80"
            >
              {checking ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking Connection...
                </>
              ) : (
                "Try again"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
