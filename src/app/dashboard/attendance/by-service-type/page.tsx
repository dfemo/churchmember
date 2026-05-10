"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  SundayServiceAttendanceAdminRow,
  SundayServiceMode,
  UpdateSundayServiceAttendanceBody,
} from "@/types/attendance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListFilter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const modeOptions: { value: "" | SundayServiceMode; label: string }[] = [
  { value: "", label: "All modes" },
  { value: "Online", label: "Online" },
  { value: "Onsite", label: "On-site" },
];

const unsetMode = "__unset__" as const;

export default function AttendanceByServiceTypePage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => isoDateLocal(today), [today]);
  const defaultFrom = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 56);
    return isoDateLocal(d);
  }, [today]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [mode, setMode] = useState<"" | SundayServiceMode>("");

  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  const reportQuery = useQuery({
    queryKey: ["attendance", "admin", "sunday", from, to, mode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (mode) params.set("mode", mode);
      const q = params.toString();
      const path = q ? `/api/attendance/admin/sunday-service?${q}` : "/api/attendance/admin/sunday-service";
      return (await api.get<SundayServiceAttendanceAdminRow[]>(path)).data;
    },
    enabled: Boolean(user?.roles?.includes("Admin")),
  });

  const updateModeMutation = useMutation({
    mutationFn: async ({ recordId, body }: { recordId: number; body: UpdateSundayServiceAttendanceBody }) =>
      (
        await api.patch<{ sundayServiceMode: SundayServiceMode | null }>(
          `/api/attendance/admin/sunday-service/${recordId}`,
          body
        )
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance", "admin", "sunday"] });
    },
  });

  if (!user?.roles?.includes("Admin")) {
    return (
      <p className="text-sm text-slate-500" aria-hidden>
        Loading…
      </p>
    );
  }

  const rows = reportQuery.data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-800">
            <ListFilter className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Service type attendance</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sunday church-service attendance with online vs on-site breakdown (same data members submit under Sunday
              service).
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm">
        <label className="text-sm">
          <span className="block font-medium text-slate-700">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
          />
        </label>
        <label className="text-sm">
          <span className="block font-medium text-slate-700">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "" | SundayServiceMode)}
            className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
          >
            {modeOptions.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {reportQuery.isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(reportQuery.error)}</p>
      ) : null}

      {updateModeMutation.isError ? (
        <p className="text-sm text-red-600">{getApiErrorMessage(updateModeMutation.error)}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Member</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Phone</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Mode</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Correct mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No records in this range.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="bg-white hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-900">{r.attendanceDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.fullName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.phoneNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.sundayServiceMode ? (
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                          {r.sundayServiceMode === "Online" ? "Online" : "On-site"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Correct attendance mode for ${r.fullName} on ${r.attendanceDate}`}
                        className="max-w-[11rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs shadow-inner outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-60"
                        value={r.sundayServiceMode ?? unsetMode}
                        disabled={updateModeMutation.isPending}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === unsetMode || next === r.sundayServiceMode) return;
                          updateModeMutation.mutate({
                            recordId: r.id,
                            body: { mode: next as SundayServiceMode },
                          });
                        }}
                      >
                        <option value={unsetMode} disabled>
                          Set mode…
                        </option>
                        <option value="Online">Online</option>
                        <option value="Onsite">On-site</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
