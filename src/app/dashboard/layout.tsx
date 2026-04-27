"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isReady, token, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
    else if (mustChangePassword) router.replace("/dashboard/password");
  }, [isReady, token, mustChangePassword, router]);

  if (!isReady || !token) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
