"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/membership", label: "Details", match: (p: string) => p === "/dashboard/membership" },
  {
    href: "/dashboard/membership/pictures",
    label: "Picture catalog",
    match: (p: string) => p.startsWith("/dashboard/membership/pictures"),
  },
];

export default function MembershipSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-4xl px-1 sm:px-0">
      <nav
        className="mb-4 flex gap-1.5 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm"
        aria-label="My profile sections"
      >
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={[
                "min-h-[48px] flex-1 rounded-xl px-3 py-3 text-center text-sm font-semibold leading-snug transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 active:bg-slate-100",
              ].join(" ")}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
