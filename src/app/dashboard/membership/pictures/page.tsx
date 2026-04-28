"use client";

import { PictureCatalog } from "@/components/membership/picture-catalog";

export default function PictureCatalogPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur-xl sm:p-6">
      <h1 className="text-xl font-semibold text-slate-900">Picture catalog</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage your profile and birthday images in one place — optimized for small screens.
      </p>
      <div className="mt-6">
        <PictureCatalog />
      </div>
    </div>
  );
}
