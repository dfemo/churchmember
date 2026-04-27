"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import type { MemberListItem, MemberProfile, UpdateMemberRequest } from "@/types/member";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const TITLE_OPTIONS = ["Mr", "Mrs", "Chief", "Doctor"] as const;
const POSITION_OPTIONS = ["Pastor", "Prophet", "Shepherd", "Sister", "Brother", "Reverend", "Apostle"] as const;

function toDateInput(v: string | null | undefined) {
  return v ? v.slice(0, 10) : "";
}

function buildFormData(profile: MemberProfile): UpdateMemberRequest {
  return {
    fullName: profile.fullName,
    email: profile.email ?? null,
    dateOfBirth: toDateInput(profile.dateOfBirth) || null,
    address: profile.address ?? null,
    title: profile.title ?? null,
    position: profile.position ?? null,
    status: profile.status,
    role: profile.roles.includes("Admin") ? "Admin" : "Member",
  };
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateMemberRequest | null>(null);

  const users = useQuery({
    queryKey: ["members-list"],
    queryFn: async () => (await api.get<MemberListItem[]>("/api/members")).data,
  });

  const selected = useQuery({
    queryKey: ["member", selectedId],
    enabled: selectedId !== null,
    queryFn: async () => (await api.get<MemberProfile>(`/api/members/${selectedId}`)).data,
  });

  useEffect(() => {
    if (!selected.data) return;
    setForm(buildFormData(selected.data));
  }, [selected.data]);

  const update = useMutation({
    mutationFn: async (payload: { id: number; body: UpdateMemberRequest }) =>
      api.put(`/api/members/${payload.id}`, payload.body),
    onSuccess: async () => {
      setErr(null);
      setOk("User updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["members-list"] });
      if (selectedId !== null) await queryClient.invalidateQueries({ queryKey: ["member", selectedId] });
    },
    onError: (e) => {
      setOk(null);
      setErr(getApiErrorMessage(e));
    },
  });

  const filteredUsers = useMemo(() => {
    const source = users.data ?? [];
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q)
    );
  }, [users.data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (users.isError) return <p className="text-sm text-rose-700">{getApiErrorMessage(users.error)}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User management</h1>
        <p className="mt-1 text-sm text-slate-500">View all users and edit profile, role, status, title, and position.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">All users</p>
          <div className="w-full max-w-sm">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by name, phone, or email"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Position</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-4 py-3">{u.phoneNumber}</td>
                  <td className="px-4 py-3">{u.roles.join(", ")}</td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3">{u.title ?? "-"}</td>
                  <td className="px-4 py-3">{u.position ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(u.id);
                        setErr(null);
                        setOk(null);
                        setDrawerOpen(true);
                      }}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!pagedUsers.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <p>
            Showing {(page - 1) * pageSize + (pagedUsers.length ? 1 : 0)}-
            {(page - 1) * pageSize + pagedUsers.length} of {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {drawerOpen ? <div className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden" onClick={() => setDrawerOpen(false)} /> : null}
      <aside
        className={`fixed right-0 top-0 z-40 h-svh w-full max-w-xl border-l border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">Edit user</p>
            <p className="text-xs text-slate-500">Update user information, role, status, title, and position.</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {!selectedId ? (
          <p className="text-sm text-slate-500">Select a user from the table.</p>
        ) : selected.isLoading ? (
          <p className="text-sm text-slate-500">Loading user…</p>
        ) : selected.isError ? (
          <p className="text-sm text-rose-700">{getApiErrorMessage(selected.error)}</p>
        ) : selected.data && form ? (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedId) return;
              update.mutate({ id: selectedId, body: form });
            }}
          >
            {err ? <p className="md:col-span-2 text-sm text-rose-700">{err}</p> : null}
            {ok ? <p className="md:col-span-2 text-sm text-emerald-700">{ok}</p> : null}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.fullName}
                onChange={(e) => setForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value || null } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Date of birth</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.dateOfBirth ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, dateOfBirth: e.target.value || null } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Title</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value || null } : f))}
              >
                <option value="">Select title</option>
                {TITLE_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Position</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.position ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, position: e.target.value || null } : f))}
              >
                <option value="">Select position</option>
                {POSITION_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Role</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.role}
                onChange={(e) => setForm((f) => (f ? { ...f, role: e.target.value as "Admin" | "Member" } : f))}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Account status</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value as "Active" | "Inactive" } : f))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600">Address</label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value || null } : f))}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {update.isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(buildFormData(selected.data));
                  setErr(null);
                  setOk(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Reset
              </button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
