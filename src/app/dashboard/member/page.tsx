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
        <h1 className="text-2xl font-semibold text-white">Member dashboard</h1>
        <p className="mt-1 text-sm text-slate-200">Your profile summary and quick account insights.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-violet-600/70 to-violet-500/70 p-5 text-white shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wider text-violet-100">Name</p>
          <p className="mt-2 text-base font-semibold text-white">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-sky-600/70 to-sky-500/70 p-5 text-white shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wider text-sky-100">Last login</p>
          <p className="mt-2 text-base font-semibold text-white">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-600/70 to-emerald-500/70 p-5 text-white shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Membership status</p>
          <p className="mt-2 text-base font-semibold text-white">{profile.data?.status ?? "Loading…"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl lg:col-span-2">
          <p className="text-sm font-semibold text-white">Engagement trend (placeholder)</p>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-950/30 p-3">
            {[35, 48, 42, 58, 61, 54, 69, 72, 68, 74, 78, 82].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-sky-300/80" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-semibold text-white">Profile completion (placeholder)</p>
          <div className="mt-4 flex h-44 items-center justify-center">
            <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#8b5cf6_0_72%,#94a3b8_72_100%)]">
              <div className="absolute inset-4 rounded-full bg-slate-900/70" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl">
        <p className="text-sm font-semibold text-white">Quick actions</p>
        <p className="mt-1 text-sm text-slate-200">
          Use the side menu to view membership details, update records, and change your password.
        </p>
      </div>
    </div>
  );
}
