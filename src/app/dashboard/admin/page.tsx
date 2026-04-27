"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import type { DashboardStatsResponse } from "@/types/member";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { user, lastLoginAt } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  const q = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<DashboardStatsResponse>("/api/dashboard/stats")).data,
  });

  if (q.isError) {
    return <p className="text-sm text-rose-700">{getApiErrorMessage(q.error)}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">System admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Analytics overview for members, activity, and birthdays.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-violet-100">Admin user</p>
          <p className="mt-2 text-base font-semibold text-white">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-sky-100">Last login</p>
          <p className="mt-2 text-base font-semibold text-white">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Total members</p>
          <p className="mt-2 text-2xl font-bold text-white">{q.data?.totalMembers ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-sm">
          <p className="text-xs uppercase tracking-wider text-amber-100">Active members</p>
          <p className="mt-2 text-2xl font-bold text-white">{q.data?.activeMembers ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Membership trend (placeholder)</p>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {[42, 56, 49, 67, 58, 75, 70, 83, 79, 86, 90, 95].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-violet-500/70" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Activity split (placeholder)</p>
          <div className="mt-4 flex h-44 items-center justify-center">
            <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#22c55e_0_68%,#f59e0b_68_85%,#e2e8f0_85_100%)]">
              <div className="absolute inset-4 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Today&apos;s birthdays</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(q.data?.todaysBirthdays ?? []).length ? (
              q.data!.todaysBirthdays.map((p) => <li key={p.id}>{p.fullName}</li>)
            ) : (
              <li className="text-slate-500">No birthdays today.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Upcoming birthdays (7 days)</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(q.data?.upcomingBirthdaysNext7Days ?? []).length ? (
              q.data!.upcomingBirthdaysNext7Days.map((p) => (
                <li key={`${p.id}-${p.date}`}>
                  {p.fullName} - {new Date(p.date).toLocaleDateString()}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No upcoming birthdays.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
