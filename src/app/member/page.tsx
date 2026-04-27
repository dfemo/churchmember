"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MemberHomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/membership");
  }, [router]);
  return <p className="p-4 text-sm text-slate-500">Redirecting…</p>;
}
