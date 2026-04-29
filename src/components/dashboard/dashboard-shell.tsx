"use client";

import { useAuth } from "@/contexts/auth-context";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Images,
  KeyRound,
  LayoutDashboard,
  ListFilter,
  LogOut,
  PanelLeft,
  ReceiptText,
  Search,
  Settings,
  UserCircle,
  UserCog,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  /** Extra indent under section heading (subsection). Default true when omitted. */
  sub?: boolean;
  /** When true, active only if pathname equals href (no `/href/...` prefix match). */
  matchExact?: boolean;
  /** When true, only administrators see this link. */
  adminOnly?: boolean;
};

type MenuSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
  adminOnly?: boolean;
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
  const active = item.matchExact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={[
        "group flex items-center gap-3 rounded-lg py-2 text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        item.sub && !collapsed ? "pl-9" : "",
        active
          ? "bg-white/[0.12] text-white shadow-[inset_3px_0_0_#34d399]"
          : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent transition-colors",
          active
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
            : "bg-zinc-800/60 text-zinc-500 group-hover:text-zinc-300",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </span>
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge ? (
            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200/90">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

function NavSection({
  section,
  collapsed,
  expanded,
  onToggle,
  onNavigate,
}: {
  section: MenuSection;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const activeInSection = section.items.some((item) =>
    item.matchExact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const SectionIcon = section.icon;

  if (collapsed) {
    return (
      <section className="space-y-0.5">
        {section.items.map((item) => (
          <NavItem
            key={item.href}
            item={{ ...item, sub: item.sub !== undefined ? item.sub : true }}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-1" aria-labelledby={section.id}>
      <button
        type="button"
        id={section.id}
        onClick={onToggle}
        className={[
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] font-semibold tracking-[0.08em] uppercase transition",
          activeInSection
            ? "bg-white/[0.08] text-zinc-100"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
        ].join(" ")}
      >
        <SectionIcon className="h-4 w-4" strokeWidth={1.6} />
        <span className="min-w-0 flex-1 truncate">{section.title}</span>
        <ChevronDown
          className={["h-4 w-4 transition-transform", expanded ? "rotate-180" : ""].join(" ")}
          strokeWidth={1.6}
        />
      </button>
      {expanded ? (
        <nav className="space-y-0.5" aria-label={section.title}>
          {section.items.map((item) => (
            <NavItem
              key={item.href}
              item={{ ...item, sub: item.sub !== undefined ? item.sub : true }}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      ) : null}
    </section>
  );
}

function SidebarContent({
  collapsed,
  isAdmin,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  onNavigate?: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const sections = useMemo<MenuSection[]>(
    () => [
      {
        id: "nav-dashboard",
        title: "Dashboard",
        icon: LayoutDashboard,
        adminOnly: true,
        items: [{ href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard }],
      },
      {
        id: "nav-users",
        title: "User Management",
        icon: UserCog,
        adminOnly: true,
        items: [
          { href: "/dashboard/user-management", label: "View all users", icon: UserCog },
          { href: "/dashboard/user-management/create", label: "Create user", icon: UserPlus },
        ],
      },
      {
        id: "nav-attendance",
        title: "Attendance Management",
        icon: ClipboardList,
        items: [
          {
            href: "/dashboard/attendance/sunday-service",
            label: "Sunday service",
            icon: CalendarDays,
            sub: false,
          },
          {
            href: "/dashboard/attendant",
            label: "View metrics",
            icon: ClipboardList,
            adminOnly: true,
          },
          {
            href: "/dashboard/reports",
            label: "View growth",
            icon: BarChart3,
            adminOnly: true,
          },
          {
            href: "/dashboard/attendance/by-service-type",
            label: "Service type attendance",
            icon: ListFilter,
            adminOnly: true,
          },
        ],
      },
      {
        id: "nav-reports",
        title: "Report Management",
        icon: ReceiptText,
        adminOnly: true,
        items: [{ href: "/dashboard/reports", label: "Reports", icon: ReceiptText }],
      },
      {
        id: "nav-account",
        title: "Account Management",
        icon: UserCircle,
        items: [
          {
            href: "/dashboard/membership",
            label: "Membership details",
            icon: UserCircle,
            sub: false,
            matchExact: true,
          },
          {
            href: "/dashboard/membership/pictures",
            label: "Picture catalog",
            icon: Images,
            sub: true,
          },
          { href: "/dashboard/password", label: "Change password", icon: KeyRound, sub: false },
        ],
      },
    ],
    []
  );
  const visibleSections = sections.filter((s) => (s.adminOnly ? isAdmin : true));
  const navSections = useMemo(
    () =>
      visibleSections
        .map((s) => ({
          ...s,
          items: s.items.filter((item) => !item.adminOnly || isAdmin),
        }))
        .filter((s) => s.items.length > 0),
    [visibleSections, isAdmin]
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Start simple for non-technical users: show links immediately.
    const allOpen = Object.fromEntries(navSections.map((s) => [s.id, true])) as Record<string, boolean>;
    setExpandedSections((prev) => (Object.keys(prev).length === 0 ? allOpen : prev));
  }, [navSections]);

  useEffect(() => {
    const activeSection = navSections.find((s) =>
      s.items.some((item) =>
        item.matchExact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    );
    if (!activeSection) return;
    setExpandedSections((prev) => (prev[activeSection.id] ? prev : { ...prev, [activeSection.id]: true }));
  }, [pathname, navSections]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={[
          "mb-4 flex items-center gap-3 border-b border-zinc-800/80 px-1 pb-5",
          collapsed ? "flex-col" : "",
        ].join(" ")}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/90 to-teal-600 text-sm font-bold tracking-tight text-zinc-950">
          CM
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-white">Church Members</p>
            <p className="text-xs text-zinc-500">Member & admin portal</p>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navSections.map((section) => (
          <NavSection
            key={section.id}
            section={section}
            collapsed={collapsed}
            expanded={Boolean(expandedSections[section.id])}
            onToggle={() =>
              setExpandedSections((prev) => ({
                ...prev,
                [section.id]: !prev[section.id],
              }))
            }
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="mt-auto border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft
            className={["h-4 w-4 transition-transform", collapsed ? "rotate-180" : ""].join(" ")}
            strokeWidth={1.5}
          />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, logout, lastLoginAt } = useAuth();
  const router = useRouter();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  function signOut() {
    logout();
    router.push("/login");
  }

  const sidebarW = sidebarCollapsed ? "w-[4.5rem]" : "w-64";

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-zinc-100 text-zinc-900 antialiased md:flex-row">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 border-r border-zinc-800/80 bg-zinc-950 p-4 shadow-2xl shadow-zinc-950/40",
          "lg:static lg:z-0 lg:shrink-0 lg:shadow-none",
          "transition-[width] duration-200 ease-out",
          sidebarW,
          mobileOpen ? "flex" : "hidden",
          "lg:flex",
        ].join(" ")}
      >
        <div className="h-full w-full min-w-0">
          <SidebarContent
            collapsed={sidebarCollapsed}
            isAdmin={isAdmin}
            onNavigate={() => setMobileOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-16 shrink-0 items-center border-b border-zinc-200/90 bg-white/90 px-4 shadow-sm shadow-zinc-900/[0.03] backdrop-blur-md sm:px-5 lg:px-8">
          <div className="flex w-full min-w-0 items-center gap-3 lg:gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 lg:hidden"
            >
              Menu
            </button>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {isAdmin ? "Admin workspace" : "Member workspace"}
              </p>
              <p className="truncate text-[11px] text-zinc-500">Welcome back—here is your summary</p>
              <p className="truncate text-[10px] text-zinc-400" suppressHydrationWarning>
                Last sign-in: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
              </p>
            </div>

            <div className="mx-auto hidden w-full max-w-md md:block">
              <label className="relative block">
                <span className="sr-only">Search</span>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  strokeWidth={1.5}
                />
                <input
                  type="search"
                  placeholder="Search records, people, or reports…"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50/80 pl-10 pr-3 text-sm text-zinc-800 shadow-inner shadow-zinc-900/[0.02] outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/40 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                />
              </label>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="App settings"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/90 py-1 pl-1.5 pr-1.5 shadow-sm">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-700 text-xs font-semibold text-white">
                  {(user?.fullName ?? "U").charAt(0).toUpperCase()}
                </span>
                <div className="hidden min-w-0 leading-tight sm:block">
                  <p className="truncate text-xs font-semibold text-zinc-900">{user?.fullName ?? "User"}</p>
                  <p className="truncate text-[10px] text-zinc-500">{user?.roles?.join(", ") || "Member"}</p>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-900"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden lg:inline">Log out</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-zinc-200/60 bg-zinc-50/80 px-4 py-1.5 text-center text-[11px] text-zinc-500 sm:px-8 sm:text-left md:hidden">
          Last sign-in: {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,_#f4f4f5_0%,_#fafafa_32%,_#fafafa_100%)]">
          <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
