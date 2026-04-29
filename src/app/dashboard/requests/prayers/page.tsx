"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { PrayerRequestAdminRow } from "@/types/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPrayerRequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [pendingOnly, setPendingOnly] = useState(true);

  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  const q = useQuery({
    queryKey: ["prayer-requests", "admin", pendingOnly],
    queryFn: async () => {
      const path = pendingOnly
        ? "/api/prayer-requests/admin?pendingOnly=true"
        : "/api/prayer-requests/admin";
      return (await api.get<PrayerRequestAdminRow[]>(path)).data;
    },
    enabled: Boolean(user?.roles?.includes("Admin")),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, actioned }: { id: number; actioned: boolean }) =>
      (await api.patch<PrayerRequestAdminRow>(`/api/prayer-requests/admin/${id}/actioned`, { actioned })).data,
    onSuccess: async () => {
      notifyOk("Updated");
      await qc.invalidateQueries({ queryKey: ["prayer-requests"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: unknown) => notifyErr(getApiErrorMessage(e)),
  });

  if (!user?.roles?.includes("Admin")) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-800">
            <HeartHandshake className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Prayer requests</h1>
            <p className="mt-1 text-sm text-slate-600">
              For the Prayer Unit: outstanding requests are highlighted. Mark as actioned when prayed / handled.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/admin"
          className="text-sm font-medium text-violet-700 hover:text-violet-900"
        >
          ← Admin dashboard
        </Link>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={pendingOnly}
          onChange={(e) => setPendingOnly(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show only pending (not actioned)
      </label>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Member</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Request</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Submitted</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {q.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No prayer requests{pendingOnly ? " pending" : ""}.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className={[
                      "bg-white",
                      !r.isActioned ? "bg-amber-50/90 ring-1 ring-inset ring-amber-200/80" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 align-top">
                      {!r.isActioned ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/90 px-2 py-0.5 text-xs font-bold text-amber-950">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          Needs action
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-800">Actioned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-slate-900">{r.memberName}</p>
                      <p className="text-xs text-slate-500">{r.memberPhone ?? "—"}</p>
                    </td>
                    <td className="max-w-md px-4 py-3 align-top">
                      <p className="whitespace-pre-wrap text-slate-800">{r.body}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-slate-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {r.isActioned ? (
                        <button
                          type="button"
                          className="text-xs font-medium text-violet-700 hover:underline"
                          onClick={() => actionMutation.mutate({ id: r.id, actioned: false })}
                          disabled={actionMutation.isPending}
                        >
                          Undo actioned
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          onClick={() => actionMutation.mutate({ id: r.id, actioned: true })}
                          disabled={actionMutation.isPending}
                        >
                          Mark actioned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
