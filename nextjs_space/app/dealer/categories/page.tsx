"use client";

import React, { useEffect, useState } from "react";
import { DealerLayout } from "@/components/dealer/dealer-layout";
import { Tags, Search } from "lucide-react";
import { toast } from "sonner";

export default function DealerCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(Array.isArray(data) ? data : data.categories || []);
        }
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCats();
  }, []);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span>Product Categories</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Available product categories on Hello Bazaar for listing your shop items.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((cat) => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center">
                  <Tags className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{cat.name}</h4>
                <div className="text-xs text-slate-400">ID: {cat.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DealerLayout>
  );
}
