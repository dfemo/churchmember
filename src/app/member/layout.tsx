"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { isReady, token, mustChangePassword, logout, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
    else if (mustChangePassword) router.replace("/change-password");
  }, [isReady, token, mustChangePassword, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }
  if (!token || mustChangePassword) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-stone-500">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/member" className="text-base font-semibold text-stone-800">
            Church Members
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden truncate text-sm text-stone-500 sm:block">
              {user?.fullName}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="shrink-0 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
