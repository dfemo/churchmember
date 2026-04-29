"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { AttendanceRecord, MarkSundayAttendanceBody, SundayServiceMode } from "@/types/attendance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Most recent Sunday on or before `d` (local calendar). */
function sundayOnOrBefore(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 0 : day));
  return x;
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSundayIso(iso: string): boolean {
  return parseIsoLocal(iso).getDay() === 0;
}

export default function SundayServiceAttendancePage() {
  const qc = useQueryClient();
  const defaultSunday = useMemo(() => isoDateLocal(sundayOnOrBefore(new Date())), []);
  const [dateIso, setDateIso] = useState(defaultSunday);
  const [mode, setMode] = useState<SundayServiceMode>("Onsite");

  const recordsQuery = useQuery({
    queryKey: ["attendance", "me"],
    queryFn: async () => (await api.get<AttendanceRecord[]>("/api/attendance/me")).data,
  });

  const sundayRows = useMemo(() => {
    const list = recordsQuery.data ?? [];
    return list.filter(
      (r) => r.kind === "ChurchService" && !r.eventName && r.sundayServiceMode != null
    );
  }, [recordsQuery.data]);

  const markMutation = useMutation({
    mutationFn: async (body: MarkSundayAttendanceBody) =>
      (await api.post<AttendanceRecord>("/api/attendance/me/sunday-service", body)).data,
    onSuccess: async () => {
      notifyOk("Attendance recorded");
      await qc.invalidateQueries({ queryKey: ["attendance", "me"] });
    },
    onError: (err: unknown) => notifyErr(getApiErrorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSundayIso(dateIso)) {
      notifyErr("Choose a Sunday date.");
      return;
    }
    markMutation.mutate({ attendanceDate: dateIso, mode });
  }

  return (
    <section className="mx-auto max-w-2xl space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
            <CalendarDays className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sunday service</h1>
            <p className="mt-1 text-sm text-slate-600">
              Record whether you attended online or on-site for a given Sunday. One entry per Sunday.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="svc-date" className="block text-sm font-medium text-slate-700">
              Sunday date
            </label>
            <input
              id="svc-date"
              type="date"
              value={dateIso}
              onChange={(ev) => setDateIso(ev.target.value)}
              className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
              required
            />
            {dateIso && !isSundayIso(dateIso) ? (
              <p className="mt-1 text-xs text-amber-700">Pick a Sunday (weekly service).</p>
            ) : null}
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Attendance mode</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(
                [
                  ["Onsite", "On-site"],
                  ["Online", "Online"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={[
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                    mode === value
                      ? "border-emerald-500/50 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={markMutation.isPending || !isSundayIso(dateIso)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markMutation.isPending ? "Saving…" : "Save attendance"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your Sunday records</h2>
        {recordsQuery.isLoading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : recordsQuery.isError ? (
          <p className="mt-3 text-sm text-red-600">Could not load history.</p>
        ) : sundayRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No Sunday service entries yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {sundayRows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-slate-900">{r.attendanceDate}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {r.sundayServiceMode === "Online" ? "Online" : "On-site"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
