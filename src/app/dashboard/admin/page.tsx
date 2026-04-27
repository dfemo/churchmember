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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Admin dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Admin user</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Last login</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total members</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.totalMembers ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active members</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.activeMembers ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Today&apos;s birthdays</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(q.data?.todaysBirthdays ?? []).length ? (
              q.data!.todaysBirthdays.map((p) => <li key={p.id}>{p.fullName}</li>)
            ) : (
              <li className="text-slate-500">No birthdays today.</li>
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
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
