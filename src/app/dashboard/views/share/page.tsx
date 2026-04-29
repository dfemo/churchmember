"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { MemberViewSubmissionSummary } from "@/types/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { useState } from "react";

export default function ShareYourViewPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const listQuery = useQuery({
    queryKey: ["member-views", "me"],
    queryFn: async () => (await api.get<MemberViewSubmissionSummary[]>("/api/member-views/me")).data,
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<MemberViewSubmissionSummary>("/api/member-views", {
          title: title.trim() || null,
          body: body.trim(),
        })
      ).data,
    onSuccess: async () => {
      notifyOk("Your view was submitted");
      setTitle("");
      setBody("");
      await qc.invalidateQueries({ queryKey: ["member-views", "me"] });
    },
    onError: (e: unknown) => notifyErr(getApiErrorMessage(e)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      notifyErr("Please enter your message.");
      return;
    }
    submitMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-800">
            <MessagesSquare className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Share your view</h1>
            <p className="mt-1 text-sm text-slate-600">
              Share feedback or suggestions. Leaders may reply here—you’ll see each response below your message.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="view-title" className="block text-sm font-medium text-slate-700">
              Title <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="view-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Short headline"
            />
          </div>
          <div>
            <label htmlFor="view-body" className="block text-sm font-medium text-slate-700">
              Your view
            </label>
            <textarea
              id="view-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              required
              maxLength={8000}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Write your thoughts…"
            />
          </div>
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {submitMutation.isPending ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your submissions & replies</h2>
        {listQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : listQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">{getApiErrorMessage(listQuery.error)}</p>
        ) : !listQuery.data?.length ? (
          <p className="mt-4 text-sm text-slate-500">Nothing submitted yet.</p>
        ) : (
          <ul className="mt-6 space-y-6">
            {listQuery.data.map((sub) => (
              <li key={sub.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <span className="font-semibold text-slate-900">{sub.title?.trim() || "Your view"}</span>
                  <time className="text-xs text-slate-500" dateTime={sub.createdAt}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{sub.body}</p>
                {sub.replies.length ? (
                  <div className="mt-4 space-y-3 border-t border-slate-200/80 pt-3">
                    <p className="text-xs font-semibold uppercase text-emerald-700">Responses from church</p>
                    {sub.replies.map((r) => (
                      <div key={r.id} className="rounded-lg border border-emerald-200/60 bg-white px-3 py-2 text-sm">
                        <p className="text-xs text-slate-500">
                          {r.adminName} · {new Date(r.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-slate-800">{r.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-800/90">Received — a response will appear here when available.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
