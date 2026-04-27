"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

type MenuItem = {
  href: string;
  label: string;
};

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  const pathname = usePathname();
  return (
    <section>
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout, lastLoginAt } = useAuth();
  const router = useRouter();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));

  const membershipItems: MenuItem[] = [{ href: "/dashboard/membership", label: "Membership details" }];
  const accountItems: MenuItem[] = [{ href: "/dashboard/password", label: "Update password" }];
  const analyticsItems: MenuItem[] = [
    { href: isAdmin ? "/dashboard/admin" : "/dashboard/member", label: "Dashboard overview" },
  ];

  return (
    <div className="min-h-svh bg-slate-100">
      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="hidden min-h-svh w-72 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <p className="px-2 py-3 text-base font-semibold text-slate-900">Church Members</p>
          <div className="space-y-5">
            <MenuSection title="Analytics" items={analyticsItems} />
            <MenuSection title="Membership" items={membershipItems} />
            <MenuSection title="Account" items={accountItems} />
          </div>
        </aside>

        <div className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName ?? "User"}</p>
                <p className="truncate text-xs text-slate-500">
                  Last login: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:hidden">
              {[...analyticsItems, ...membershipItems, ...accountItems].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-center text-xs text-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </header>

          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
