"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReportsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/admin");
  }, [router]);
  return <p className="text-sm text-slate-500">Redirecting to reports…</p>;
}
