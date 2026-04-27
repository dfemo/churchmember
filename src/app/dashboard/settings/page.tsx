"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/password");
  }, [router]);
  return <p className="text-sm text-slate-500">Redirecting to settings…</p>;
}
