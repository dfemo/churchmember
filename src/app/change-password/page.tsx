"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/password");
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <p className="text-slate-500">Redirecting…</p>
    </div>
  );
}
