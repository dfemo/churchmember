"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: string;
};

function NavItem({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition ${
        active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span
        aria-hidden
        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {item.icon}
      </span>
      {!collapsed ? <span className="ml-2.5">{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function MenuSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: MenuItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <section>
      {!collapsed ? (
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      ) : null}
      <nav className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </section>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout, lastLoginAt } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const primaryItems: MenuItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <span className="text-[11px] font-semibold">DB</span>,
    },
    {
      href: "/dashboard/password",
      label: "Payment",
      icon: <span className="text-[11px] font-semibold">$</span>,
    },
    {
      href: "/dashboard/membership",
      label: "Members",
      icon: <span className="text-[11px] font-semibold">MB</span>,
    },
  ];
  const reportItems: MenuItem[] = [
    {
      href: "/dashboard/admin",
      label: "Reports",
      icon: <span className="text-[11px] font-semibold">RP</span>,
    },
    {
      href: "/dashboard/member",
      label: "Attendant",
      icon: <span className="text-[11px] font-semibold">AT</span>,
    },
    {
      href: "/dashboard/membership",
      label: "Messages",
      icon: <span className="text-[11px] font-semibold">MS</span>,
      badge: "8",
    },
  ];
  const secondaryItems: MenuItem[] = [
    {
      href: "/dashboard/password",
      label: "Settings",
      icon: <span className="text-[11px] font-semibold">ST</span>,
    },
    {
      href: "/dashboard/member",
      label: "Help",
      icon: <span className="text-[11px] font-semibold">?</span>,
    },
  ];

  function signOut() {
    logout();
    router.push("/login");
  }

  const sidebarBase =
    "shrink-0 border-r border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl transition-all duration-200";

  return (
    <div className="min-h-svh bg-[#eef1f5] p-3 md:p-5">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-[1400px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl md:min-h-[calc(100svh-2.5rem)]">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 translate-x-0 ${sidebarBase} ${
            mobileOpen ? "block" : "hidden"
          } lg:hidden`}
        >
          <p className="px-2 py-3 text-base font-semibold text-slate-900">Church Members</p>
          <div className="space-y-5">
            <MenuSection title="General" items={primaryItems} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <MenuSection title="Reports" items={reportItems} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <MenuSection
              title="Support"
              items={secondaryItems}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </aside>

        <aside
          className={`hidden ${sidebarBase} lg:block ${
            sidebarCollapsed ? "w-20" : "w-72"
          }`}
        >
          <p
            className={`px-2 py-3 text-base font-semibold text-slate-900 ${
              sidebarCollapsed ? "text-center text-xs" : ""
            }`}
          >
            {sidebarCollapsed ? "CM" : "Church Members"}
          </p>
          <div className="space-y-5">
            <MenuSection title="General" items={primaryItems} collapsed={sidebarCollapsed} />
            <MenuSection title="Reports" items={reportItems} collapsed={sidebarCollapsed} />
          </div>
          <div className="mt-6 border-t border-slate-200 pt-4">
            <MenuSection title="Support" items={secondaryItems} collapsed={sidebarCollapsed} />
          </div>
        </aside>

        <div className="flex min-h-svh flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
                >
                  Menu
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  className="hidden rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 lg:inline-flex"
                >
                  {sidebarCollapsed ? "Expand" : "Collapse"}
                </button>
                <div className="h-8 w-px bg-slate-200" />
                <div className="hidden md:block">
                  <p className="truncate text-sm font-semibold text-slate-900">Admin workspace</p>
                </div>
                <div className="mx-auto hidden max-w-xl flex-1 px-3 md:block">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <span className="mr-2 text-slate-400">⌕</span>
                    <input
                      type="search"
                      placeholder="Search..."
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                >
                  🔔
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                >
                  ⚙
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                  {(user?.fullName ?? "U").charAt(0).toUpperCase()}
                </span>
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-xs font-semibold text-slate-900">{user?.fullName ?? "User"}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.roles?.join(", ") || "Member"}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="mt-2 block md:hidden">
              <p className="truncate text-xs text-slate-500">
                Last login: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
              </p>
            </div>
          </header>

          <main className="flex-1 px-6 py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
