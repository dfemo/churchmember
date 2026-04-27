"use client";

import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import type { MemberProfile } from "@/types/member";
import { useQuery } from "@tanstack/react-query";

export default function MemberDashboardPage() {
  const { user, lastLoginAt } = useAuth();
  const profile = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MemberProfile>("/api/members/me")).data,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Member dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your profile summary and quick account insights.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-violet-100">Name</p>
          <p className="mt-2 text-base font-semibold text-white">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-sky-100">Last login</p>
          <p className="mt-2 text-base font-semibold text-white">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Membership status</p>
          <p className="mt-2 text-base font-semibold text-white">{profile.data?.status ?? "Loading…"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Engagement trend (placeholder)</p>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {[35, 48, 42, 58, 61, 54, 69, 72, 68, 74, 78, 82].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-sky-500/70" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Profile completion (placeholder)</p>
          <div className="mt-4 flex h-44 items-center justify-center">
            <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#8b5cf6_0_72%,#e2e8f0_72_100%)]">
              <div className="absolute inset-4 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Quick actions</p>
        <p className="mt-1 text-sm text-slate-500">
          Use the side menu to view membership details, update records, and change your password.
        </p>
      </div>
    </div>
  );
}
