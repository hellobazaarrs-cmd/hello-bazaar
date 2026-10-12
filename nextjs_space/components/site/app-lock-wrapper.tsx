"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, LogOut, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AppLockWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession() || {};
  const pathname = usePathname();
  const router = useRouter();

  const [isApk, setIsApk] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  // Exclude login, signup, and forgot password pages from App Lock
  const isAuthPage = pathname?.startsWith("/login") || 
                     pathname?.startsWith("/register") || 
                     pathname?.startsWith("/forgot-password") ||
                     pathname?.startsWith("/api/auth");

  // 1. Detect if running inside the Capacitor Android APK
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCapacitor = (window as any).Capacitor !== undefined || navigator.userAgent.includes("HelloBazaarNativeAPK");
      setIsApk(isCapacitor);
      
      if (isCapacitor) {
        document.documentElement.classList.add("platform-capacitor");
        document.body.classList.add("platform-capacitor");
      }
      
      // Check if WebAuthn platform biometrics are supported
      if (isCapacitor && window.PublicKeyCredential) {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          .then((available) => {
            setBiometricsAvailable(available);
          })
          .catch(() => setBiometricsAvailable(false));
      }
    }
  }, []);

  // 2. Control initial lock state on startup
  useEffect(() => {
    if (!isApk || status !== "authenticated" || isAuthPage) {
      setIsLocked(false);
      return;
    }

    const lockEnabled = localStorage.getItem("app_lock_enabled") === "true";
    if (lockEnabled) {
      setIsLocked(true);
      
      // Auto-trigger biometric unlock on startup
      setTimeout(() => {
        triggerBiometricUnlock();
      }, 600);
    } else {
      setIsLocked(false);
    }
  }, [isApk, status, pathname, isAuthPage]);

  // 3. Listen for app minimize/resume (visibilitychange)
  useEffect(() => {
    if (!isApk || status !== "authenticated" || isAuthPage) return;

    const handleVisibilityChange = () => {
      const lockEnabled = localStorage.getItem("app_lock_enabled") === "true";
      if (document.visibilityState === "visible" && lockEnabled) {
        // Skip locking if we are currently prompting for biometric/passkey verification
        if ((window as any).appLockAuthenticating) {
          console.log("[AppLock] Skipping lock since biometric verification is in progress.");
          return;
        }

        console.log("[AppLock] App resumed. Locking screen.");
        setIsLocked(true);
        setAuthFailed(false);

        // Auto-trigger biometric unlock
        setTimeout(() => {
          triggerBiometricUnlock();
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isApk, status, isAuthPage]);

  // 4. WebAuthn Biometric Unlock
  const triggerBiometricUnlock = async () => {
    const credIdB64 = localStorage.getItem("app_lock_credential_id");
    const lockEnabled = localStorage.getItem("app_lock_enabled") === "true";
    
    if (!credIdB64 || !lockEnabled || !window.PublicKeyCredential) {
      setIsLocked(false);
      return;
    }

    if (authenticating) return;

    try {
      setAuthenticating(true);
      setAuthFailed(false);
      (window as any).appLockAuthenticating = true;

      // Decode stored Credential ID
      const rawId = new Uint8Array(
        atob(credIdB64)
          .split("")
          .map((c) => c.charCodeAt(0))
      );

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const getOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: rawId,
              type: "public-key",
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      };

      const assertion = await navigator.credentials.get(getOptions);
      if (assertion) {
        setIsLocked(false);
        setAuthFailed(false);
        toast.success("Unlocked successfully");
      }
    } catch (err: any) {
      console.error("[AppLock] Biometric unlock error:", err);
      setAuthFailed(true);
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") {
        toast.error("Biometric authentication failed");
      }
    } finally {
      setAuthenticating(false);
      // Delay resetting the global flag slightly to avoid race conditions with visibilitychange
      setTimeout(() => {
        (window as any).appLockAuthenticating = false;
      }, 1000);
    }
  };

  const handleLogout = async () => {
    setIsLocked(false);
    await signOut({ callbackUrl: "/login" });
  };

  // If not locked, or running outside the APK, render app normally
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between p-8 overflow-hidden select-none">
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col items-center mt-16 text-center">
          <h1 className="text-2xl font-bold font-display text-white tracking-wider">Hello Bazaar</h1>
          <div className="h-0.5 w-12 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full mt-2" />
        </div>

        {/* Center: Glowing Fingerprint Visualizer */}
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="relative flex items-center justify-center">
            {/* Concentric pulsing glow rings */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.03, 0.15] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute w-44 h-44 rounded-full border border-sky-500/30"
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0.08, 0.25] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute w-36 h-36 rounded-full border border-sky-400/40"
            />

            {/* Main fingerprint container button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={triggerBiometricUnlock}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center bg-slate-900/60 border-2 backdrop-blur-md shadow-2xl transition-all duration-300 ${
                authFailed 
                  ? "border-red-500 shadow-red-500/10" 
                  : "border-sky-500/60 shadow-sky-500/15"
              }`}
            >
              <motion.div
                animate={authenticating ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={authFailed ? "text-red-400" : "text-sky-400"}
              >
                <Fingerprint className="w-14 h-14" />
              </motion.div>
            </motion.button>
          </div>

          {/* Status Text Block */}
          <div className="mt-8 text-center px-6">
            <h2 className="text-lg font-semibold text-slate-200">
              {authenticating 
                ? "Verifying Identity..." 
                : authFailed 
                  ? "Verification Failed" 
                  : "App Locked"}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              {authenticating 
                ? "Please verify using your fingerprint or face recognition" 
                : authFailed 
                  ? "Click the fingerprint icon above to try again" 
                  : "Scan your fingerprint or face to unlock Hello Bazaar"}
            </p>
          </div>

          {/* Retry Button */}
          {authFailed && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={triggerBiometricUnlock}
              className="mt-6 px-6 py-2 rounded-full text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 active:scale-95 transition"
            >
              Retry Unlock
            </motion.button>
          )}
        </div>

        {/* Bottom Recovery Option */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-350 transition px-5 py-2.5 rounded-xl bg-slate-900/30 border border-slate-850/40 backdrop-blur"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account / Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
