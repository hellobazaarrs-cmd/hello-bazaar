"use client";

import { useEffect } from "react";

export function PermissionPrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register Service Worker for offline screen caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Offline Service Worker registered"))
        .catch(() => {});
    }
  }, []);

  return null;
}
