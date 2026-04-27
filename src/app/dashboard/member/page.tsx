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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Member dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Name</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Last login</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Membership status</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile.data?.status ?? "Loading…"}</p>
        </div>
      </div>
    </div>
  );
}
