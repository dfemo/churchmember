"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isReady, token, mustChangePassword } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (mustChangePassword) {
      router.replace("/change-password");
      return;
    }
    router.replace("/dashboard");
  }, [isReady, token, mustChangePassword, router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <p className="text-stone-500">Loading…</p>
    </div>
  );
}
