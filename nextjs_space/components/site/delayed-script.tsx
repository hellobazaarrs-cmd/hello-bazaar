"use client";
import { useEffect } from "react";

export function DelayedScript() {
  useEffect(() => {
    // Only load on client-side
    if (typeof window === "undefined") return;

    let loaded = false;

    const loadScript = () => {
      if (loaded) return;
      loaded = true;

      const script = document.createElement("script");
      script.src = "https://apps.abacus.ai/chatllm/appllm-lib.js";
      script.async = true;
      document.body.appendChild(script);

      // Clean up event listeners
      window.removeEventListener("scroll", loadScript);
      window.removeEventListener("touchstart", loadScript);
      window.removeEventListener("mousemove", loadScript);
    };

      const loadIdle = () => {
        if ("requestIdleCallback" in window) {
          (window as any).requestIdleCallback(loadScript, { timeout: 15000 });
        } else {
          setTimeout(loadScript, 10000);
        }
      };

      // Load during browser idle time
      const timer = setTimeout(loadIdle, 10000);

      return () => {
        clearTimeout(timer);
      };
    }, []);

  return null;
}
