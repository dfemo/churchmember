"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MembersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/membership");
  }, [router]);
  return <p className="text-sm text-slate-500">Redirecting to members…</p>;
}
