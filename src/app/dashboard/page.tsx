"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardIndexPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.roles?.includes("Admin")) router.replace("/dashboard/admin");
    else router.replace("/dashboard/member");
  }, [user, router]);

  return <p className="text-sm text-slate-500">Redirecting…</p>;
}
