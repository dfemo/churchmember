"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type {
  AttendanceKind,
  BulkAttendanceBody,
  BulkAttendanceResponse,
  SundayServiceMode,
} from "@/types/attendance";
import type { MemberListItem } from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSundayIso(iso: string): boolean {
  return parseIsoLocal(iso).getDay() === 0;
}

export default function AdminRecordAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));

  const [dateIso, setDateIso] = useState(() => isoDateLocal(new Date()));
  const [kind, setKind] = useState<AttendanceKind>("ChurchService");
  const [eventName, setEventName] = useState("");
  const [sundayMode, setSundayMode] = useState<SundayServiceMode>("Onsite");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard/member");
  }, [user, isAdmin, router]);

  const membersQuery = useQuery({
    queryKey: ["members", "list-all"],
    queryFn: async () => (await api.get<MemberListItem[]>("/api/members")).data,
    enabled: isAdmin,
  });

  const activeMembers = useMemo(
    () => (membersQuery.data ?? []).filter((m) => m.status === "Active").sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [membersQuery.data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeMembers;
    return activeMembers.filter((m) => m.fullName.toLowerCase().includes(q));
  }, [activeMembers, query]);

  const bulkMutation = useMutation({
    mutationFn: async (body: BulkAttendanceBody) =>
      (await api.post<BulkAttendanceResponse>("/api/attendance/admin/bulk", body)).data,
    onSuccess: async (data) => {
      const parts = [
        `${data.createdCount} recorded`,
        data.skippedDuplicateCount ? `${data.skippedDuplicateCount} duplicate(s) skipped` : null,
        data.skippedNotFoundCount ? `${data.skippedNotFoundCount} not found` : null,
      ].filter(Boolean);
      notifyOk("Attendance saved", parts.join(" · "));
      setSelected(new Set());
      await qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      await qc.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e: unknown) => notifyErr(getApiErrorMessage(e)),
  });

  function toggleId(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const m of filtered) next.add(m.id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const userIds = [...selected];
    if (userIds.length === 0) {
      notifyErr("Select at least one member.");
      return;
    }
    if (kind === "ChurchService") {
      if (!isSundayIso(dateIso)) {
        notifyErr("Sunday church service should use a Sunday date (or choose Event for other gatherings).");
        return;
      }
      const body: BulkAttendanceBody = {
        attendanceDate: dateIso,
        kind: "ChurchService",
        userIds,
        sundayServiceMode: sundayMode,
        eventName: null,
      };
      bulkMutation.mutate(body);
      return;
    }

    const trimmed = eventName.trim();
    if (!trimmed) {
      notifyErr("Enter an event name.");
      return;
    }
    bulkMutation.mutate({
      attendanceDate: dateIso,
      kind: "Event",
      userIds,
      eventName: trimmed,
      sundayServiceMode: null,
    });
  }

  if (!user || !isAdmin) {
    return (
      <p className="text-sm text-slate-500" aria-hidden>
        Loading…
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-800">
              <ClipboardCheck className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Record attendance (admin)</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-600">
                Mark Sunday church service (online or on-site) or any named event for multiple members at once.
                Duplicates for the same member, date, and event type are skipped automatically.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/attendance/sunday-service"
            className="text-sm font-medium text-violet-700 hover:underline"
          >
            Member self-service Sunday form →
          </Link>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="adm-att-date" className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="adm-att-date"
                type="date"
                value={dateIso}
                onChange={(ev) => setDateIso(ev.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">Type</legend>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="att-kind"
                  checked={kind === "ChurchService"}
                  onChange={() => setKind("ChurchService")}
                  className="text-violet-600"
                />
                Sunday church service
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="att-kind"
                  checked={kind === "Event"}
                  onChange={() => setKind("Event")}
                  className="text-violet-600"
                />
                Other event (prayer night, conference, etc.)
              </label>
            </fieldset>
          </div>

          {kind === "ChurchService" ? (
            <div>
              <label htmlFor="adm-sunday-mode" className="block text-sm font-medium text-slate-700">
                Mode
              </label>
              <select
                id="adm-sunday-mode"
                value={sundayMode}
                onChange={(ev) => setSundayMode(ev.target.value as SundayServiceMode)}
                className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
              >
                <option value="Onsite">On-site</option>
                <option value="Online">Online</option>
              </select>
              {dateIso && !isSundayIso(dateIso) ? (
                <p className="mt-1 text-xs text-amber-700">
                  Pick a Sunday for church service rows, or switch to &quot;Other event&quot; for non-Sunday gatherings.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Matches self-service Sunday marks and dashboard Sunday counts (same date + mode rules).
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="adm-event-name" className="block text-sm font-medium text-slate-700">
                Event name
              </label>
              <input
                id="adm-event-name"
                type="text"
                value={eventName}
                onChange={(ev) => setEventName(ev.target.value)}
                placeholder="e.g. Midweek prayer, Youth rally"
                maxLength={200}
                className="mt-1.5 w-full max-w-lg rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
              />
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">
                Members ({selected.size} selected · {activeMembers.length} active)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Select all in list
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              type="search"
              placeholder="Filter by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
              {filtered.length === 0 ? (
                <li className="px-2 py-3 text-center text-xs text-slate-500">No members match.</li>
              ) : (
                filtered.map((m) => (
                  <li key={m.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-violet-50/80">
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggleId(m.id)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500/40"
                      />
                      <span className="flex-1 text-sm text-slate-900">{m.fullName}</span>
                      <Link
                        href={`/dashboard/user-management/${m.id}`}
                        className="text-[11px] font-medium text-violet-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Profile
                      </Link>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={bulkMutation.isPending || selected.size === 0}
              className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkMutation.isPending ? "Saving…" : "Save attendance"}
            </button>
            <Link href="/dashboard/attendance/by-service-type" className="text-sm font-medium text-slate-600 hover:text-violet-800 hover:underline">
              View service-type report →
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
