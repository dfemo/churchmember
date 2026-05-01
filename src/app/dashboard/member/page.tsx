"use client";

import { useAuth } from "@/contexts/auth-context";
import { FamilyTiesCards } from "@/components/member/family-ties-cards";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AttendanceRecord } from "@/types/attendance";
import type { MemberProfile } from "@/types/member";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function MemberDashboardPage() {
  const { user, lastLoginAt } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));
  const profile = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MemberProfile>("/api/members/me")).data,
  });

  const attendanceQuery = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => (await api.get<AttendanceRecord[]>("/api/attendance/me")).data,
  });

  const sundayAttendance = useMemo(() => {
    const list = attendanceQuery.data ?? [];
    return list
      .filter((r) => r.kind === "ChurchService" && !r.eventName && r.sundayServiceMode != null)
      .sort((a, b) => (a.attendanceDate < b.attendanceDate ? 1 : -1))
      .slice(0, 12);
  }, [attendanceQuery.data]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your profile summary and quick account insights.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-violet-600">Name</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-sky-600">Last login</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-600">Membership status</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{profile.data?.status ?? "Loading…"}</p>
        </div>
      </div>

      {profile.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-8 shadow-sm">
          <p className="text-sm text-slate-500">Loading family ties…</p>
        </div>
      ) : profile.data ? (
        <FamilyTiesCards profile={profile.data} isAdmin={isAdmin} />
      ) : profile.isError ? (
        <p className="text-sm text-rose-600">{getApiErrorMessage(profile.error)}</p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
              <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Sunday attendance</h2>
              <p className="mt-0.5 text-sm text-slate-500">Recent Sundays you marked as on-site or online.</p>
            </div>
          </div>
          <Link
            href="/dashboard/attendance/sunday-service"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            Record attendance
          </Link>
        </div>

        {attendanceQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading attendance…</p>
        ) : attendanceQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{getApiErrorMessage(attendanceQuery.error)}</p>
        ) : sundayAttendance.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            No entries yet. Use <span className="font-medium text-slate-800">Record attendance</span> after a Sunday
            service.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-2">
            {sundayAttendance.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium text-slate-900">{r.attendanceDate}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {r.sundayServiceMode === "Online" ? "Online" : "On-site"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Engagement trend (placeholder)</p>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {[35, 48, 42, 58, 61, 54, 69, 72, 68, 74, 78, 82].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-sky-500/70" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-semibold text-slate-900">Profile completion (placeholder)</p>
          <div className="mt-4 flex h-44 items-center justify-center">
            <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#8b5cf6_0_72%,#94a3b8_72_100%)]">
              <div className="absolute inset-4 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <p className="text-sm font-semibold text-slate-900">Quick actions</p>
        <p className="mt-1 text-sm text-slate-500">
          Use the side menu to view membership details, update records, and change your password.
        </p>
      </div>
    </div>
  );
}
