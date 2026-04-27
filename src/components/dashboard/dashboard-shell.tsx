"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type MenuItem = {
  href: string;
  label: string;
  iconLabel: string;
};

function MenuSection({ title, items, collapsed }: { title: string; items: MenuItem[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <section>
      {!collapsed ? (
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400/90">{title}</p>
      ) : null}
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-violet-500/20 text-violet-100"
                  : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
              }`}
            >
              <span
                aria-hidden
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-700 text-[10px] font-semibold text-slate-200"
              >
                {item.iconLabel}
              </span>
              {!collapsed ? <span className="ml-2">{item.label}</span> : null}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const membershipItems: MenuItem[] = [
    { href: "/dashboard/membership", label: "Membership details", iconLabel: "MB" },
  ];
  const accountItems: MenuItem[] = [{ href: "/dashboard/password", label: "Update password", iconLabel: "PW" }];
  const analyticsItems: MenuItem[] = [
    { href: isAdmin ? "/dashboard/admin" : "/dashboard/member", label: "Dashboard overview", iconLabel: "AN" },
  ];

  return (
    <div className="min-h-svh bg-slate-100">
      <div className="flex min-h-svh w-full">
        <aside
          className={`hidden min-h-svh shrink-0 bg-slate-900 p-4 text-white transition-all duration-200 lg:block ${
            sidebarCollapsed ? "w-20" : "w-72"
          }`}
        >
          <p className={`px-2 py-3 text-base font-semibold text-white ${sidebarCollapsed ? "text-center text-xs" : ""}`}>
            {sidebarCollapsed ? "CM" : "Church Members"}
          </p>
          <div className="space-y-5">
            <MenuSection title="Analytics" items={analyticsItems} collapsed={sidebarCollapsed} />
            <MenuSection title="Membership" items={membershipItems} collapsed={sidebarCollapsed} />
            <MenuSection title="Account" items={accountItems} collapsed={sidebarCollapsed} />
          </div>
        </aside>

        <div className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="hidden rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 lg:inline-flex"
                >
                  {sidebarCollapsed ? "Expand" : "Collapse"}
                </button>
                <div className="h-8 w-px bg-slate-200" />
                <p className="truncate text-sm font-semibold text-slate-900">
                  Welcome back, {user?.fullName ?? "User"}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="truncate text-xs text-slate-500">
                  Last login: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
                </p>
                <p className="truncate text-xs font-medium text-slate-700">{user?.roles?.join(", ") || "Member"}</p>
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

          <main className="flex-1 px-6 py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
