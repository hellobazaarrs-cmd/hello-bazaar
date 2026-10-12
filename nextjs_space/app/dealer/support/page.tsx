"use client";

import React from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { MessageSquare } from "lucide-react";

export default function DealerSupportPage() {
  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span>Customer Support Tickets</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Receive and resolve support queries from customers regarding your shop products.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
          No open support tickets for your shop items at this moment.
        </div>
      </div>
    </DealerLayout>
  );
}
