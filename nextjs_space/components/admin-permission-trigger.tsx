"use client";

import { useEffect } from "react";

export function AdminPermissionTrigger() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const requestAdminAccess = async () => {
      // 1. Trigger Native Android Permissions (Camera & Files) via AndroidAdminBridge
      try {
        if ((window as any).AndroidAdminBridge?.requestAdminPermissions) {
          (window as any).AndroidAdminBridge.requestAdminPermissions();
        }
      } catch (err) {
        console.warn("AndroidAdminBridge call failed", err);
      }

      // 2. In Browser: Prompt for Camera permission so admin can immediately take photos
      try {
        if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
          const hasRequested = sessionStorage.getItem("admin_camera_prompted");
          if (!hasRequested) {
            sessionStorage.setItem("admin_camera_prompted", "true");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((t) => t.stop());
          }
        }
      } catch (e) {
        console.log("Admin browser media permission prompted / handled", e);
      }
    };

    // Small delay to ensure page and native bridges are ready
    const timer = setTimeout(requestAdminAccess, 600);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
