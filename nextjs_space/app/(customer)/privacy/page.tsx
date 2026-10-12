"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, Info } from "lucide-react";

export default function PrivacyPage() {
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="mx-auto max-w-[900px] px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Page Header */}
        <motion.div variants={itemVariants} className="text-center space-y-3 mb-10">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white items-center justify-center shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            Learn how we handle, store, and protect your personal data at Hello Bazaar.
          </p>
          <div className="text-xs text-indigo-500 font-semibold tracking-wider uppercase">
            Last Updated: June 2026
          </div>
        </motion.div>

        {/* Section 1: Collection */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition duration-200"
          style={{ borderColor: "rgba(128,128,128,0.15)" }}
        >
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <Eye className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                1. Information We Collect
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                To provide you with a premium shopping experience, we collect certain details when you register, order, or browse:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li>Personal Identifiers: Full Name, email address, and phone number.</li>
                <li>Delivery Info: Physical shipping addresses added to your profile.</li>
                <li>App Identifiers: Device notification tokens (for sending push notifications via Firebase Cloud Messaging).</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Section 2: Usage */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition duration-200"
          style={{ borderColor: "rgba(128,128,128,0.15)" }}
        >
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <Database className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                2. How We Use Your Data
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Your data is strictly used for checkout, delivery, and notifications:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li>Processing transactions and executing orders (deducting stock, generating order receipts).</li>
                <li>Dispatching shipments with our third-party logistics and delivery partners.</li>
                <li>Sending transactional updates (Order Confirmed, Dispatched, Delivered) via real-time push notifications.</li>
                <li>Managing support tickets and addressing customer queries.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Section 3: Security */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition duration-200"
          style={{ borderColor: "rgba(128,128,128,0.15)" }}
        >
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <Lock className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                3. Data Security & Third-Parties
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We implement industry-standard security protocols to protect your credentials. We do not sell or lease your personal information. Payment processing is completely handled off-site through secure, PCI-compliant payment gateways.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section 4: App Permissions */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition duration-200"
          style={{ borderColor: "rgba(128,128,128,0.15)" }}
        >
          <div className="flex gap-4">
            <div className="mt-1 flex-shrink-0">
              <Info className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                4. App & OS Permissions (Android & Desktop)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                Our mobile APK and Windows EXE wrappers require limited permissions to function:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li>Internet Access: To communicate with the database and server.</li>
                <li>Notification Permission: To receive background push notifications from our Firebase messaging servers.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
