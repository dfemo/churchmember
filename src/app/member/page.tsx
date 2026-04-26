"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import type { MemberProfile, UpdateProfileRequest } from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";

function isoToDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function MemberHomePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    address: string;
    dateOfBirth: string;
  } | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MemberProfile>("/api/members/me")).data,
  });

  useEffect(() => {
    if (q.data) {
      setForm({
        fullName: q.data.fullName,
        email: q.data.email ?? "",
        address: q.data.address ?? "",
        dateOfBirth: isoToDateInput(q.data.dateOfBirth),
      });
    }
  }, [q.data]);

  const mutation = useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      await api.put<MemberProfile>("/api/members/me", body);
    },
    onSuccess: () => {
      setMessage({ type: "ok", text: "Profile saved." });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => {
      setMessage({ type: "err", text: getApiErrorMessage(e) });
    },
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!form) return;
    const body: UpdateProfileRequest = {
      fullName: form.fullName.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
    };
    if (!body.fullName) {
      setMessage({ type: "err", text: "Name is required." });
      return;
    }
    mutation.mutate(body);
  }

  if (q.isError) {
    return (
      <div className="p-4">
        <p className="text-rose-700" role="alert">
          {getApiErrorMessage(q.error)}
        </p>
      </div>
    );
  }

  if (q.isLoading || !q.data || !form) {
    return (
      <div className="p-4">
        <p className="text-stone-500">Loading your profile…</p>
      </div>
    );
  }

  const profile = q.data;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold text-stone-800">My profile</h1>
      <p className="mt-0.5 text-sm text-stone-500">Update the details the church can contact you on.</p>

      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        {message ? (
          <p
            className={
              message.type === "ok"
                ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                : "rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
            }
            role="status"
          >
            {message.text}
          </p>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-stone-700">Phone</label>
          <p className="mt-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-base text-stone-600">
            {profile.phoneNumber}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Your sign-in name (contact an admin to change it)</p>
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            value={form.fullName}
            onChange={(e) => setForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            autoComplete="email"
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-stone-700">
            Birthday
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => (f ? { ...f, dateOfBirth: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
          />
        </div>
        <div>
          <label htmlFor="addr" className="block text-sm font-medium text-stone-700">
            Address
          </label>
          <textarea
            id="addr"
            name="addr"
            rows={3}
            value={form.address}
            onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            placeholder="Optional"
            autoComplete="street-address"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-stone-700">Status</span>
          <p className="mt-1 text-base text-stone-700">{profile.status}</p>
        </div>
        {profile.roles?.length ? (
          <div>
            <span className="block text-sm font-medium text-stone-700">Roles</span>
            <p className="mt-1 text-base text-stone-700">{profile.roles.join(", ")}</p>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-amber-700 py-3 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/change-password"
          className="mt-1 block w-full text-center text-sm text-amber-800 underline"
        >
          Change password
        </Link>
      </form>
    </div>
  );
}
