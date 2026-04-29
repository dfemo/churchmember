"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import type { MemberViewAdminListRow, MemberViewSubmissionSummary } from "@/types/requests";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminMemberViewsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  const q = useQuery({
    queryKey: ["member-views", "admin"],
    queryFn: async () => (await api.get<MemberViewAdminListRow[]>("/api/member-views/admin")).data,
    enabled: Boolean(user?.roles?.includes("Admin")),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: string }) =>
      (await api.post<MemberViewSubmissionSummary>(`/api/member-views/admin/${id}/replies`, { body })).data,
    onSuccess: async () => {
      notifyOk("Reply sent");
      setReplyOpenId(null);
      setReplyBody("");
      await qc.invalidateQueries({ queryKey: ["member-views"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: unknown) => notifyErr(getApiErrorMessage(e)),
  });

  function sendReply(id: number) {
    if (!replyBody.trim()) {
      notifyErr("Enter a reply.");
      return;
    }
    replyMutation.mutate({ id, body: replyBody.trim() });
  }

  if (!user?.roles?.includes("Admin")) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-800">
            <MessagesSquare className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Member views</h1>
            <p className="mt-1 text-sm text-slate-600">
              Read member submissions and post responses. Items without a reply yet are flagged.
            </p>
          </div>
        </div>
        <Link href="/dashboard/admin" className="text-sm font-medium text-violet-700 hover:text-violet-900">
          ← Admin dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {q.isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : q.isError ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(q.error)}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No submissions yet.</p>
        ) : (
          rows.map((r) => (
            <article
              key={r.id}
              className={[
                "rounded-2xl border p-5 shadow-sm",
                r.awaitingFirstResponse
                  ? "border-amber-300 bg-amber-50/80 ring-1 ring-amber-200/90"
                  : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{r.title?.trim() || "Member view"}</p>
                  <p className="text-sm text-slate-600">
                    {r.memberName} · {r.memberPhone ?? "—"}
                  </p>
                  <time className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</time>
                </div>
                {r.awaitingFirstResponse ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/90 px-2 py-1 text-xs font-bold text-amber-950">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    Awaiting response
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500">{r.replyCount} admin replies</span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{r.body}</p>

              {replyOpenId === r.id ? (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <label className="sr-only" htmlFor={`reply-${r.id}`}>
                    Reply
                  </label>
                  <textarea
                    id={`reply-${r.id}`}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-inner outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15"
                    placeholder="Write a response for the member…"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      onClick={() => sendReply(r.id)}
                      disabled={replyMutation.isPending}
                    >
                      Send reply
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setReplyOpenId(null);
                        setReplyBody("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-violet-700 hover:text-violet-900"
                  onClick={() => {
                    setReplyOpenId(r.id);
                    setReplyBody("");
                  }}
                >
                  {r.replyCount ? "Add another reply" : "Respond"}
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
