"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { BirthdayWhatsappAnnouncementRunResponse, DashboardStatsResponse } from "@/types/member";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BIRTHDAY_ACK = "cm_birthday_highlight_ack";

function localTodayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export default function AdminDashboardPage() {
  const { user, lastLoginAt } = useAuth();
  const router = useRouter();
  const [birthdayAcknowledgedToday, setBirthdayAcknowledgedToday] = useState<boolean | null>(null);

  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  useEffect(() => {
    try {
      setBirthdayAcknowledgedToday(localStorage.getItem(BIRTHDAY_ACK) === localTodayIso());
    } catch {
      setBirthdayAcknowledgedToday(false);
    }
  }, []);

  const q = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<DashboardStatsResponse>("/api/dashboard/stats")).data,
  });

  const sendBirthdayWhatsApp = useMutation({
    mutationFn: async () =>
      (await api.post<BirthdayWhatsappAnnouncementRunResponse>("/api/birthdays/whatsapp/send-today", {})).data,
    onSuccess: (data) => {
      const lines = data.results.map((r) => `${r.fullName}: ${r.outcome}${r.sentToFamilyOrCelebrant ? ` → ${r.sentToFamilyOrCelebrant}` : ""}${r.sentToChurchLine ? `; church ${r.sentToChurchLine}` : ""}`);
      const detail = lines.length ? lines.join("\n") : "No celebrants for this local date.";
      notifyOk(
        `Birthday WhatsApp run (${data.localDate}, ${data.timeZone})`,
        detail.length > 600 ? `${detail.slice(0, 600)}…` : detail
      );
      void q.refetch();
    },
    onError: (e: unknown) => {
      notifyErr("Birthday WhatsApp run failed", getApiErrorMessage(e));
    },
  });

  const todays = q.data?.todaysBirthdays ?? [];
  const hasBirthdaysToday = todays.length > 0;
  const showBirthdayBanner =
    birthdayAcknowledgedToday !== null && hasBirthdaysToday && !birthdayAcknowledgedToday;

  function acknowledgeBirthdayHighlight() {
    try {
      localStorage.setItem(BIRTHDAY_ACK, localTodayIso());
    } catch {
      /* private mode */
    }
    setBirthdayAcknowledgedToday(true);
  }

  if (q.isError) {
    return <p className="text-sm text-rose-700">{getApiErrorMessage(q.error)}</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Elegant analytics overview for members, activity, and birthdays. Birthday matches use{" "}
          <span className="font-medium text-slate-700">month and day</span> each year (year ignored).
        </p>
      </div>

      {showBirthdayBanner ? (
        <div
          role="status"
          className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 via-amber-50 to-violet-50 p-4 shadow-md"
        >
          <Gift className="mt-0.5 h-8 w-8 shrink-0 text-rose-600" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Birthday highlight — due today</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{todays.map((p) => p.fullName).join(", ")}</p>
          </div>
          <button
            type="button"
            onClick={acknowledgeBirthdayHighlight}
            className="shrink-0 rounded-lg border border-slate-400 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Acknowledge
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/requests/prayers"
          className={[
            "rounded-2xl border p-5 shadow-sm transition hover:opacity-95",
            (q.data?.pendingPrayerRequests ?? 0) > 0
              ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/80"
              : "border-slate-200 bg-white/90",
          ].join(" ")}
        >
          <p className="text-xs uppercase tracking-wider text-slate-600">Prayer requests (pending)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.pendingPrayerRequests ?? "—"}</p>
          <p className="mt-2 text-xs font-medium text-violet-700">Open Prayer Unit queue →</p>
        </Link>
        <Link
          href="/dashboard/requests/member-views"
          className={[
            "rounded-2xl border p-5 shadow-sm transition hover:opacity-95",
            (q.data?.memberViewsAwaitingResponse ?? 0) > 0
              ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/80"
              : "border-slate-200 bg-white/90",
          ].join(" ")}
        >
          <p className="text-xs uppercase tracking-wider text-slate-600">Member views (awaiting reply)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.memberViewsAwaitingResponse ?? "—"}</p>
          <p className="mt-2 text-xs font-medium text-violet-700">Respond to members →</p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-violet-600">Admin user</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{user?.fullName ?? "-"}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-sky-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-sky-600">Last login</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {lastLoginAt ? new Date(lastLoginAt).toLocaleString() : "Not available"}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-emerald-600">Total members</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.totalMembers ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-amber-700">Active members</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{q.data?.activeMembers ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl lg:col-span-2">
          <p className="text-sm font-semibold text-slate-900">Membership trend (placeholder)</p>
          <div className="mt-4 flex h-44 items-end gap-2 rounded-lg bg-slate-50 p-3">
            {[42, 56, 49, 67, 58, 75, 70, 83, 79, 86, 90, 95].map((v, i) => (
              <div key={i} className="flex-1 rounded-t bg-violet-500/70" style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-semibold text-slate-900">Activity split (placeholder)</p>
          <div className="mt-4 flex h-44 items-center justify-center">
            <div className="relative h-36 w-36 rounded-full bg-[conic-gradient(#22c55e_0_68%,#f59e0b_68_85%,#94a3b8_85_100%)]">
              <div className="absolute inset-4 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className={`rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur-xl ${
            hasBirthdaysToday
              ? "border-2 border-rose-400 ring-2 ring-rose-200/70"
              : "border border-slate-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              {hasBirthdaysToday ? <Gift className="h-4 w-4 shrink-0 text-rose-600" aria-hidden /> : null}
              Today&apos;s birthdays
            </p>
            {hasBirthdaysToday ? (
              <button
                type="button"
                disabled={sendBirthdayWhatsApp.isPending}
                onClick={() => sendBirthdayWhatsApp.mutate()}
                className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-900 hover:bg-violet-100 disabled:opacity-50"
              >
                {sendBirthdayWhatsApp.isPending ? "Sending…" : "Send birthday WhatsApp (today)"}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            Uses server automation: Twilio template with celebrant name when <code className="rounded bg-slate-100 px-0.5">WhatsApp:Provider</code> is{" "}
            <code className="rounded bg-slate-100 px-0.5">Twilio</code> and a Content SID is set; otherwise Meta plain text. Sends to the member or parent
            phone fallback, plus <code className="rounded bg-slate-100 px-0.5">WhatsApp:Birthday:ChurchLinePhone</code> when configured.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {hasBirthdaysToday ? (
              todays.map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border border-rose-200 bg-rose-50/90 px-3 py-2 font-medium text-slate-900"
                >
                  {p.fullName}
                </li>
              ))
            ) : (
              <li className="text-slate-500">No birthdays today.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-sm font-semibold text-slate-900">Upcoming birthdays (7 days)</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(q.data?.upcomingBirthdaysNext7Days ?? []).length ? (
              q.data!.upcomingBirthdaysNext7Days.map((p) => (
                <li key={`${p.id}-${p.date}`}>
                  {p.fullName} — {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
