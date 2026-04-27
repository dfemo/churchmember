"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import type { MemberProfile, UpdateProfileRequest } from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function isoToDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function MembershipDetailsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    address: string;
    dateOfBirth: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MemberProfile>("/api/members/me")).data,
  });

  useEffect(() => {
    if (!q.data) return;
    setForm({
      fullName: q.data.fullName,
      email: q.data.email ?? "",
      address: q.data.address ?? "",
      dateOfBirth: isoToDateInput(q.data.dateOfBirth),
    });
  }, [q.data]);

  const mutation = useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      await api.put<MemberProfile>("/api/members/me", body);
    },
    onSuccess: () => {
      setMessage({ type: "ok", text: "Membership details updated." });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMessage({ type: "err", text: getApiErrorMessage(e) }),
  });

  if (q.isError) return <p className="text-sm text-rose-200">{getApiErrorMessage(q.error)}</p>;
  if (q.isLoading || !q.data || !form) return <p className="text-sm text-slate-200">Loading membership…</p>;

  const profile = q.data;
  return (
    <div className="max-w-4xl rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-white">View membership details</h1>
      <p className="mt-1 text-sm text-slate-200">Update records of name, email, date of birth, and address.</p>
      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form) return;
          mutation.mutate({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            dateOfBirth: form.dateOfBirth || null,
            address: form.address.trim() || null,
          });
        }}
      >
        {message ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === "ok"
                ? "border border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
                : "border border-rose-300/40 bg-rose-500/20 text-rose-100"
            }`}
          >
            {message.text}
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-100">Phone</label>
            <p className="mt-1 rounded-lg border border-white/20 bg-slate-900/30 px-3 py-2.5 text-sm text-slate-100">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-100">
              Full name
            </label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
              className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-100">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
              className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300"
            />
          </div>
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-slate-100">
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => (f ? { ...f, dateOfBirth: e.target.value } : f))}
              className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-100">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={form.address}
            onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg border border-white/40 bg-white/20 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Update records"}
        </button>
      </form>
    </div>
  );
}
