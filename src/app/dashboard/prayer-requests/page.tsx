"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { PrayerRequestMemberRow } from "@/types/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartHandshake } from "lucide-react";
import { useState } from "react";

export default function PrayerRequestsMemberPage() {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const listQuery = useQuery({
    queryKey: ["prayer-requests", "me"],
    queryFn: async () => (await api.get<PrayerRequestMemberRow[]>("/api/prayer-requests/me")).data,
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      (await api.post<PrayerRequestMemberRow>("/api/prayer-requests", { body: body.trim() })).data,
    onSuccess: async () => {
      notifyOk("Prayer request submitted");
      setBody("");
      await qc.invalidateQueries({ queryKey: ["prayer-requests", "me"] });
    },
    onError: (e: unknown) => notifyErr(getApiErrorMessage(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      notifyErr("Please describe your prayer need.");
      return;
    }
    submitMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-800">
            <HeartHandshake className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Prayer & intercession</h1>
            <p className="mt-1 text-sm text-slate-600">
              Request prayer for yourself or others. The Prayer Unit receives these requests. You’ll see when your
              request has been marked as prayed for / actioned.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="prayer-body" className="block text-sm font-medium text-slate-700">
              Prayer request
            </label>
            <textarea
              id="prayer-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              required
              maxLength={8000}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-rose-500/40 focus:ring-2 focus:ring-rose-500/15"
              placeholder="Share what we can pray for…"
            />
          </div>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your requests</h2>
        {listQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : listQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{getApiErrorMessage(listQuery.error)}</p>
        ) : !listQuery.data?.length ? (
          <p className="mt-4 text-sm text-slate-500">No requests yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {listQuery.data.map((r) => (
              <li key={r.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</time>
                  <span
                    className={[
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      r.isActioned ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900",
                    ].join(" ")}
                  >
                    {r.isActioned ? "Actioned by Prayer Unit" : "Pending"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{r.body}</p>
                {r.isActioned && r.actionedAt ? (
                  <p className="mt-2 text-xs text-slate-500">Marked: {new Date(r.actionedAt).toLocaleString()}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
